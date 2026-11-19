import { Injectable } from '@nestjs/common';
import { Order } from '@domain/entities';
import { OrderStatus } from '@domain/enums';
import { OrderStatusUpdatedEvent } from '@domain/events';
import { OrderRepository, ProductRepository } from '@domain/repositories';
import { InternalError, NotFoundError } from '@application/errors';
import { EventPublisher } from '@application/ports';

/** Admin action: moves an order to any status, adjusting stock when it is cancelled or reopened. */
@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly products: ProductRepository,
    private readonly events: EventPublisher,
  ) {}

  async execute(orderId: number, status: string): Promise<Order | null> {
    const order = await this.orders.findByIdWithItems(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    try {
      const items = order.items ?? [];

      if (status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
        for (const item of items) await this.products.increaseStock(item.productId, item.quantity);
      } else if (order.status === OrderStatus.CANCELLED && status !== OrderStatus.CANCELLED) {
        for (const item of items) await this.products.decreaseStock(item.productId, item.quantity);
      }

      const updated = await this.orders.updateStatus(orderId, status);
      this.events.publish(new OrderStatusUpdatedEvent(orderId, status));
      return updated;
    } catch {
      throw new InternalError('Error updating the order in the database');
    }
  }
}
