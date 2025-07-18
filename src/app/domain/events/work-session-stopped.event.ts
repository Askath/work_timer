/**
 * @fileoverview Work session stopped domain event.
 * @author Work Timer Application
 */

import { DomainEvent } from './domain-event';
import { WorkSession } from '../entities/work-session';
import { Duration } from '../value-objects/duration';

export class WorkSessionStoppedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventType = 'WorkSessionStopped';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly version: number;

  constructor(
    public readonly session: WorkSession,
    public readonly sessionDuration: Duration,
    public readonly totalWorkTime: Duration,
    version: number = 1
  ) {
    this.eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.occurredAt = new Date();
    this.aggregateId = session.workDate.toISOString();
    this.version = version;
  }
}