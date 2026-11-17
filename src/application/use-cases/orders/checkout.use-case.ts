import { Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities';
import { OrderCreatedEvent } from '../../../domain/events/domain-events';
import { CouponRepository, NewOrderItem, OrderRepository, ProductRepository } from '../../../domain/repositories';
import { BadRequestError, InternalError, NotFoundError } from '../../errors/application-errors';
import { EventPublisher, RequestHasher, UnitOfWork } from '../../ports';

export interface CheckoutInput {
  userId: number;
  items?: { productId: number; quantity: number }[];
  paymentMethod?: string;
  couponCode?: string;
  idempotencyKey?: string;
}

@Injectable()
export class CheckoutUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly coupons: CouponRepository,
    private readonly orders: OrderRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly events: EventPublisher,
    private readonly requestHasher: RequestHasher,
  ) {}

  async execute(input: CheckoutInput): Promise<Order> {
    const { userId, items, paymentMethod, couponCode } = input;

    if (!items || items.length === 0 || !paymentMethod) {
      throw new BadRequestError('Required data is missing');
    }

    const idempotencyKey = input.idempotencyKey?.trim();
    if (!idempotencyKey || idempotencyKey.length > 255) {
      throw new BadRequestError('A valid Idempotency-Key header is required');
    }

    const requestHash = this.requestHasher.hash(
      JSON.stringify({ items, paymentMethod, couponCode: couponCode?.trim().toUpperCase() ?? null }),
    );
    const existing = await this.orders.findByIdempotencyKey(userId, idempotencyKey);
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new BadRequestError('Idempotency-Key has already been used with a different checkout request');
      }
      return existing;
    }

    const products = await this.products.findManyByIds(items.map((item) => item.productId));

    // 1) Stock and price rules come from the Product entity (DomainError -> 400).
    let subtotal = 0;
    const orderItems: NewOrderItem[] = [];

    for (const item of items) {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) {
        throw new NotFoundError(`Product ID ${item.productId} not found`);
      }

      product.decreaseStock(item.quantity);

      subtotal += product.subtotalFor(item.quantity);
      orderItems.push({ productId: item.productId, quantity: item.quantity, unitPrice: Number(product.price) });
    }

    // 2) Optional discount coupon.
    let discount = 0;
    let couponId: number | null = null;

    if (couponCode) {
      const coupon = await this.coupons.findByCode(couponCode.toUpperCase().trim());
      if (coupon && coupon.isApplicable()) {
        discount = coupon.discountFor(subtotal);
        couponId = coupon.id;
      }
    }

    const totalAmount = Math.max(0, subtotal - discount);
    const order = Order.place({ userId, totalAmount, paymentMethod, couponId, idempotencyKey, requestHash });

    // 3) Atomic persistence: order + items + stock decrement in one transaction.
    //    The decrement is `quantity = quantity - N`, so concurrent checkouts cannot overwrite each other.
    try {
      const created = await this.unitOfWork.run(async ({ orders, products: transactionalProducts }) => {
        const saved = await orders.createWithItems(order, orderItems);
        for (const item of orderItems) {
          await transactionalProducts.decreaseStock(item.productId, item.quantity);
        }
        return saved;
      });

      this.events.publish(new OrderCreatedEvent(created.id, totalAmount));
      return created;
    } catch (error) {
      const driverError = error instanceof Error && 'driverError' in error
        ? (error as Error & { driverError?: { code?: string } }).driverError
        : undefined;
      if (driverError?.code === 'ER_DUP_ENTRY' || driverError?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const racedOrder = await this.orders.findByIdempotencyKey(userId, idempotencyKey);
        if (racedOrder) {
          if (racedOrder.requestHash !== requestHash) {
            throw new BadRequestError('Idempotency-Key has already been used with a different checkout request');
          }
          return racedOrder;
        }
      }
      throw new InternalError('Internal error while processing the order');
    }
  }
}
