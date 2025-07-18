/**
 * @fileoverview Data migration utility for transitioning from legacy localStorage to new DDD architecture.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { LocalStorageService } from '../../services/local-storage.service';
import { WorkSession, WorkDay, Duration, WorkDayDate, TimerStatus } from '../../domain';
import { TimerState, TimeSession, DailyTimeData } from '../../models';

/**
 * Interface defining the structure of legacy data to be migrated.
 */
export interface LegacyDataSnapshot {
  timerState: TimerState | null;
  sessions: TimeSession[];
  dailyData: { [date: string]: DailyTimeData };
  timestamp: Date;
}

/**
 * Migration result interface containing success/failure information.
 */
export interface MigrationResult {
  success: boolean;
  message: string;
  migratedSessions: number;
  migratedDays: number;
  errors: string[];
}

/**
 * Service responsible for migrating legacy localStorage data to the new DDD architecture.
 * Provides backup, migration, and rollback capabilities.
 */
@Injectable({
  providedIn: 'root'
})
export class DataMigrator {
  private readonly BACKUP_KEY = 'work_timer_legacy_backup';
  private readonly MIGRATION_STATUS_KEY = 'work_timer_migration_status';

  constructor(private legacyStorageService: LocalStorageService) {}

  /**
   * Creates a backup of all existing legacy data before migration.
   * @returns {LegacyDataSnapshot} Snapshot of current data
   */
  createBackup(): LegacyDataSnapshot {
    const snapshot: LegacyDataSnapshot = {
      timerState: this.legacyStorageService.getTimerState(),
      sessions: this.legacyStorageService.getAllSessions(),
      dailyData: this.legacyStorageService.getAllDailyData(),
      timestamp: new Date()
    };

    // Save backup to localStorage
    try {
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(snapshot));
      console.log('Legacy data backup created successfully');
    } catch (error) {
      console.error('Failed to create backup:', error);
    }

    return snapshot;
  }

  /**
   * Migrates legacy data to the new domain model format.
   * @param {LegacyDataSnapshot} snapshot - The legacy data to migrate
   * @returns {Promise<MigrationResult>} Result of the migration process
   */
  async migrateData(snapshot: LegacyDataSnapshot): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      message: '',
      migratedSessions: 0,
      migratedDays: 0,
      errors: []
    };

    try {
      // Step 1: Convert legacy sessions to domain WorkSession objects
      const workSessions = this.convertLegacySessions(snapshot.sessions);
      result.migratedSessions = workSessions.length;

      // Step 2: Group sessions by date and create WorkDay aggregates
      const workDays = this.createWorkDaysFromSessions(workSessions);
      result.migratedDays = workDays.length;

      // Step 3: Validate migrated data
      const validationErrors = this.validateMigratedData(workDays, workSessions);
      result.errors = validationErrors;

      if (validationErrors.length > 0) {
        result.success = false;
        result.message = `Migration failed with ${validationErrors.length} validation errors`;
        return result;
      }

      // Step 4: Mark migration as successful
      this.markMigrationComplete();
      result.success = true;
      result.message = 'Migration completed successfully';

      console.log('Data migration completed:', result);
      return result;

    } catch (error) {
      result.success = false;
      result.message = `Migration failed: ${error}`;
      result.errors.push(error as string);
      console.error('Migration failed:', error);
      return result;
    }
  }

  /**
   * Converts legacy TimeSession objects to domain WorkSession objects.
   * @param {TimeSession[]} legacySessions - Array of legacy sessions
   * @returns {WorkSession[]} Array of domain work sessions
   */
  private convertLegacySessions(legacySessions: TimeSession[]): WorkSession[] {
    return legacySessions
      .filter(session => !session.isPause) // Filter out pause sessions
      .map(session => {
        try {
          return WorkSession.fromData({
            id: session.id,
            startTime: session.startTime,
            endTime: session.endTime!,
            duration: session.duration,
            date: session.date
          });
        } catch (error) {
          console.warn(`Failed to convert session ${session.id}:`, error);
          return null;
        }
      })
      .filter(session => session !== null) as WorkSession[];
  }

  /**
   * Groups work sessions by date and creates WorkDay aggregate objects.
   * @param {WorkSession[]} workSessions - Array of work sessions
   * @returns {WorkDay[]} Array of work day aggregates
   */
  private createWorkDaysFromSessions(workSessions: WorkSession[]): WorkDay[] {
    // Group sessions by date
    const sessionsByDate = new Map<string, WorkSession[]>();
    
    workSessions.forEach(session => {
      const dateString = session.workDate.toISOString();
      if (!sessionsByDate.has(dateString)) {
        sessionsByDate.set(dateString, []);
      }
      sessionsByDate.get(dateString)!.push(session);
    });

    // Create WorkDay aggregates
    return Array.from(sessionsByDate.entries()).map(([dateString, sessions]) => {
      const workDay = new WorkDay(
        WorkDayDate.fromString(dateString),
        sessions,
        null, // no current session
        TimerStatus.STOPPED, // Default to stopped after migration
        false // pause deduction not applied
      );
      return workDay;
    });
  }

  /**
   * Validates the migrated data for consistency and completeness.
   * @param {WorkDay[]} workDays - Array of work days
   * @param {WorkSession[]} workSessions - Array of work sessions
   * @returns {string[]} Array of validation error messages
   */
  private validateMigratedData(workDays: WorkDay[], workSessions: WorkSession[]): string[] {
    const errors: string[] = [];

    // Validate that all sessions are assigned to work days
    const sessionIds = workSessions.map(s => s.id);
    const assignedSessionIds = workDays.flatMap(wd => wd.sessions.map(s => s.id));
    
    const unassignedSessions = sessionIds.filter(id => !assignedSessionIds.includes(id));
    if (unassignedSessions.length > 0) {
      errors.push(`${unassignedSessions.length} sessions were not assigned to work days`);
    }

    // Validate work day calculations
    workDays.forEach(workDay => {
      try {
        // Validate that duration calculations are consistent
        const totalDuration = workDay.sessions.reduce(
          (sum, session) => sum.add(session.duration),
          Duration.zero()
        );
        
        if (totalDuration.isZero() && workDay.sessions.length > 0) {
          errors.push(`Work day ${workDay.date.toString()} has sessions but zero duration`);
        }
      } catch (error) {
        errors.push(`Work day ${workDay.date.toString()} validation failed: ${error}`);
      }
    });

    return errors;
  }

  /**
   * Restores data from the backup in case of migration failure.
   * @returns {boolean} True if rollback was successful
   */
  restoreFromBackup(): boolean {
    try {
      const backupData = localStorage.getItem(this.BACKUP_KEY);
      if (!backupData) {
        console.error('No backup data found for rollback');
        return false;
      }

      const snapshot: LegacyDataSnapshot = JSON.parse(backupData);
      
      // Restore legacy data
      if (snapshot.timerState) {
        this.legacyStorageService.saveTimerState(snapshot.timerState);
      }
      
      // Clear and restore sessions
      localStorage.removeItem('work_timer_sessions');
      snapshot.sessions.forEach(session => {
        this.legacyStorageService.saveSession(session);
      });
      
      // Restore daily data
      Object.values(snapshot.dailyData).forEach(dailyData => {
        this.legacyStorageService.saveDailyData(dailyData);
      });

      console.log('Successfully restored from backup');
      return true;

    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * Checks if migration has been completed.
   * @returns {boolean} True if migration is complete
   */
  isMigrationComplete(): boolean {
    const status = localStorage.getItem(this.MIGRATION_STATUS_KEY);
    return status === 'completed';
  }

  /**
   * Marks the migration as complete.
   */
  private markMigrationComplete(): void {
    localStorage.setItem(this.MIGRATION_STATUS_KEY, 'completed');
  }

  /**
   * Resets the migration status (for testing purposes).
   */
  resetMigrationStatus(): void {
    localStorage.removeItem(this.MIGRATION_STATUS_KEY);
  }

  /**
   * Cleans up migration artifacts after successful migration.
   */
  cleanupMigrationArtifacts(): void {
    // Remove backup after successful migration (optional)
    // localStorage.removeItem(this.BACKUP_KEY);
    
    // Keep backup for safety, but could be removed after a certain period
    console.log('Migration artifacts retained for safety');
  }

  /**
   * Gets migration statistics for reporting.
   * @returns {object} Migration statistics
   */
  getMigrationStats(): {
    hasBackup: boolean;
    backupTimestamp: Date | null;
    isComplete: boolean;
    backupSize: number;
  } {
    const backupData = localStorage.getItem(this.BACKUP_KEY);
    let backupTimestamp: Date | null = null;
    let backupSize = 0;

    if (backupData) {
      try {
        const snapshot: LegacyDataSnapshot = JSON.parse(backupData);
        backupTimestamp = new Date(snapshot.timestamp);
        backupSize = backupData.length;
      } catch (error) {
        console.error('Failed to parse backup metadata:', error);
      }
    }

    return {
      hasBackup: !!backupData,
      backupTimestamp,
      isComplete: this.isMigrationComplete(),
      backupSize
    };
  }
}