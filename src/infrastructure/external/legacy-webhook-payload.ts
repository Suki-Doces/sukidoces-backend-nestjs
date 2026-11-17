import {
  DomainEvent,
  DomainEventNames,
  OrderCancelledEvent,
  OrderCreatedEvent,
  OrderPaidEvent,
  OrderStatusUpdatedEvent,
  UserRegisteredEvent,
} from '../../domain/events/domain-events';
import { WebhookDelivery } from '../../application/ports/webhook-client';

/**
 * Third parties already consume this payload, so its field names are part of
 * the public contract and are kept exactly as they were.
 */
export function toWebhookBody(delivery: WebhookDelivery) {
  return {
    evento: delivery.event.name,
    payload: toEventPayload(delivery.event),
    disparadoEm: delivery.dispatchedAt,
  };
}

function toEventPayload(event: DomainEvent): Record<string, unknown> {
  switch (event.name) {
    case DomainEventNames.USER_REGISTERED:
      return { nomeUsuario: (event as UserRegisteredEvent).userName };
    case DomainEventNames.ORDER_CREATED:
      return { idPedido: (event as OrderCreatedEvent).orderId, valorTotal: (event as OrderCreatedEvent).totalAmount };
    case DomainEventNames.ORDER_PAID:
      return { idPedido: (event as OrderPaidEvent).orderId };
    case DomainEventNames.ORDER_STATUS_UPDATED:
      return {
        idPedido: (event as OrderStatusUpdatedEvent).orderId,
        novoStatus: (event as OrderStatusUpdatedEvent).newStatus,
      };
    case DomainEventNames.ORDER_CANCELLED:
      return { idPedido: (event as OrderCancelledEvent).orderId };
    default:
      return {};
  }
}
