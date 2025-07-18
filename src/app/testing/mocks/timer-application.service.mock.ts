/**
 * @fileoverview Mock implementation of TimerApplicationService for testing.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { TimerApplicationService, TimerApplicationState } from '../../application/services/timer-application.service';
import { Duration, TimerStatus, WorkDayDate } from '../../domain';

@Injectable()
export class MockTimerApplicationService implements Partial<TimerApplicationService> {
  getCurrentState = jasmine.createSpy('getCurrentState').and.returnValue({
    workDay: {
      status: TimerStatus.STOPPED,
      sessionCount: 0,
      date: WorkDayDate.today()
    },
    calculations: {
      totalWorkTime: Duration.zero(),
      totalPauseTime: Duration.zero(),
      effectiveWorkTime: Duration.zero(),
      remainingTime: Duration.fromHours(10),
      pauseDeduction: Duration.zero(),
      isComplete: false
    },
    currentSessionTime: Duration.zero()
  } as TimerApplicationState);

  onEvent = jasmine.createSpy('onEvent');
  getProgressPercentage = jasmine.createSpy('getProgressPercentage').and.returnValue(0);
  getWorkDayData = jasmine.createSpy('getWorkDayData').and.returnValue({});
  loadWorkDay = jasmine.createSpy('loadWorkDay');
}