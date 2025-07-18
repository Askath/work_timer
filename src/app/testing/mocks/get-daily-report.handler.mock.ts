/**
 * @fileoverview Mock implementation of GetDailyReportHandler for testing.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { GetDailyReportHandler } from '../../application/handlers/get-daily-report.handler';
import { GetDailyReportQuery } from '../../application/queries/get-daily-report.query';
import { DailyReport } from '../../application/services/reporting-application.service';
import { Duration, WorkDayDate } from '../../domain';

@Injectable()
export class MockGetDailyReportHandler implements Partial<GetDailyReportHandler> {
  handle = jasmine.createSpy('handle').and.returnValue(Promise.resolve({
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
  } as DailyReport));
}