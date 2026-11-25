import { Injectable } from '@nestjs/common';
import { OrderRepository } from '@domain/repositories';

export interface AdminOrderView {
  id: number;
  customerName: string;
  customerEmail: string;
  createdAt: Date;
  status: string;
  totalAmount: number;
  shippingAmount: number;
  paymentMethod: string | null;
  origin: string | null;
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
      shippingAmount: Number(order.shippingAmount ?? 0),
      paymentMethod: order.paymentMethod,
      origin: order.origin ?? null,
      items: (order.items ?? []).map((item) => ({
        name: item.product?.name,
        quantity: item.quantity,
        image: item.product?.image,
      })),
    }));
  }
}
