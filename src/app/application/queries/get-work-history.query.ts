/**
 * @fileoverview Get work history query.
 * @author Work Timer Application
 */

import { WorkDayDate } from '../../domain';

export class GetWorkHistoryQuery {
  constructor(
    public readonly startDate: WorkDayDate,
    public readonly endDate: WorkDayDate,
    public readonly userId?: string
  ) {}
}