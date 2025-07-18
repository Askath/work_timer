/**
 * @fileoverview Timer facade providing unified application interface.
 * @author Work Timer Application
 */

import { Injectable, signal, computed } from '@angular/core';
import { TimerApplicationService, TimerApplicationState } from '../services/timer-application.service';
import { ReportingApplicationService, DailyReport } from '../services/reporting-application.service';
import { WorkSessionApplicationService } from '../services/work-session-application.service';
import { StartWorkHandler } from '../handlers/start-work.handler';
import { StopWorkHandler } from '../handlers/stop-work.handler';
import { ResetTimerHandler } from '../handlers/reset-timer.handler';
import { GetCurrentSessionHandler } from '../handlers/get-current-session.handler';
import { GetDailyReportHandler } from '../handlers/get-daily-report.handler';
import { StartWorkCommand } from '../commands/start-work.command';
import { StopWorkCommand } from '../commands/stop-work.command';
import { ResetTimerCommand } from '../commands/reset-timer.command';
import { GetCurrentSessionQuery } from '../queries/get-current-session.query';
import { GetDailyReportQuery } from '../queries/get-daily-report.query';
import { Duration, TimerStatus, WorkDayDate } from '../../domain';

@Injectable({
  providedIn: 'root'
})
export class TimerFacade {
  private readonly _state = signal<TimerApplicationState | null>(null);
  private timerInterval: number | null = null;

  constructor(
    private timerApplicationService: TimerApplicationService,
    private reportingApplicationService: ReportingApplicationService,
    private workSessionApplicationService: WorkSessionApplicationService,
    private startWorkHandler: StartWorkHandler,
    private stopWorkHandler: StopWorkHandler,
    private resetTimerHandler: ResetTimerHandler,
    private getCurrentSessionHandler: GetCurrentSessionHandler,
    private getDailyReportHandler: GetDailyReportHandler
  ) {
    this._state.set(this.timerApplicationService.getCurrentState());
    this.setupEventHandlers();
    this.initializeTimer();
  }

  // Computed signals for reactive UI
  readonly currentStatus = computed(() => this._state()?.workDay?.status || TimerStatus.STOPPED);
  readonly currentWorkTime = computed(() => this._state()?.calculations?.totalWorkTime || Duration.zero());
  readonly currentPauseTime = computed(() => this._state()?.calculations?.totalPauseTime || Duration.zero());
  readonly currentSessionTime = computed(() => this._state()?.currentSessionTime || Duration.zero());
  readonly sessionsCount = computed(() => this._state()?.workDay?.sessionCount || 0);
  readonly effectiveWorkTime = computed(() => this._state()?.calculations?.effectiveWorkTime || Duration.zero());
  readonly remainingTime = computed(() => this._state()?.calculations?.remainingTime || Duration.zero());
  readonly pauseDeduction = computed(() => this._state()?.calculations?.pauseDeduction || Duration.zero());
  readonly isWorkComplete = computed(() => this._state()?.calculations?.isComplete || false);
  readonly progressPercentage = computed(() => this.timerApplicationService.getProgressPercentage());

  // Formatted computed signals
  readonly formattedCurrentTime = computed(() => this.currentWorkTime().format());
  readonly formattedCurrentSession = computed(() => this.currentSessionTime().format());
  readonly formattedPauseTime = computed(() => this.currentPauseTime().format());
  readonly formattedEffectiveTime = computed(() => this.effectiveWorkTime().format());
  readonly formattedRemainingTime = computed(() => this.remainingTime().format());

  // UI helpers
  readonly buttonText = computed(() => {
    const state = this._state();
    if (!state || !state.calculations) return 'Start Work';
    
    if (state.calculations.isComplete) {
      return 'Work Complete';
    }
    
    switch (state.workDay?.status?.value) {
      case 'STOPPED':
        return 'Start Work';
      case 'RUNNING':
        return 'Stop Work';
      case 'PAUSED':
        return 'Resume Work';
      default:
        return 'Start Work';
    }
  });
  
  readonly statusText = computed(() => {
    const state = this._state();
    return state?.workDay?.status?.getDisplayText() || 'Stopped';
  });
  
  readonly canStartWork = computed(() => {
    const state = this._state();
    return state?.workDay ? !state.workDay.status.isRunning() : true;
  });
  
  readonly canStopWork = computed(() => {
    const state = this._state();
    return state?.workDay ? state.workDay.status.isRunning() : false;
  });

  // Current date for display
  readonly currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Commands
  async startWork(): Promise<void> {
    await this.startWorkHandler.handle(new StartWorkCommand());
    this.updateState();
  }

  async stopWork(): Promise<void> {
    await this.stopWorkHandler.handle(new StopWorkCommand());
    this.updateState();
  }

  async resetTimer(): Promise<void> {
    await this.resetTimerHandler.handle(new ResetTimerCommand());
    this.updateState();
  }

  // Queries
  async getCurrentSession() {
    return await this.getCurrentSessionHandler.handle(new GetCurrentSessionQuery());
  }

  async getDailyReport(): Promise<DailyReport> {
    return await this.getDailyReportHandler.handle(new GetDailyReportQuery());
  }

  // State management
  private updateState(): void {
    this._state.set(this.timerApplicationService.getCurrentState());
  }

  private setupEventHandlers(): void {
    this.timerApplicationService.onEvent((event: any) => {
      console.log('Domain event:', event.eventType, event);
      this.updateState();
    });
  }

  private initializeTimer(): void {
    // Start the real-time update timer
    // Skip timer initialization in test environment
    try {
      if (typeof window !== 'undefined' && window.setInterval && !this.isTestEnvironment()) {
        this.timerInterval = window.setInterval(() => {
          if (this.currentStatus().isRunning()) {
            this.updateState();
          }
        }, 1000);
      }
    } catch (error) {
      // Silent fail in test environment
      console.debug('Timer initialization skipped in test environment');
    }
  }

  private isTestEnvironment(): boolean {
    return (typeof window !== 'undefined' && (window as any)['jasmine']) || 
           (typeof window !== 'undefined' && (window as any)['__karma__']);
  }

  // Utility methods for UI
  formatTime(milliseconds: number): string {
    return Duration.fromMilliseconds(milliseconds).format();
  }

  getProgressText(): string {
    const percentage = this.progressPercentage();
    return `${percentage.toFixed(1)}% of daily limit`;
  }

  // Lifecycle
  destroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Data persistence helpers
  saveToStorage(): void {
    // This will be implemented when we create the infrastructure layer
    const data = this.timerApplicationService.getWorkDayData();
    console.log('Saving work day data:', data);
  }

  loadFromStorage(data: any): void {
    // This will be implemented when we create the infrastructure layer
    this.timerApplicationService.loadWorkDay(data);
    this.updateState();
  }
}