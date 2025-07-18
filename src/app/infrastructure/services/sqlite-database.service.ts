/**
 * @fileoverview SQLite database service for managing database initialization and connections.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import initSqlJs, { Database } from 'sql.js';

@Injectable({
  providedIn: 'root'
})
export class SqliteDatabaseService {
  private database: Database | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const SQL = await initSqlJs({
        locateFile: (file: string) => `/assets/${file}`
      });

      const existingData = localStorage.getItem('work-timer-sqlite-db');
      if (existingData) {
        const data = new Uint8Array(JSON.parse(existingData));
        this.database = new SQL.Database(data);
      } else {
        this.database = new SQL.Database();
        await this.createTables();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  getDatabase(): Database {
    if (!this.database) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.database;
  }

  async saveToStorage(): Promise<void> {
    if (!this.database) {
      return;
    }

    try {
      const data = this.database.export();
      localStorage.setItem('work-timer-sqlite-db', JSON.stringify(Array.from(data)));
    } catch (error) {
      console.error('Failed to save database to localStorage:', error);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.database) {
      return;
    }

    const createWorkDaysTable = `
      CREATE TABLE IF NOT EXISTS work_days (
        date TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        pause_deduction_applied INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `;

    const createWorkSessionsTable = `
      CREATE TABLE IF NOT EXISTS work_sessions (
        id TEXT PRIMARY KEY,
        work_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        duration INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (work_date) REFERENCES work_days (date)
      )
    `;

    const createTimerStateTable = `
      CREATE TABLE IF NOT EXISTS timer_state (
        id TEXT PRIMARY KEY,
        current_work_date TEXT,
        status TEXT NOT NULL,
        current_session_start_time TEXT,
        current_session_time INTEGER DEFAULT 0,
        last_updated TEXT NOT NULL
      )
    `;

    try {
      this.database.run(createWorkDaysTable);
      this.database.run(createWorkSessionsTable);
      this.database.run(createTimerStateTable);
      
      // Insert default timer state if it doesn't exist
      this.database.run(`
        INSERT OR IGNORE INTO timer_state (id, status, last_updated)
        VALUES ('default', 'STOPPED', datetime('now'))
      `);

      await this.saveToStorage();
    } catch (error) {
      console.error('Failed to create database tables:', error);
      throw error;
    }
  }

  async migrateFromLocalStorage(): Promise<void> {
    if (!this.database) {
      return;
    }

    try {
      // Check if migration has already been done
      const migrationCheck = this.database.exec(`
        SELECT COUNT(*) as count FROM work_days
      `);
      
      if (migrationCheck.length > 0 && (migrationCheck[0].values[0][0] as number) > 0) {
        return; // Already migrated
      }

      // Migrate work days from localStorage
      const workDaysData = localStorage.getItem('work-timer-workdays');
      if (workDaysData) {
        const workDays = JSON.parse(workDaysData);
        for (const workDayData of workDays) {
          const now = new Date().toISOString();
          this.database.run(`
            INSERT OR REPLACE INTO work_days (date, status, pause_deduction_applied, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
          `, [
            workDayData.date,
            workDayData.status || 'STOPPED',
            workDayData.pauseDeductionApplied ? 1 : 0,
            now,
            now
          ]);

          // Migrate sessions for this work day
          if (workDayData.sessions) {
            for (const sessionData of workDayData.sessions) {
              this.database.run(`
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
          }
        }
      }

      // Migrate work sessions from localStorage
      const sessionsData = localStorage.getItem('work-timer-sessions');
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData);
        for (const sessionData of sessions) {
          const now = new Date().toISOString();
          this.database.run(`
            INSERT OR IGNORE INTO work_sessions (id, work_date, start_time, end_time, duration, created_at, updated_at)
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
      }

      await this.saveToStorage();
      console.log('Successfully migrated data from localStorage to SQLite');
    } catch (error) {
      console.error('Failed to migrate from localStorage:', error);
    }
  }
}