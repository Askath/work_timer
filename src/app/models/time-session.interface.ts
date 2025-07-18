/**
 * @fileoverview Time session interface for tracking individual work sessions.
 * @author Work Timer Application
 */

/**
 * Interface representing a single work session with start, end, and duration information.
 * Used to track individual work periods and store them in local storage.
 * @interface
 */
export interface TimeSession {
  /** Unique identifier for the session */
  id: string;
  
  /** The date and time when the session started */
  startTime: Date;
  
  /** The date and time when the session ended, null if still in progress */
  endTime: Date | null;
  
  /** Duration of the session in milliseconds */
  duration: number;
  
  /** Whether this session represents a pause period (currently unused) */
  isPause: boolean;
  
  /** The date of the session in YYYY-MM-DD format for grouping */
  date: string;
}