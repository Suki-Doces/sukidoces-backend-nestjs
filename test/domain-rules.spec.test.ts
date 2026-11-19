import { Order, Product } from '@domain/entities';
import { OrderStatus, PaymentMethod } from '@domain/enums';
import {
  CancellationWindowExpiredError,
  OrderCannotBeCancelledError,
  OrderNotOwnedError,
} from '@domain/errors';

const createdAt = new Date('2026-01-01T10:00:00.000Z');

describe('Order business rules', () => {
  it('starts instant-payment orders as paid and bank-slip orders as pending', () => {
    const instantOrder = Order.place({
      userId: 7,
      totalAmount: 12,
      paymentMethod: PaymentMethod.PIX,
    });
    const bankSlipOrder = Order.place({
      userId: 7,
      totalAmount: 12,
      paymentMethod: PaymentMethod.BANK_SLIP,
    });

    expect(instantOrder.status).toBe(OrderStatus.PAID);
    expect(bankSlipOrder.status).toBe(OrderStatus.PENDING);
    expect(bankSlipOrder.couponId).toBeNull();
    expect(bankSlipOrder.idempotencyKey).toBeNull();
    expect(bankSlipOrder.requestHash).toBeNull();
  });

  it('preserves optional checkout metadata when placing an order', () => {
    const order = Order.place({
      userId: 7,
      totalAmount: 12,
      paymentMethod: PaymentMethod.BANK_SLIP,
      couponId: 3,
      idempotencyKey: 'checkout-123',
      requestHash: 'request-hash',
    });

    expect(order.couponId).toBe(3);
    expect(order.idempotencyKey).toBe('checkout-123');
    expect(order.requestHash).toBe('request-hash');
  });

  it('allows cancellation at the two-hour boundary', () => {
    const order = new Order({ userId: 7, status: OrderStatus.PENDING, createdAt });

    order.cancel(new Date(createdAt.getTime() + 2 * 60 * 60 * 1000));

    expect(order.status).toBe(OrderStatus.CANCELLED);
  });

  it('rejects cancellation after the two-hour window', () => {
    const order = new Order({ userId: 7, status: OrderStatus.PENDING, createdAt });

    expect(() => order.cancel(new Date(createdAt.getTime() + 2 * 60 * 60 * 1000 + 1))).toThrow(
      CancellationWindowExpiredError,
    );
    expect(order.status).toBe(OrderStatus.PENDING);
  });

  it.each([OrderStatus.CANCELLED, OrderStatus.DELIVERED])(
    'does not allow cancellation when the order is %s',
    (status) => {
      const order = new Order({ userId: 7, status, createdAt });

      expect(() => order.cancel(createdAt)).toThrow(OrderCannotBeCancelledError);
    },
  );

  it('only allows the owning user to access an order', () => {
    const order = new Order({ userId: 7 });

    expect(() => order.ensureBelongsTo(7)).not.toThrow();
    expect(() => order.ensureBelongsTo(8)).toThrow(OrderNotOwnedError);
  });
});

describe('Product business rules', () => {
  it('updates stock and calculates a subtotal from the product price', () => {
    const product = new Product({ name: 'Brigadeiro', price: 4.5, quantity: 2 });

    product.increaseStock(3);

    expect(product.quantity).toBe(5);
    expect(product.subtotalFor(4)).toBe(18);
  });
});
