import { Repository } from 'typeorm';
import { Coupon } from '@domain/entities';
import { CouponRepository } from '@domain/repositories';

export class TypeOrmCouponRepository implements CouponRepository {
  constructor(private readonly repo: Repository<Coupon>) {}

  findByCode(code: string) {
    return this.repo.findOne({ where: { code } });
  }

  findAll() {
    return this.repo.find({
      select: { id: true, code: true, type: true, value: true, expiresAt: true, active: true },
    });
  }
}
