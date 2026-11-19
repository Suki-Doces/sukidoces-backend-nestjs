import { Injectable } from '@nestjs/common';
import { OrderRepository } from '@domain/repositories';

export interface AdminOrderView {
  id: number;
  customerName: string;
  customerEmail: string;
  createdAt: Date;
  status: string;
  totalAmount: number;
  paymentMethod: string | null;
  items: { name?: string; quantity: number; image?: string | null }[];
}

@Injectable()
export class ListAllOrdersUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(): Promise<AdminOrderView[]> {
    const orders = await this.orders.findAllWithDetails();

    return orders.map((order) => ({
      id: order.id,
      customerName: order.user?.name || 'Customer',
      customerEmail: order.user?.email || '',
      createdAt: order.createdAt,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      paymentMethod: order.paymentMethod,
      items: (order.items ?? []).map((item) => ({
        name: item.product?.name,
        quantity: item.quantity,
        image: item.product?.image,
      })),
    }));
  }
}
