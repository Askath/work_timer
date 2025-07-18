/**
 * @fileoverview Mock implementation of TimerFacade for testing.
 * @author Work Timer Application
 */

import { signal, computed } from '@angular/core';
import { Duration, TimerStatus, WorkDayDate, WorkDay } from '../../domain';
import { TimerApplicationState } from '../../application/services/timer-application.service';

export class MockTimerFacade {
  private readonly _state = signal<TimerApplicationState>({
    workDay: WorkDay.create(WorkDayDate.today()),
    calculations: {
      totalWorkTime: Duration.zero(),
      totalPauseTime: Duration.zero(),
      pauseDeduction: Duration.zero(),
      effectiveWorkTime: Duration.zero(),
      remainingTime: Duration.fromHours(10),
      isComplete: false
    },
    currentSessionTime: Duration.zero()
  });

  // Mock computed signals
  readonly currentStatus = computed(() => this._state().workDay.status);
  readonly currentSessionTime = computed(() => this._state().currentSessionTime);
  readonly totalWorkTime = computed(() => this._state().calculations.totalWorkTime);
  readonly totalPauseTime = computed(() => this._state().calculations.totalPauseTime);
  readonly effectiveWorkTime = computed(() => this._state().calculations.effectiveWorkTime);
  readonly sessionCount = computed(() => this._state().workDay.sessionCount);
  readonly pauseDeductionApplied = computed(() => this._state().workDay.pauseDeductionApplied);
  readonly isWorkDayComplete = computed(() => this._state().calculations.isComplete);
  readonly remainingTime = computed(() => this._state().calculations.remainingTime);

  // Mock formatted computed signals
  readonly formattedCurrentTime = computed(() => this.currentSessionTime().format());
  readonly formattedTotalTime = computed(() => this.totalWorkTime().format());
  readonly formattedEffectiveTime = computed(() => this.effectiveWorkTime().format());
  readonly formattedRemainingTime = computed(() => this.remainingTime().format());

  // Mock button text logic
  readonly buttonText = computed(() => {
    const status = this.currentStatus();
    if (status.isStopped()) return 'Start Work';
    if (status.isRunning()) return 'Stop Work';
    if (status.isPaused()) return 'Resume Work';
    return 'Start Work';
  });

  // Mock progress percentage
  readonly progressPercentage = computed(() => {
    const effective = this.effectiveWorkTime().milliseconds;
    const max = Duration.fromHours(10).milliseconds;
    return Math.min(100, Math.max(0, (effective / max) * 100));
  });

  // Spy-able methods
  startWork = jasmine.createSpy('startWork').and.returnValue(Promise.resolve());
  stopWork = jasmine.createSpy('stopWork').and.returnValue(Promise.resolve());
  resetTimer = jasmine.createSpy('resetTimer').and.returnValue(Promise.resolve());

  // Utility methods for testing
  setState(newState: Partial<TimerApplicationState>): void {
    this._state.set({ ...this._state(), ...newState });
  }

  getState(): TimerApplicationState {
    return this._state();
  }

  // Mock initialization
  initialize = jasmine.createSpy('initialize').and.returnValue(Promise.resolve());
}