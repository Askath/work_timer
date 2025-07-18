/**
 * @fileoverview Get daily report query.
 * @author Work Timer Application
 */

import { WorkDayDate } from '../../domain';

export class GetDailyReportQuery {
  constructor(
    public readonly date: WorkDayDate = WorkDayDate.today(),
    public readonly userId?: string
  ) {}
}