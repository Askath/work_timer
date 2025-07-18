/**
 * @fileoverview Type definitions for component data interfaces.
 * @author Work Timer Application
 */

/**
 * Data interface for the daily summary component display.
 */
export interface DailySummaryData {
  /** Total accumulated work time formatted as HH:MM:SS */
  totalWorkTime: string;
  /** Effective work time after deductions formatted as HH:MM:SS */
  effectiveWorkTime: string;
  /** Total pause time formatted as HH:MM:SS */
  pauseTime: string;
  /** Pause deduction amount formatted as HH:MM:SS */
  pauseDeduction: string;
}

/**
 * Data interface for timer controls component state and actions.
 */
export interface TimerControlsData {
  /** Text to display on the main action button */
  buttonText: string;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Whether the main button should be disabled */
  isDisabled: boolean;
  /** Whether the reset button should be enabled */
  canReset: boolean;
}

/**
 * Data interface for current session display component.
 */
export interface CurrentSessionData {
  /** Current session time formatted as HH:MM:SS */
  sessionTime: string;
  /** Current timer status text (Running, Stopped, Paused) */
  status: string;
  /** CSS class name for status styling */
  statusClass: string;
  /** Current session count number */
  sessionCount: number;
}

/**
 * Data interface for progress display component.
 */
export interface ProgressData {
  /** Progress percentage (0-100) towards daily limit */
  progressPercentage: number;
  /** Formatted progress text with percentage */
  progressText: string;
  /** Remaining time until daily limit formatted as HH:MM:SS */
  remainingTime: string;
  /** Whether the daily work limit has been reached */
  isComplete: boolean;
}

/**
 * Data interface for app header component.
 */
export interface HeaderData {
  /** Application title */
  title: string;
  /** Current date formatted for display */
  currentDate: string;
}

/**
 * Events emitted by timer controls component.
 */
export interface TimerControlsEvents {
  /** Emitted when start/stop button is clicked */
  startStopClicked: void;
  /** Emitted when reset button is clicked */
  resetClicked: void;
}

/**
 * Combined data interface for the entire dashboard container.
 */
export interface DashboardData {
  /** Header section data */
  header: HeaderData;
  /** Timer controls data */
  controls: TimerControlsData;
  /** Current session data */
  session: CurrentSessionData;
  /** Daily summary metrics */
  summary: DailySummaryData;
  /** Progress display data */
  progress: ProgressData;
  /** Work completion status */
  isWorkComplete: boolean;
}