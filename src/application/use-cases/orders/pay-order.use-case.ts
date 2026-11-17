import { Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities';
import { OrderPaidEvent } from '../../../domain/events/domain-events';
import { OrderRepository } from '../../../domain/repositories';
import { InternalError, NotFoundError } from '../../errors/application-errors';
import { EventPublisher } from '../../ports';

@Injectable()
export class PayOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly events: EventPublisher,
  ) {}

  async execute(userId: number, orderId: number): Promise<Order | null> {
    const order = await this.orders.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Ownership and "only pending orders can be paid" are rules of the Order entity.
    order.ensureBelongsTo(userId);
    order.markAsPaid();

    try {
      const paid = await this.orders.updateStatus(orderId, order.status);
      this.events.publish(new OrderPaidEvent(orderId));
      return paid;
    } catch {
      throw new InternalError('Internal error while processing the payment');
    }
  }
}
