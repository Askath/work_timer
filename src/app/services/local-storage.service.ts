/**
 * @fileoverview Local storage service for persisting work timer data.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { DailyTimeData, TimerState, TimeSession } from '../models';

/**
 * Service for managing local storage operations for the work timer application.
 * Handles persistence of daily time data, timer state, and individual sessions.
 * Provides error handling and data serialization/deserialization.
 * @class
 */
@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  /** Storage key for daily time data */
  private readonly DAILY_DATA_KEY = 'work_timer_daily_data';
  /** Storage key for timer state */
  private readonly TIMER_STATE_KEY = 'work_timer_state';
  /** Storage key for individual sessions */
  private readonly SESSIONS_KEY = 'work_timer_sessions';

  /**
   * Saves daily time data to localStorage.
   * Updates existing data for the date or creates new entry.
   * @param {DailyTimeData} data - The daily time data to save
   * @returns {void}
   */
  saveDailyData(data: DailyTimeData): void {
    try {
      const existingData = this.getAllDailyData();
      existingData[data.date] = data;
      localStorage.setItem(this.DAILY_DATA_KEY, JSON.stringify(existingData));
    } catch (error) {
      console.error('Error saving daily data:', error);
    }
  }

  /**
   * Retrieves daily time data for a specific date.
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {DailyTimeData | null} The daily time data or null if not found
   */
  getDailyData(date: string): DailyTimeData | null {
    try {
      const allData = this.getAllDailyData();
      return allData[date] || null;
    } catch (error) {
      console.error('Error getting daily data:', error);
      return null;
    }
  }

  /**
   * Retrieves all daily time data from localStorage.
   * @returns {{ [date: string]: DailyTimeData }} Object with dates as keys and DailyTimeData as values
   */
  getAllDailyData(): { [date: string]: DailyTimeData } {
    try {
      const data = localStorage.getItem(this.DAILY_DATA_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting all daily data:', error);
      return {};
    }
  }

  /**
   * Saves timer state to localStorage.
   * Serializes Date objects to ISO strings for storage.
   * @param {TimerState} state - The timer state to save
   * @returns {void}
   */
  saveTimerState(state: TimerState): void {
    try {
      const serializedState = {
        ...state,
        startTime: state.startTime?.toISOString() || null,
        currentSessionStart: state.currentSessionStart?.toISOString() || null
      };
      localStorage.setItem(this.TIMER_STATE_KEY, JSON.stringify(serializedState));
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  }

  /**
   * Retrieves timer state from localStorage.
   * Deserializes ISO strings back to Date objects.
   * @returns {TimerState | null} The timer state or null if not found
   */
  getTimerState(): TimerState | null {
    try {
      const data = localStorage.getItem(this.TIMER_STATE_KEY);
      if (!data) return null;
      
      const parsedState = JSON.parse(data);
      return {
        ...parsedState,
        startTime: parsedState.startTime ? new Date(parsedState.startTime) : null,
        currentSessionStart: parsedState.currentSessionStart ? new Date(parsedState.currentSessionStart) : null
      };
    } catch (error) {
      console.error('Error getting timer state:', error);
      return null;
    }
  }

  /**
   * Saves a time session to localStorage.
   * Appends the session to existing sessions array.
   * @param {TimeSession} session - The time session to save
   * @returns {void}
   */
  saveSession(session: TimeSession): void {
    try {
      const sessions = this.getAllSessions();
      sessions.push({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : null
      });
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  /**
   * Retrieves all time sessions from localStorage.
   * Deserializes Date objects from stored strings.
   * @returns {TimeSession[]} Array of all time sessions
   */
  getAllSessions(): TimeSession[] {
    try {
      const data = localStorage.getItem(this.SESSIONS_KEY);
      if (!data) return [];
      
      const sessions = JSON.parse(data);
      return sessions.map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : null
      }));
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  /**
   * Retrieves time sessions for a specific date.
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {TimeSession[]} Array of time sessions for the specified date
   */
  getSessionsByDate(date: string): TimeSession[] {
    try {
      const allSessions = this.getAllSessions();
      return allSessions.filter(session => session.date === date);
    } catch (error) {
      console.error('Error getting sessions by date:', error);
      return [];
    }
  }

  /**
   * Clears all work timer data from localStorage.
   * Removes daily data, timer state, and all sessions.
   * @returns {void}
   */
  clearData(): void {
    try {
      localStorage.removeItem(this.DAILY_DATA_KEY);
      localStorage.removeItem(this.TIMER_STATE_KEY);
      localStorage.removeItem(this.SESSIONS_KEY);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  /**
   * Formats a Date object to YYYY-MM-DD string format.
   * @private
   * @param {Date} date - The date to format
   * @returns {string} The formatted date string
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}