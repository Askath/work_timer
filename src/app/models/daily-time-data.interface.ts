/**
 * @fileoverview Daily time data interfaces for aggregating work time information.
 * @author Work Timer Application
 */

import { TimeSession } from './time-session.interface';

/**
 * Interface representing aggregated time data for a single day.
 * Contains all work sessions, calculated totals, and deductions for the day.
 * @interface
 */
export interface DailyTimeData {
  /** The date for this data in YYYY-MM-DD format */
  date: string;
  
  /** Array of all work sessions for this day */
  sessions: TimeSession[];
  
  /** Total work time accumulated across all sessions in milliseconds */
  totalWorkTime: number;
  
  /** Total pause time between sessions in milliseconds */
  totalPauseTime: number;
  
  /** Amount of time deducted due to pause rules in milliseconds (30 min if pause 0-30 min) */
  pauseDeduction: number;
  
  /** Effective work time after deductions (totalWorkTime - pauseDeduction) */
  effectiveWorkTime: number;
  
  /** Remaining time until 10-hour limit (10 hours - effectiveWorkTime) */
  remainingTime: number;
  
  /** Whether the 10-hour daily limit has been reached */
  isComplete: boolean;
  
  /** When this daily data record was first created */
  createdAt: Date;
  
  /** When this daily data record was last updated */
  updatedAt: Date;
}

/**
 * Interface representing calculated work time values without metadata.
 * Used for internal calculations and temporary state.
 * @interface
 */
export interface WorkTimeCalculations {
  /** Total work time in milliseconds */
  totalWorkTime: number;
  
  /** Total pause time in milliseconds */
  totalPauseTime: number;
  
  /** Amount deducted due to pause rules in milliseconds */
  pauseDeduction: number;
  
  /** Effective work time after deductions in milliseconds */
  effectiveWorkTime: number;
  
  /** Remaining time until 10-hour limit in milliseconds */
  remainingTime: number;
  
  /** Whether the 10-hour daily limit has been reached */
  isComplete: boolean;
}