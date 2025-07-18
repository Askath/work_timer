/**
 * @fileoverview Timer state repository interface.
 * @author Work Timer Application
 */

import { TimerStatus, WorkDayDate } from '../index';

export interface TimerStateData {
  readonly status: TimerStatus;
  readonly currentSessionStartTime?: Date;
  readonly currentSessionTime: number;
  readonly date: WorkDayDate;
}

export interface TimerStateRepository {
  saveCurrentState(state: TimerStateData): Promise<void>;
  loadCurrentState(): Promise<TimerStateData | null>;
  clearCurrentState(): Promise<void>;
  hasActiveSession(): Promise<boolean>;
}