/**
 * @fileoverview Legacy timer status enum for backward compatibility.
 * @author Work Timer Application
 * @deprecated Use domain TimerStatus instead. This is maintained for legacy adapter compatibility.
 */

/**
 * Legacy timer status enumeration.
 * @deprecated Use domain TimerStatus value object instead.
 */
export enum TimerStatus {
  STOPPED = 'STOPPED',
  RUNNING = 'RUNNING', 
  PAUSED = 'PAUSED'
}