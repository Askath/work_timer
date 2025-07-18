/**
 * @fileoverview Get daily report query handler.
 * @author Work Timer Application
 */

import { Injectable } from '@angular/core';
import { GetDailyReportQuery } from '../queries/get-daily-report.query';
import { ReportingApplicationService, DailyReport } from '../services/reporting-application.service';
import { TimerApplicationService } from '../services/timer-application.service';

@Injectable({
  providedIn: 'root'
})
export class GetDailyReportHandler {
  constructor(
    private reportingApplicationService: ReportingApplicationService,
    private timerApplicationService: TimerApplicationService
  ) {}

  async handle(query: GetDailyReportQuery): Promise<DailyReport> {
    const state = this.timerApplicationService.getCurrentState();
    return this.reportingApplicationService.generateDailyReport(state.workDay);
  }
}