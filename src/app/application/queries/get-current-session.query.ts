/**
 * @fileoverview Get current session query.
 * @author Work Timer Application
 */

import { WorkDayDate } from '../../domain';

export class GetCurrentSessionQuery {
  constructor(
    public readonly date: WorkDayDate = WorkDayDate.today(),
    public readonly userId?: string
  ) {}
}