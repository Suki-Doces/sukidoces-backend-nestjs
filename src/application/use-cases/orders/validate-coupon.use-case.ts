import { Injectable } from '@nestjs/common';
import { Coupon } from '@domain/entities';
import { CouponRepository } from '@domain/repositories';
import { BadRequestError } from '@application/errors';

export interface ValidateCouponResult {
  coupon: Coupon;
  /** Discount for the given subtotal (0 when no subtotal is informed). */
  discount: number;
}

/**
 * Lets the checkout preview a coupon before placing the order.
 * The checkout itself applies the coupon again, so this never grants a discount on its own.
 */
@Injectable()
export class ValidateCouponUseCase {
  constructor(private readonly coupons: CouponRepository) {}

  async execute(code: string, subtotal = 0): Promise<ValidateCouponResult> {
    const normalized = code?.trim().toUpperCase();
    if (!normalized) {
      throw new BadRequestError('Coupon code is required');
    }

    const coupon = await this.coupons.findByCode(normalized);
    if (!coupon || !coupon.isApplicable()) {
      throw new BadRequestError('Invalid or expired coupon');
    }

    const safeSubtotal = Number.isFinite(subtotal) && subtotal > 0 ? subtotal : 0;
    const discount = Math.round(coupon.discountFor(safeSubtotal) * 100) / 100;
    return { coupon, discount };
  }
}
