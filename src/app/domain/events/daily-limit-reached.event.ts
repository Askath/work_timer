/**
 * @fileoverview Daily limit reached domain event.
 * @author Work Timer Application
 */

import { DomainEvent } from './domain-event';
import { Duration } from '../value-objects/duration';
import { WorkDayDate } from '../value-objects/work-day-date';

export class DailyLimitReachedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventType = 'DailyLimitReached';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly version: number;

  constructor(
    public readonly workDate: WorkDayDate,
    public readonly effectiveWorkTime: Duration,
    public readonly dailyLimit: Duration,
    version: number = 1
  ) {
    this.eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.occurredAt = new Date();
    this.aggregateId = workDate.toISOString();
    this.version = version;
  }
}