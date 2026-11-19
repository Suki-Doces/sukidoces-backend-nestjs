import { Injectable } from '@nestjs/common';
import { Order } from '@domain/entities';
import { OrderRepository } from '@domain/repositories';

@Injectable()
export class ListUserOrdersUseCase {
  constructor(private readonly orders: OrderRepository) {}

  execute(userId: number): Promise<Order[]> {
    return this.orders.findByUser(userId);
  }
}
