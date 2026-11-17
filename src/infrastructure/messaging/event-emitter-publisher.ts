import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '../../domain/events/domain-events';
import { EventPublisher } from '../../application/ports/event-publisher';

@Injectable()
export class EventEmitterPublisher extends EventPublisher {
  constructor(private readonly emitter: EventEmitter2) {
    super();
  }

  publish(event: DomainEvent): void {
    this.emitter.emit(event.name, event);
  }
}
