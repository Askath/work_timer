/**
 * @fileoverview Timer state interfaces and enums for the work timer application.
 * @author Work Timer Application
 */

/**
 * Enum representing the different states of the work timer.
 * @enum {string}
 */
export enum TimerStatus {
  /** Timer is not running and has not been started */
  STOPPED = 'stopped',
  /** Timer is actively running and counting work time */
  RUNNING = 'running',
  /** Timer has been stopped and is in a paused state */
  PAUSED = 'paused'
}

/**
 * Interface representing the complete state of the work timer.
 * Contains all necessary information to track work sessions, pauses, and deductions.
 * @interface
 */
export interface TimerState {
  /** Current status of the timer (stopped, running, or paused) */
  status: TimerStatus;
  
  /** The date and time when the work day was first started, null if never started */
  startTime: Date | null;
  
  /** The date and time when the current session started, null if not running */
  currentSessionStart: Date | null;
  
  /** Total accumulated work time in milliseconds across all sessions */
  totalWorkTime: number;
  
  /** Total accumulated pause time in milliseconds between sessions */
  totalPauseTime: number;
  
  /** Current session elapsed time in milliseconds (resets on each start/stop) */
  currentSessionTime: number;
  
  /** Number of work sessions completed (increments on each start) */
  sessionsCount: number;
  
  /** Amount of time deducted due to pause rules in milliseconds */
  lastPauseDeduction: number;
}