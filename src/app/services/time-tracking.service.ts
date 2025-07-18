/**
 * @fileoverview Time tracking service for managing work sessions and time calculations.
 * @author Work Timer Application
 */

import { Injectable, signal, computed, effect } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { TimerState, TimerStatus, TimeSession, DailyTimeData, WorkTimeCalculations } from '../models';
import { LegacyTimerAdapter } from '../infrastructure/adapters/legacy-timer.adapter';

/**
 * Core service for managing work time tracking, pause calculations, and daily limits.
 * MIGRATION NOTE: This service now delegates to the new DDD architecture via LegacyTimerAdapter.
 * @deprecated Use TimerFacade directly. This service is maintained for backward compatibility.
 * @class
 */
@Injectable({
  providedIn: 'root'
})
export class TimeTrackingService {
  /** Legacy compatibility adapter that delegates to new architecture */
  private readonly adapter: LegacyTimerAdapter;

  // Delegated computed properties (maintain exact same interface)
  readonly currentStatus = computed(() => this.adapter.currentStatus());
  readonly currentWorkTime = computed(() => this.adapter.currentWorkTime());
  readonly currentPauseTime = computed(() => this.adapter.currentPauseTime());
  readonly currentSessionTime = computed(() => this.adapter.currentSessionTime());
  readonly sessionsCount = computed(() => this.adapter.sessionsCount());
  readonly totalWorkTime = computed(() => this.adapter.totalWorkTime());
  readonly totalPauseTime = computed(() => this.adapter.totalPauseTime());
  readonly pauseDeduction = computed(() => this.adapter.pauseDeduction());
  readonly effectiveWorkTime = computed(() => this.adapter.effectiveWorkTime());
  readonly remainingTime = computed(() => this.adapter.remainingTime());
  readonly isWorkComplete = computed(() => this.adapter.isWorkComplete());

  // Delegated formatted properties
  readonly formattedCurrentTime = computed(() => this.adapter.formattedCurrentTime());
  readonly formattedCurrentSession = computed(() => this.adapter.formattedCurrentSession());
  readonly formattedPauseTime = computed(() => this.adapter.formattedPauseTime());
  readonly formattedEffectiveTime = computed(() => this.adapter.formattedEffectiveTime());
  readonly formattedRemainingTime = computed(() => this.adapter.formattedRemainingTime());

  /**
   * Initializes the time tracking service.
   * Now delegates to new DDD architecture via LegacyTimerAdapter.
   * @param {LocalStorageService} localStorageService - Service for data persistence (legacy, for migration)
   * @param {LegacyTimerAdapter} adapter - Adapter to new architecture
   */
  constructor(
    private localStorageService: LocalStorageService,
    adapter: LegacyTimerAdapter
  ) {
    this.adapter = adapter;
    
    // Migration support - move existing data to new architecture
    this.migrateExistingData();
  }

  /**
   * Starts or resumes the work timer.
   * @deprecated Use TimerFacade.startWork() directly
   * @returns {void}
   */
  startWork(): void {
    this.adapter.startWork();
  }

  /**
   * Stops the work timer and transitions to paused state.
   * @deprecated Use TimerFacade.stopWork() directly
   * @returns {void}
   */
  stopWork(): void {
    this.adapter.stopWork();
  }

  /**
   * Resets the timer to initial state and clears all data.
   * @deprecated Use TimerFacade.resetTimer() directly
   * @returns {void}
   */
  resetTimer(): void {
    this.adapter.resetTimer();
  }

  /**
   * Formats milliseconds into HH:MM:SS string format.
   * @deprecated Use TimerFacade.formatTime() directly
   * @param {number} milliseconds - Time in milliseconds to format
   * @returns {string} Formatted time string (HH:MM:SS)
   */
  formatTime(milliseconds: number): string {
    return this.adapter.formatTime(milliseconds);
  }

  /**
   * Gets the appropriate button text based on current timer status.
   * @deprecated Use TimerFacade.buttonText() directly
   * @returns {string} Button text for current state
   */
  getButtonText(): string {
    return this.adapter.getButtonText();
  }

  /**
   * Gets the current timer status as a display string.
   * @deprecated Use TimerFacade.statusText() directly
   * @returns {string} Human-readable status text
   */
  getStatusText(): string {
    return this.adapter.getStatusText();
  }

  /**
   * Calculates the progress percentage towards the daily 10-hour limit.
   * @deprecated Use TimerFacade.progressPercentage() directly
   * @returns {number} Progress percentage (0-100)
   */
  getProgressPercentage(): number {
    return this.adapter.getProgressPercentage();
  }

  /**
   * Gets formatted progress text for display.
   * @deprecated Use TimerFacade.getProgressText() directly
   * @returns {string} Progress text with percentage
   */
  getProgressText(): string {
    return this.adapter.getProgressText();
  }

  /**
   * Migrates existing data from legacy localStorage format to new architecture.
   * @private
   * @returns {void}
   */
  private migrateExistingData(): void {
    // This will be implemented in the data migration phase
    console.log('Legacy data migration - to be implemented');
  }
}