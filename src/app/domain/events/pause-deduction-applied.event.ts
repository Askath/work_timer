/**
 * @fileoverview Pause deduction applied domain event.
 * @author Work Timer Application
 */

import { DomainEvent } from './domain-event';
import { Duration } from '../value-objects/duration';
import { WorkDayDate } from '../value-objects/work-day-date';

export class PauseDeductionAppliedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventType = 'PauseDeductionApplied';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly version: number;

  constructor(
    public readonly workDate: WorkDayDate,
    public readonly totalPauseTime: Duration,
    public readonly deductionAmount: Duration,
    public readonly reason: string,
    version: number = 1
  ) {
    this.eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.occurredAt = new Date();
    this.aggregateId = workDate.toISOString();
    this.version = version;
  }
}