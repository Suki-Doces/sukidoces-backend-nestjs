import { INSTANT_PAYMENT_METHODS, OrderStatus } from '@domain/enums';
import {
  CancellationWindowExpiredError,
  OrderAlreadyProcessedError,
  OrderCannotBeCancelledError,
  OrderNotOwnedError,
} from '@domain/errors';
import type { Coupon } from './coupon.entity';
import type { OrderItem } from './order-item.entity';
import type { User } from './user.entity';

const CANCELLATION_WINDOW_HOURS = 2;

export class Order {
  id: number;
  userId: number;
  /** Grand total charged: products - coupon discount + shipping. */
  totalAmount: number;
  /** Shipping part of `totalAmount` (0 when free and for legacy orders). */
  shippingAmount: number;
  status: string;
  paymentMethod: string | null;
  couponId: number | null;
  idempotencyKey: string | null;
  requestHash: string | null;
  /** Channel that placed the order ('web' | 'mobile'); null for legacy orders. */
  origin: string | null;
  createdAt: Date;
  user?: User;
  items?: OrderItem[];
  coupon?: Coupon | null;

  constructor(props?: Partial<Order>) {
    if (props) Object.assign(this, props);
  }

  /** Creates a new order: instant payment methods start as PAID, the rest as PENDING. */
  static place(input: {
    userId: number;
    totalAmount: number;
    shippingAmount?: number;
    paymentMethod: string;
    couponId?: number | null;
    idempotencyKey?: string | null;
    requestHash?: string | null;
    origin?: string | null;
  }): Order {
    return new Order({
      userId: input.userId,
      totalAmount: input.totalAmount,
      shippingAmount: input.shippingAmount ?? 0,
      paymentMethod: input.paymentMethod,
      couponId: input.couponId ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      requestHash: input.requestHash ?? null,
      origin: input.origin ?? null,
      status: INSTANT_PAYMENT_METHODS.includes(input.paymentMethod)
        ? OrderStatus.PAID
        : OrderStatus.PENDING,
    });
  }

  ensureBelongsTo(userId: number): void {
    if (this.userId !== userId) {
      throw new OrderNotOwnedError();
    }
  }

  cancel(now: Date = new Date()): void {
    if (this.status === OrderStatus.CANCELLED || this.status === OrderStatus.DELIVERED) {
      throw new OrderCannotBeCancelledError(this.status);
    }

    const hours = (now.getTime() - new Date(this.createdAt).getTime()) / (1000 * 60 * 60);
    if (hours > CANCELLATION_WINDOW_HOURS) {
      throw new CancellationWindowExpiredError(hours);
    }

    this.status = OrderStatus.CANCELLED;
  }

  markAsPaid(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new OrderAlreadyProcessedError();
    }
    this.status = OrderStatus.PAID;
  }
}
