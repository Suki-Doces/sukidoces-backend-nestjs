import { Injectable } from '@nestjs/common';
import { Order } from '@domain/entities';
import { OrderCancelledEvent } from '@domain/events';
import { OrderRepository } from '@domain/repositories';
import { NotFoundError } from '@application/errors';
import { EventPublisher, UnitOfWork } from '@application/ports';

@Injectable()
export class CancelOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly events: EventPublisher,
  ) {}

  async execute(userId: number, orderId: number): Promise<Order | null> {
    const order = await this.orders.findByIdWithItems(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Business rules (ownership, cancellable status, 2h window) live in the Order entity.
    order.ensureBelongsTo(userId);
    order.cancel();

    const cancelled = await this.unitOfWork.run(async ({ orders, products }) => {
      await orders.updateStatus(orderId, order.status);
      for (const item of order.items ?? []) {
        await products.increaseStock(item.productId, item.quantity);
      }
      return orders.findById(orderId);
    });

    this.events.publish(new OrderCancelledEvent(orderId));
    return cancelled;
  }
}
