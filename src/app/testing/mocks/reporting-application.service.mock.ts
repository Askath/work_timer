/**
 * @fileoverview Mock implementation of ReportingApplicationService for testing.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { ReportingApplicationService, DailyReport } from '../../application/services/reporting-application.service';
import { Duration, WorkDayDate } from '../../domain';

@Injectable()
export class MockReportingApplicationService implements Partial<ReportingApplicationService> {
  generateDailyReport = jasmine.createSpy('generateDailyReport').and.returnValue({
    date: WorkDayDate.today(),
    sessionCount: 0,
    totalWorkTime: Duration.zero(),
    totalPauseTime: Duration.zero(),
    pauseDeduction: Duration.zero(),
    effectiveWorkTime: Duration.zero(),
    remainingTime: Duration.zero(),
    isComplete: false,
    progressPercentage: 0,
    formattedTimes: {
      totalWorkTime: '00:00:00',
      totalPauseTime: '00:00:00',
      pauseDeduction: '00:00:00',
      effectiveWorkTime: '00:00:00',
      remainingTime: '00:00:00'
    }
  } as DailyReport);

  getWorkHistory = jasmine.createSpy('getWorkHistory').and.returnValue(Promise.resolve([]));
}