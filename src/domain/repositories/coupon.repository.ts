import { Coupon } from '../entities';

export abstract class CouponRepository {
  abstract findByCode(code: string): Promise<Coupon | null>;
  abstract findAll(): Promise<Coupon[]>;
}
