/** Names are stored in webhook subscriptions, so they keep their persisted values. */
export const DomainEventNames = {
  USER_REGISTERED: 'admin-notification.usuario-registrado',
  ORDER_CREATED: 'admin-notification.pedido-criado',
  ORDER_PAID: 'admin-notification.pedido-pago',
  ORDER_STATUS_UPDATED: 'admin-notification.pedido-status-atualizado',
  ORDER_CANCELLED: 'admin-notification.pedido-cancelado',
} as const;

export type DomainEventName = (typeof DomainEventNames)[keyof typeof DomainEventNames];

export interface DomainEvent {
  readonly name: DomainEventName;
}

export class UserRegisteredEvent implements DomainEvent {
  readonly name = DomainEventNames.USER_REGISTERED;
  constructor(public readonly userName: string) {}
}

export class OrderCreatedEvent implements DomainEvent {
  readonly name = DomainEventNames.ORDER_CREATED;
  constructor(
    public readonly orderId: number,
    public readonly totalAmount: number,
  ) {}
}

export class OrderPaidEvent implements DomainEvent {
  readonly name = DomainEventNames.ORDER_PAID;
  constructor(public readonly orderId: number) {}
}

export class OrderStatusUpdatedEvent implements DomainEvent {
  readonly name = DomainEventNames.ORDER_STATUS_UPDATED;
  constructor(
    public readonly orderId: number,
    public readonly newStatus: string,
  ) {}
}

export class OrderCancelledEvent implements DomainEvent {
  readonly name = DomainEventNames.ORDER_CANCELLED;
  constructor(public readonly orderId: number) {}
}
