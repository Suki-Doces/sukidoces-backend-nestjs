import { CouponType } from '../enums';

export class Coupon {
  id: number;
  code: string;
  type: string;
  value: number;
  expiresAt: Date | null;
  active: boolean;

  constructor(props?: Partial<Coupon>) {
    if (props) Object.assign(this, props);
  }

  isApplicable(now: Date = new Date()): boolean {
    return this.active && (!this.expiresAt || new Date(this.expiresAt) >= now);
  }

  /** Percentage coupons scale with the subtotal; any other type is a fixed amount capped at the subtotal. */
  discountFor(subtotal: number): number {
    return this.type === CouponType.PERCENTAGE
      ? subtotal * (Number(this.value) / 100)
      : Math.min(Number(this.value), subtotal);
  }
}
