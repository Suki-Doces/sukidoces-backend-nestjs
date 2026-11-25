import { Coupon, Order } from '@domain/entities';
import { CouponType, OrderOrigin, PaymentMethod, parseOrderOrigin } from '@domain/enums';
import { BadRequestError } from '@application/errors';
import { ValidateCouponUseCase } from '@application/use-cases/orders';
import { normalizeAddresses } from '@application/use-cases/users/normalize-addresses';
import { ConfigAuthSettings } from '@infrastructure/security';
import { CouponRepository } from '@domain/repositories';
import { ConfigService } from '@nestjs/config';

describe('order origin', () => {
  it.each([
    ['web', OrderOrigin.WEB],
    ['site', OrderOrigin.WEB],
    [' Mobile ', OrderOrigin.MOBILE],
    ['app', OrderOrigin.MOBILE],
    ['android', OrderOrigin.MOBILE],
    ['ios', OrderOrigin.MOBILE],
  ])('maps %p to %p', (raw, expected) => {
    expect(parseOrderOrigin(raw)).toBe(expected);
  });

  it.each([[undefined], [''], ['desktop'], [42]])('ignores unknown value %p', (raw) => {
    expect(parseOrderOrigin(raw)).toBeNull();
  });

  it('Order.place keeps the channel and defaults it to null', () => {
    const base = { userId: 1, totalAmount: 10, paymentMethod: PaymentMethod.PIX };
    expect(Order.place({ ...base, origin: OrderOrigin.MOBILE }).origin).toBe('mobile');
    expect(Order.place(base).origin).toBeNull();
  });
});

describe('normalizeAddresses (legacy website payloads)', () => {
  const stored = [{ id_endereco: 3, cep: '01001-000', numero: '10' }];

  it('turns a Prisma "create" into the stored array, newest first, with a fresh id', () => {
    expect(normalizeAddresses({ create: { cep: '20000-000' } }, stored)).toEqual([
      { id_endereco: 4, cep: '20000-000' },
      ...stored,
    ]);
    expect(normalizeAddresses({ create: { cep: '20000-000' } }, null)).toEqual([
      { id_endereco: 1, cep: '20000-000' },
    ]);
  });

  it('applies a Prisma "update" to the matching address only', () => {
    expect(
      normalizeAddresses({ update: { where: { id_endereco: 3 }, data: { numero: '99' } } }, stored),
    ).toEqual([{ id_endereco: 3, cep: '01001-000', numero: '99' }]);
  });

  it('an update for an unknown id edits the main address instead of losing the data', () => {
    expect(
      normalizeAddresses(
        { update: { where: { id_endereco: undefined }, data: { numero: '5' } } },
        [],
      ),
    ).toEqual([{ id_endereco: 1, numero: '5' }]);
  });

  it('keeps arrays untouched and wraps a single plain object', () => {
    const list = [{ cep: '1' }];
    expect(normalizeAddresses(list, stored)).toBe(list);
    expect(normalizeAddresses({ cep: '1' }, stored)).toEqual([{ cep: '1' }]);
  });
});

describe('ValidateCouponUseCase', () => {
  const coupons = (coupon: Coupon | null): CouponRepository =>
    ({ findByCode: jest.fn().mockResolvedValue(coupon), findAll: jest.fn() }) as CouponRepository;

  it('previews a percentage discount for the informed subtotal', async () => {
    const useCase = new ValidateCouponUseCase(
      coupons(
        new Coupon({ id: 1, code: 'SUKI10', type: CouponType.PERCENTAGE, value: 10, active: true }),
      ),
    );
    const result = await useCase.execute(' suki10 ', 59.9);
    expect(result.discount).toBe(5.99);
  });

  it('caps a fixed discount at the subtotal', async () => {
    const useCase = new ValidateCouponUseCase(
      coupons(
        new Coupon({ id: 2, code: 'FIXO20', type: CouponType.FIXED, value: 20, active: true }),
      ),
    );
    expect((await useCase.execute('FIXO20', 12)).discount).toBe(12);
  });

  it('rejects missing, inactive and expired coupons with 400', async () => {
    await expect(new ValidateCouponUseCase(coupons(null)).execute('X')).rejects.toBeInstanceOf(
      BadRequestError,
    );
    await expect(
      new ValidateCouponUseCase(
        coupons(new Coupon({ code: 'OFF', type: CouponType.FIXED, value: 5, active: false })),
      ).execute('OFF'),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      new ValidateCouponUseCase(
        coupons(
          new Coupon({
            code: 'OLD',
            type: CouponType.FIXED,
            value: 5,
            active: true,
            expiresAt: new Date(0),
          }),
        ),
      ).execute('OLD'),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(new ValidateCouponUseCase(coupons(null)).execute('  ')).rejects.toThrow(
      'Coupon code is required',
    );
  });
});

describe('ConfigAuthSettings', () => {
  const settingsFor = (value: unknown) =>
    new ConfigAuthSettings({ get: () => value } as unknown as ConfigService);

  it('requires e-mail verification unless explicitly disabled', () => {
    expect(settingsFor(undefined).emailVerificationRequired).toBe(true);
    expect(settingsFor(true).emailVerificationRequired).toBe(true);
    expect(settingsFor('true').emailVerificationRequired).toBe(true);
    expect(settingsFor(false).emailVerificationRequired).toBe(false);
    expect(settingsFor('false').emailVerificationRequired).toBe(false);
  });
});
