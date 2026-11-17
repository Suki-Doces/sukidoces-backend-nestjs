import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DispatchWebhooksUseCase } from '../../application/use-cases/webhooks/dispatch-webhooks.use-case';
import { DomainEvent, DomainEventNames } from '../../domain/events/domain-events';

/** Forwards every domain event to the registered webhooks (explicit handlers, no wildcard). */
@Injectable()
export class WebhookDispatchHandler {
  constructor(private readonly dispatchWebhooks: DispatchWebhooksUseCase) {}

  @OnEvent(DomainEventNames.USER_REGISTERED)
  onUserRegistered(event: DomainEvent) {
    return this.dispatchWebhooks.execute(event);
  }

  @OnEvent(DomainEventNames.ORDER_CREATED)
  onOrderCreated(event: DomainEvent) {
    return this.dispatchWebhooks.execute(event);
  }

  @OnEvent(DomainEventNames.ORDER_PAID)
  onOrderPaid(event: DomainEvent) {
    return this.dispatchWebhooks.execute(event);
  }

  @OnEvent(DomainEventNames.ORDER_STATUS_UPDATED)
  onOrderStatusUpdated(event: DomainEvent) {
    return this.dispatchWebhooks.execute(event);
  }

  @OnEvent(DomainEventNames.ORDER_CANCELLED)
  onOrderCancelled(event: DomainEvent) {
    return this.dispatchWebhooks.execute(event);
  }
}
