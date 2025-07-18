/**
 * @fileoverview Base domain event interface.
 * @author Work Timer Application
 */

export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly version: number;
}