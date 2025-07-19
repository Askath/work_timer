/**
 * @fileoverview Timer application service for orchestrating work timer use cases.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { 
  WorkDay, 
  WorkDayDate, 
  Duration, 
  TimerStatus,
  TimeCalculationService,
  PauseDeductionPolicy,
  WorkSessionStartedEvent,
  WorkSessionStoppedEvent,
  PauseDeductionAppliedEvent,
  DailyLimitReachedEvent,
  DomainEvent,
  WorkDaySerializationData
} from '../../domain';

export interface TimerApplicationState {
  workDay: WorkDay;
  calculations: {
    totalWorkTime: Duration;
    totalPauseTime: Duration;
    pauseDeduction: Duration;
    effectiveWorkTime: Duration;
    remainingTime: Duration;
    isComplete: boolean;
  };
  currentSessionTime: Duration;
}

@Injectable({
  providedIn: 'root'
})
export class TimerApplicationService {
  private _currentWorkDay: WorkDay;
  private _eventHandlers: Array<(event: DomainEvent) => void> = [];

  constructor(
    private timeCalculationService: TimeCalculationService,
    private pauseDeductionPolicy: PauseDeductionPolicy
  ) {
    this._currentWorkDay = WorkDay.create(WorkDayDate.today());
  }

  getCurrentState(): TimerApplicationState {
    const calculations = this.timeCalculationService.calculateWorkDayMetrics(this._currentWorkDay);
    const currentSessionTime = this._currentWorkDay.getCurrentSessionTime();

    return {
      workDay: this._currentWorkDay,
      calculations,
      currentSessionTime
    };
  }

  startWork(): void {
    try {
      const startTime = new Date();
      const previousWorkDay = this._currentWorkDay;
      
      this._currentWorkDay = this._currentWorkDay.startWork(startTime);
      
      // Check if we should apply pause deduction
      if (this.pauseDeductionPolicy.canApplyDeduction(previousWorkDay)) {
        this._currentWorkDay = this._currentWorkDay.applyPauseDeduction();
        this.emitEvent(new PauseDeductionAppliedEvent(
          this._currentWorkDay.date,
          previousWorkDay.calculateTotalPauseTime(),
          this.pauseDeductionPolicy.getDeductionAmount(),
          'Pause deduction applied on work resumption'
        ));
      }

      this.emitEvent(new WorkSessionStartedEvent(
        this._currentWorkDay.currentSession!,
        this._currentWorkDay.sessionCount
      ));

    } catch (error) {
      console.error('Error starting work:', error);
      throw error;
    }
  }

  stopWork(): void {
    try {
      const endTime = new Date();
      const currentSession = this._currentWorkDay.currentSession;
      
      if (!currentSession) {
        throw new Error('No active work session to stop');
      }

      this._currentWorkDay = this._currentWorkDay.stopWork(endTime);
      
      const stoppedSession = this._currentWorkDay.sessions[this._currentWorkDay.sessions.length - 1];
      const calculations = this.timeCalculationService.calculateWorkDayMetrics(this._currentWorkDay);

      this.emitEvent(new WorkSessionStoppedEvent(
        stoppedSession,
        stoppedSession.duration,
        calculations.totalWorkTime
      ));

      // Check if daily limit has been reached
      if (calculations.isComplete) {
        this.emitEvent(new DailyLimitReachedEvent(
          this._currentWorkDay.date,
          calculations.effectiveWorkTime,
          this.timeCalculationService.getMaxWorkTime()
        ));
      }

    } catch (error) {
      console.error('Error stopping work:', error);
      throw error;
    }
  }

  resetTimer(): void {
    try {
      this._currentWorkDay = WorkDay.create(WorkDayDate.today());
    } catch (error) {
      console.error('Error resetting timer:', error);
      throw error;
    }
  }

  loadWorkDay(workDayData: WorkDaySerializationData): void {
    try {
      this._currentWorkDay = WorkDay.fromData(workDayData);
    } catch (error) {
      console.error('Error loading work day:', error);
      throw error;
    }
  }

  getWorkDayData(): WorkDaySerializationData {
    return this._currentWorkDay.toData();
  }

  canStartWork(): boolean {
    const calculations = this.timeCalculationService.calculateWorkDayMetrics(this._currentWorkDay);
    return !calculations.isComplete && 
           (this._currentWorkDay.status.isStopped() || this._currentWorkDay.status.isPaused());
  }

  canStopWork(): boolean {
    return this._currentWorkDay.status.isRunning();
  }

  getProgressPercentage(): number {
    const calculations = this.timeCalculationService.calculateWorkDayMetrics(this._currentWorkDay);
    return this.timeCalculationService.calculateProgressPercentage(calculations.effectiveWorkTime);
  }

  getButtonText(): string {
    const calculations = this.timeCalculationService.calculateWorkDayMetrics(this._currentWorkDay);
    
    if (calculations.isComplete) {
      return 'Work Complete';
    }
    
    switch (this._currentWorkDay.status.value) {
      case 'STOPPED':
        return 'Start Work';
      case 'RUNNING':
        return 'Stop Work';
      case 'PAUSED':
        return 'Resume Work';
      default:
        return 'Start Work';
    }
  }

  getStatusText(): string {
    return this._currentWorkDay.status.getDisplayText();
  }

  onEvent(handler: (event: DomainEvent) => void): void {
    this._eventHandlers.push(handler);
  }

  private emitEvent(event: DomainEvent): void {
    this._eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    });
  }
}