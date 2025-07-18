/**
 * @fileoverview SQLite implementation of WorkSessionRepository.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { WorkSession, WorkDayDate } from '../../domain/index';
import { WorkSessionRepository } from '../../domain/repositories/work-session.repository';
import { SqliteDatabaseService } from '../services/sqlite-database.service';
import { SqlValue } from 'sql.js';

@Injectable({
  providedIn: 'root'
})
export class SqliteWorkSessionRepository implements WorkSessionRepository {
  
  constructor(private databaseService: SqliteDatabaseService) {}

  async save(session: WorkSession): Promise<void> {
    await this.databaseService.initialize();
    const db = this.databaseService.getDatabase();
    
    try {
      const now = new Date().toISOString();
      const sessionData = session.toData();
      
      db.run(`
        INSERT OR REPLACE INTO work_sessions (id, work_date, start_time, end_time, duration, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        sessionData.id,
        sessionData.date,
        sessionData.startTime.toISOString(),
        sessionData.endTime?.toISOString() || null,
        sessionData.duration,
        now,
        now
      ]);

      await this.databaseService.saveToStorage();
    } catch (error) {
      console.error('Error saving work session to SQLite:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<WorkSession | null> {
    await this.databaseService.initialize();
    const db = this.databaseService.getDatabase();
    
    try {
      const result = db.exec(`
        SELECT id, work_date, start_time, end_time, duration
        FROM work_sessions 
        WHERE id = ?
      `, [id]);

      if (!result.length || !result[0].values.length) {
        return null;
      }

      const row = result[0].values[0];
      const sessionData = {
        id: row[0] as string,
        date: row[1] as string,
        startTime: new Date(row[2] as string),
        endTime: row[3] ? new Date(row[3] as string) : null,
        duration: row[4] as number
      };

      return WorkSession.fromData(sessionData);
    } catch (error) {
      console.error('Error finding work session by id from SQLite:', error);
      return null;
    }
  }

  async findByDate(date: WorkDayDate): Promise<WorkSession[]> {
    await this.databaseService.initialize();
    const db = this.databaseService.getDatabase();
    
    try {
      const result = db.exec(`
        SELECT id, work_date, start_time, end_time, duration
        FROM work_sessions 
        WHERE work_date = ?
        ORDER BY start_time ASC
      `, [date.toISOString()]);

      if (!result.length) {
        return [];
      }

      return result[0].values.map((row: SqlValue[]) => {
        const sessionData = {
          id: row[0] as string,
          date: row[1] as string,
          startTime: new Date(row[2] as string),
          endTime: row[3] ? new Date(row[3] as string) : null,
          duration: row[4] as number
        };

        return WorkSession.fromData(sessionData);
      });
    } catch (error) {
      console.error('Error finding work sessions by date from SQLite:', error);
      return [];
    }
  }

  async findAll(): Promise<WorkSession[]> {
    await this.databaseService.initialize();
    const db = this.databaseService.getDatabase();
    
    try {
      const result = db.exec(`
        SELECT id, work_date, start_time, end_time, duration
        FROM work_sessions 
        ORDER BY work_date DESC, start_time ASC
      `);

      if (!result.length) {
        return [];
      }

      return result[0].values.map((row: SqlValue[]) => {
        const sessionData = {
          id: row[0] as string,
          date: row[1] as string,
          startTime: new Date(row[2] as string),
          endTime: row[3] ? new Date(row[3] as string) : null,
          duration: row[4] as number
        };

        return WorkSession.fromData(sessionData);
      });
    } catch (error) {
      console.error('Error finding all work sessions from SQLite:', error);
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    await this.databaseService.initialize();
    const db = this.databaseService.getDatabase();
    
    try {
      db.run(`DELETE FROM work_sessions WHERE id = ?`, [id]);
      await this.databaseService.saveToStorage();
    } catch (error) {
      console.error('Error deleting work session from SQLite:', error);
      throw error;
    }
  }

  async deleteByDate(date: WorkDayDate): Promise<void> {
    await this.databaseService.initialize();
    const db = this.databaseService.getDatabase();
    
    try {
      db.run(`DELETE FROM work_sessions WHERE work_date = ?`, [date.toISOString()]);
      await this.databaseService.saveToStorage();
    } catch (error) {
      console.error('Error deleting work sessions by date from SQLite:', error);
      throw error;
    }
  }
}