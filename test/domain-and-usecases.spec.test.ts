import { CheckoutUseCase } from '@application/use-cases/orders';
import { Order, Product } from '@domain/entities';

import { InsufficientStockError, OrderAlreadyProcessedError } from '@domain/errors';
import { OrderStatus } from '@domain/enums';
import { CouponRepository, OrderRepository, ProductRepository } from '@domain/repositories';
import { EventPublisher, RequestHasher, TransactionContext, UnitOfWork } from '@application/ports';

describe('domain entities', () => {
  it('prevents stock from becoming negative', () => {
    const product = new Product({ name: 'Brigadeiro', quantity: 2, price: 3 });

    product.decreaseStock(2);
    expect(product.quantity).toBe(0);
    expect(() => product.decreaseStock(1)).toThrow(InsufficientStockError);
  });

  it('only allows a pending order to transition to paid', () => {
    const order = Order.place({ userId: 7, totalAmount: 12, paymentMethod: 'boleto' });

    expect(order.status).toBe(OrderStatus.PENDING);
    order.markAsPaid();
    expect(order.status).toBe(OrderStatus.PAID);
    expect(() => order.markAsPaid()).toThrow(OrderAlreadyProcessedError);
  });
});

describe('CheckoutUseCase', () => {
  it('persists and reuses an idempotency key without decrementing stock twice', async () => {
    let savedOrder: Order | null = null;
    const products = {
      findManyByIds: jest
        .fn()
        .mockResolvedValue([new Product({ id: 3, name: 'Bolo', quantity: 5, price: 10 })]),
    } as unknown as ProductRepository;
    const coupons = {
      findByCode: jest.fn().mockResolvedValue(null),
    } as unknown as CouponRepository;
    const orders = {
      findByIdempotencyKey: jest.fn().mockImplementation(async () => savedOrder),
    } as unknown as OrderRepository;
    const transactionOrders = {
      createWithItems: jest.fn().mockImplementation(async (order: Order) => {
        savedOrder = order;
        return order;
      }),
    } as unknown as OrderRepository;
    const transactionProducts = {
      decreaseStock: jest.fn().mockResolvedValue(undefined),
    } as unknown as ProductRepository;
    const unitOfWork = {
      run: jest.fn(<T>(work: (context: TransactionContext) => Promise<T>) =>
        work({ orders: transactionOrders, products: transactionProducts }),
      ),
    } as unknown as UnitOfWork;
    const events = { publish: jest.fn() } as unknown as EventPublisher;
    const requestHasher = { hash: jest.fn((value: string) => value) } as unknown as RequestHasher;

    const checkout = new CheckoutUseCase(
      products,
      coupons,
      orders,
      unitOfWork,
      events,
      requestHasher,
    );
    const input = {
      userId: 7,
      items: [{ productId: 3, quantity: 2 }],
      paymentMethod: 'pix',
      idempotencyKey: 'checkout-123',
    };

    const first = await checkout.execute(input);
    const retry = await checkout.execute(input);

    expect(first).toBe(retry);
    expect(first.idempotencyKey).toBe(input.idempotencyKey);
    expect(products.findManyByIds).toHaveBeenCalledTimes(1);
    expect(transactionProducts.decreaseStock).toHaveBeenCalledTimes(1);
    expect(events.publish).toHaveBeenCalledTimes(1);
  });

  it('rejects reusing a checkout key with a different payload', async () => {
    const savedOrder = Order.place({
      userId: 7,
      totalAmount: 20,
      paymentMethod: 'pix',
      idempotencyKey: 'checkout-123',
      requestHash: 'different-request-hash',
    });
    const orders = {
      findByIdempotencyKey: jest.fn().mockResolvedValue(savedOrder),
    } as unknown as OrderRepository;
    const checkout = new CheckoutUseCase(
      {} as ProductRepository,
      {} as CouponRepository,
      orders,
      {} as UnitOfWork,
      {} as EventPublisher,
      { hash: (value: string) => value } as RequestHasher,
    );

    await expect(
      checkout.execute({
        userId: 7,
        items: [{ productId: 3, quantity: 2 }],
        paymentMethod: 'pix',
        idempotencyKey: 'checkout-123',
      }),
    ).rejects.toThrow('Idempotency-Key has already been used with a different checkout request');
  });
});
