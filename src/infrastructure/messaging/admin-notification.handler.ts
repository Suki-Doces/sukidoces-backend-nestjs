import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotifyAdminUseCase } from '../../application/use-cases/notifications/notify-admin.use-case';
import { NotificationType } from '../../domain/enums';
import {
  DomainEventNames,
  OrderCancelledEvent,
  OrderCreatedEvent,
  OrderPaidEvent,
  OrderStatusUpdatedEvent,
  UserRegisteredEvent,
} from '../../domain/events/domain-events';

/** Turns domain events into in-app notifications for the administrator. */
@Injectable()
export class AdminNotificationHandler {
  constructor(private readonly notifyAdmin: NotifyAdminUseCase) {}

  @OnEvent(DomainEventNames.USER_REGISTERED)
  onUserRegistered(event: UserRegisteredEvent) {
    return this.notifyAdmin.execute({
      title: 'New Registration!',
      message: `New registration! ${event.userName} created an account.`,
      type: NotificationType.USER,
    });
  }

  @OnEvent(DomainEventNames.ORDER_CREATED)
  onOrderCreated(event: OrderCreatedEvent) {
    return this.notifyAdmin.execute({
      title: 'New Suki Doces Order!',
      message: `Order #${event.orderId} of R$ ${event.totalAmount.toFixed(2)}.`,
      type: NotificationType.SALE,
    });
  }

  @OnEvent(DomainEventNames.ORDER_PAID)
  onOrderPaid(event: OrderPaidEvent) {
    return this.notifyAdmin.execute({
      title: 'Payment Confirmed!',
      message: `Order #${event.orderId} paid.`,
      type: NotificationType.SALE,
    });
  }

  @OnEvent(DomainEventNames.ORDER_STATUS_UPDATED)
  onOrderStatusUpdated(event: OrderStatusUpdatedEvent) {
    return this.notifyAdmin.execute({
      title: 'Status Update!',
      message: `Order #${event.orderId} was updated to: ${event.newStatus.toUpperCase()}.`,
      type: NotificationType.ORDER,
    });
  }

  @OnEvent(DomainEventNames.ORDER_CANCELLED)
  onOrderCancelled(event: OrderCancelledEvent) {
    return this.notifyAdmin.execute({
      title: 'Order Cancelled',
      message: `Order #${event.orderId} was cancelled by the customer.`,
      type: NotificationType.CANCELLATION,
    });
  }
}
