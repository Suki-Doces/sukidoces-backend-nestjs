import { Order } from '../entities';

export interface NewOrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface OrderAggregateCriteria {
  statuses?: string[];
  status?: string;
  from?: Date;
  to?: Date;
}

export abstract class OrderRepository {
  abstract findById(id: number): Promise<Order | null>;
  abstract findByIdempotencyKey(userId: number, key: string): Promise<Order | null>;
  abstract findByIdWithItems(id: number): Promise<Order | null>;
  abstract findAllWithDetails(): Promise<Order[]>;
  abstract findByUser(userId: number): Promise<Order[]>;
  abstract countByStatus(status?: string): Promise<number>;
  abstract aggregate(criteria: OrderAggregateCriteria): Promise<{ totalAmount: number; count: number }>;
  abstract findRecent(take: number): Promise<Order[]>;
  abstract bestSellingProducts(take: number): Promise<{ productId: number; totalQuantity: number }[]>;
  abstract createWithItems(order: Order, items: NewOrderItem[]): Promise<Order>;
  abstract updateStatus(id: number, status: string): Promise<Order | null>;
}
