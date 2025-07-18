/**
 * @fileoverview SQLite implementation of WorkDayRepository.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { WorkDay, WorkDayDate } from '../../domain/index';
import { WorkDayRepository } from '../../domain/repositories/work-day.repository';
import { SqliteDatabaseService } from '../services/sqlite-database.service';

@Injectable({
  providedIn: 'root'
})
export class SqliteWorkDayRepository implements WorkDayRepository {
  
  constructor(private databaseService: SqliteDatabaseService) {}

  async save(workDay: WorkDay): Promise<void> {
    await this.databaseService.initialize();
    const db = this.databaseService.getDatabase();
    
    try {
      const now = new Date().toISOString();
      const workDayData = workDay.toData();
      
      // Save work day
      db.run(`
        INSERT OR REPLACE INTO work_days (date, status, pause_deduction_applied, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `, [
        workDayData.date,
        workDayData.status,
        workDayData.pauseDeductionApplied ? 1 : 0,
        now,
        now
      ]);

      // Save completed sessions
      for (const sessionData of workDayData.sessions) {
        db.run(`
          INSERT OR REPLACE INTO work_sessions (id, work_date, start_time, end_time, duration, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          sessionData.id,
          sessionData.date,
          sessionData.startTime,
          sessionData.endTime,
          sessionData.duration,
          now,
          now
        ]);
      }

      // Handle current session if exists
      if (workDayData.currentSession) {
        db.run(`
          INSERT OR REPLACE INTO work_sessions (id, work_date, start_time, end_time, duration, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          workDayData.currentSession.id,
          workDayData.currentSession.date,
          workDayData.currentSession.startTime,
          workDayData.currentSession.endTime,
          workDayData.currentSession.duration,
          now,
          now
        ]);
      }

      await this.databaseService.saveToStorage();
    } catch (error) {
      console.error('Error saving work day to SQLite:', error);
      throw error;
    }
  }

  async findByDate(date: WorkDayDate): Promise<WorkDay | null> {
    await this.databaseService.initialize();
    const db = this.databaseService.getDatabase();
    
    try {
      const dateString = date.toISOString();
      
      // Get work day data
      const workDayResult = db.exec(`
        SELECT date, status, pause_deduction_applied
        FROM work_days 
        WHERE date = ?
      `, [dateString]);

      if (!workDayResult.length || !workDayResult[0].values.length) {
        return null;
      }

      const workDayRow = workDayResult[0].values[0];
      
      // Get sessions for this work day
      const sessionsResult = db.exec(`
        SELECT id, work_date, start_time, end_time, duration
        FROM work_sessions 
        WHERE work_date = ?
        ORDER BY start_time ASC
      `, [dateString]);

      const sessions = sessionsResult.length > 0 ? 
        sessionsResult[0].values.map(row => ({
          id: row[0] as string,
          date: row[1] as string,
          startTime: row[2] as string,
          endTime: row[3] as string | null,
          duration: row[4] as number
        })) : [];

      // Separate completed sessions from current session (if any)
      const completedSessions = sessions.filter(s => s.endTime !== null);
      const currentSession = sessions.find(s => s.endTime === null) || null;

      const workDayData = {
        date: workDayRow[0] as string,
        status: workDayRow[1] as string,
        pauseDeductionApplied: (workDayRow[2] as number) === 1,
        sessions: completedSessions,
        currentSession
      };

      return WorkDay.fromData(workDayData);
    } catch (error) {
      console.error('Error finding work day by date from SQLite:', error);
      return null;
    }
  }

  async findAll(): Promise<WorkDay[]> {
    await this.databaseService.initialize();
    const db = this.databaseService.getDatabase();
    
    try {
      // Get all work days
      const workDaysResult = db.exec(`
        SELECT date, status, pause_deduction_applied
        FROM work_days 
        ORDER BY date DESC
      `);

      if (!workDaysResult.length) {
        return [];
      }

      const workDays: WorkDay[] = [];
      
      for (const row of workDaysResult[0].values) {
        const dateString = row[0] as string;
        
        // Get sessions for this work day
        const sessionsResult = db.exec(`
          SELECT id, work_date, start_time, end_time, duration
          FROM work_sessions 
          WHERE work_date = ?
          ORDER BY start_time ASC
        `, [dateString]);

        const sessions = sessionsResult.length > 0 ? 
          sessionsResult[0].values.map(sessionRow => ({
            id: sessionRow[0] as string,
            date: sessionRow[1] as string,
            startTime: sessionRow[2] as string,
            endTime: sessionRow[3] as string | null,
            duration: sessionRow[4] as number
          })) : [];

        // Separate completed sessions from current session
        const completedSessions = sessions.filter(s => s.endTime !== null);
        const currentSession = sessions.find(s => s.endTime === null) || null;

        const workDayData = {
          date: row[0] as string,
          status: row[1] as string,
          pauseDeductionApplied: (row[2] as number) === 1,
          sessions: completedSessions,
          currentSession
        };

        workDays.push(WorkDay.fromData(workDayData));
      }

      return workDays;
    } catch (error) {
      console.error('Error finding all work days from SQLite:', error);
      return [];
    }
  }

  async delete(date: WorkDayDate): Promise<void> {
    await this.databaseService.initialize();
    const db = this.databaseService.getDatabase();
    
    try {
      const dateString = date.toISOString();
      
      // Delete sessions first (due to foreign key constraint)
      db.run(`DELETE FROM work_sessions WHERE work_date = ?`, [dateString]);
      
      // Delete work day
      db.run(`DELETE FROM work_days WHERE date = ?`, [dateString]);
      
      await this.databaseService.saveToStorage();
    } catch (error) {
      console.error('Error deleting work day from SQLite:', error);
      throw error;
    }
  }

  async exists(date: WorkDayDate): Promise<boolean> {
    await this.databaseService.initialize();
    const db = this.databaseService.getDatabase();
    
    try {
      const result = db.exec(`
        SELECT COUNT(*) as count 
        FROM work_days 
        WHERE date = ?
      `, [date.toISOString()]);

      return result.length > 0 && result[0].values.length > 0 && result[0].values[0][0] > 0;
    } catch (error) {
      console.error('Error checking if work day exists in SQLite:', error);
      return false;
    }
  }
}