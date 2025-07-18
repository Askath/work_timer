/**
 * @fileoverview SQLite implementation of TimerStateRepository.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { TimerStatus, WorkDayDate } from '../../domain/index';
import { TimerStateRepository, TimerStateData } from '../../domain/repositories/timer-state.repository';
import { SqliteDatabaseService } from '../services/sqlite-database.service';

@Injectable({
  providedIn: 'root'
})
export class SqliteTimerStateRepository implements TimerStateRepository {
  
  constructor(private databaseService: SqliteDatabaseService) {}

  async saveCurrentState(state: TimerStateData): Promise<void> {
    await this.databaseService.initialize();
    const db = this.databaseService.getDatabase();
    
    try {
      const now = new Date().toISOString();
      
      db.run(`
        INSERT OR REPLACE INTO timer_state (id, current_work_date, status, current_session_start_time, current_session_time, last_updated)
        VALUES ('default', ?, ?, ?, ?, ?)
      `, [
        state.date.toISOString(),
        state.status.value,
        state.currentSessionStartTime?.toISOString() || null,
        state.currentSessionTime,
        now
      ]);

      await this.databaseService.saveToStorage();
    } catch (error) {
      console.error('Error saving timer state to SQLite:', error);
      throw error;
    }
  }

  async loadCurrentState(): Promise<TimerStateData | null> {
    await this.databaseService.initialize();
    const db = this.databaseService.getDatabase();
    
    try {
      const result = db.exec(`
        SELECT current_work_date, status, current_session_start_time, current_session_time
        FROM timer_state 
        WHERE id = 'default'
      `);

      if (!result.length || !result[0].values.length) {
        return null;
      }

      const row = result[0].values[0];
      
      if (!row[0]) { // No current work date
        return null;
      }

      return {
        date: WorkDayDate.fromString(row[0] as string),
        status: TimerStatus.fromString(row[1] as string),
        currentSessionStartTime: row[2] ? new Date(row[2] as string) : undefined,
        currentSessionTime: row[3] as number
      };
    } catch (error) {
      console.error('Error loading timer state from SQLite:', error);
      return null;
    }
  }

  async clearCurrentState(): Promise<void> {
    await this.databaseService.initialize();
    const db = this.databaseService.getDatabase();
    
    try {
      const now = new Date().toISOString();
      
      db.run(`
        UPDATE timer_state 
        SET current_work_date = NULL, 
            status = 'STOPPED', 
            current_session_start_time = NULL, 
            current_session_time = 0,
            last_updated = ?
        WHERE id = 'default'
      `, [now]);

      await this.databaseService.saveToStorage();
    } catch (error) {
      console.error('Error clearing timer state from SQLite:', error);
      throw error;
    }
  }

  async hasActiveSession(): Promise<boolean> {
    const state = await this.loadCurrentState();
    return state !== null && state.status.isRunning();
  }
}