/**
 * @fileoverview Work session started domain event.
 * @author Work Timer Application
 */

import { DomainEvent } from './domain-event';
import { WorkSession } from '../entities/work-session';

export class WorkSessionStartedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventType = 'WorkSessionStarted';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly version: number;

  constructor(
    public readonly session: WorkSession,
    public readonly sessionCount: number,
    version: number = 1
  ) {
    this.eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.occurredAt = new Date();
    this.aggregateId = session.workDate.toISOString();
    this.version = version;
  }
}