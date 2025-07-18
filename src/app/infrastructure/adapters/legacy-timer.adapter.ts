/**
 * @fileoverview Legacy timer adapter for gradual migration from old to new architecture.
 * @author Work Timer Application
 */

import { Injectable, signal, computed } from '@angular/core';
import { TimerFacade } from '../../application/facades/timer.facade';
import { TimerStatus } from '../../models';

/**
 * Adapter that bridges the old TimeTrackingService interface with the new TimerFacade.
 * Provides backward compatibility during the migration process.
 */
@Injectable({
  providedIn: 'root'
})
export class LegacyTimerAdapter {
  constructor(private timerFacade: TimerFacade) {}

  // Legacy computed properties mapped to new facade
  readonly currentStatus = computed(() => {
    const status = this.timerFacade.currentStatus();
    // Map new domain status to legacy enum
    if (status.isRunning()) return TimerStatus.RUNNING;
    if (status.isPaused()) return TimerStatus.PAUSED;
    return TimerStatus.STOPPED;
  });

  readonly currentWorkTime = computed(() => {
    return this.timerFacade.currentWorkTime().milliseconds;
  });

  readonly currentPauseTime = computed(() => {
    return this.timerFacade.currentPauseTime().milliseconds;
  });

  readonly currentSessionTime = computed(() => {
    return this.timerFacade.currentSessionTime().milliseconds;
  });

  readonly sessionsCount = computed(() => {
    return this.timerFacade.sessionsCount();
  });

  readonly totalWorkTime = computed(() => {
    return this.timerFacade.currentWorkTime().milliseconds;
  });

  readonly totalPauseTime = computed(() => {
    return this.timerFacade.currentPauseTime().milliseconds;
  });

  readonly pauseDeduction = computed(() => {
    return this.timerFacade.pauseDeduction().milliseconds;
  });

  readonly effectiveWorkTime = computed(() => {
    return this.timerFacade.effectiveWorkTime().milliseconds;
  });

  readonly remainingTime = computed(() => {
    return this.timerFacade.remainingTime().milliseconds;
  });

  readonly isWorkComplete = computed(() => {
    return this.timerFacade.isWorkComplete();
  });

  // Formatted properties
  readonly formattedCurrentTime = computed(() => {
    return this.timerFacade.formattedCurrentTime();
  });

  readonly formattedCurrentSession = computed(() => {
    return this.timerFacade.formattedCurrentSession();
  });

  readonly formattedPauseTime = computed(() => {
    return this.timerFacade.formattedPauseTime();
  });

  readonly formattedEffectiveTime = computed(() => {
    return this.timerFacade.formattedEffectiveTime();
  });

  readonly formattedRemainingTime = computed(() => {
    return this.timerFacade.formattedRemainingTime();
  });

  // Legacy methods mapped to new facade
  async startWork(): Promise<void> {
    await this.timerFacade.startWork();
  }

  async stopWork(): Promise<void> {
    await this.timerFacade.stopWork();
  }

  async resetTimer(): Promise<void> {
    await this.timerFacade.resetTimer();
  }

  // Legacy utility methods
  formatTime(milliseconds: number): string {
    return this.timerFacade.formatTime(milliseconds);
  }

  getButtonText(): string {
    return this.timerFacade.buttonText();
  }

  getStatusText(): string {
    return this.timerFacade.statusText();
  }

  getProgressPercentage(): number {
    return this.timerFacade.progressPercentage();
  }

  getProgressText(): string {
    return this.timerFacade.getProgressText();
  }

  // Data migration support
  async migrateExistingData(): Promise<void> {
    // This will be implemented when we add data migration logic
    console.log('Legacy data migration - checking for existing data...');
    
    // Check if there's any legacy data to migrate
    const hasLegacyData = localStorage.getItem('work_timer_state') || 
                         localStorage.getItem('work_timer_sessions') ||
                         localStorage.getItem('work_timer_daily_data');
    
    if (!hasLegacyData) {
      console.log('No legacy data found to migrate');
      return;
    }

    console.log('Legacy data found - migration will be implemented in next phase');
  }
}