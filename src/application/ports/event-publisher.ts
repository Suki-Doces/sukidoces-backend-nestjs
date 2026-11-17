import { DomainEvent } from '../../domain/events/domain-events';

export abstract class EventPublisher {
  abstract publish(event: DomainEvent): void;
}
