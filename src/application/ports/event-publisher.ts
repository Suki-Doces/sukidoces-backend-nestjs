import { DomainEvent } from '@domain/events';

export abstract class EventPublisher {
  abstract publish(event: DomainEvent): void;
}
