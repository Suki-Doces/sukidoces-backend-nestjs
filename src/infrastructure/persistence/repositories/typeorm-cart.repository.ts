import { Repository } from 'typeorm';
import { CartItem } from '@domain/entities';
import { CartRepository } from '@domain/repositories';

export class TypeOrmCartRepository implements CartRepository {
  constructor(private readonly repo: Repository<CartItem>) {}

  findByUser(userId: number) {
    return this.repo.find({
      where: { userId },
      order: { addedAt: 'DESC' },
      relations: ['product'],
    });
  }

  findByUserAndProduct(userId: number, productId: number) {
    return this.repo.findOne({ where: { userId, productId } });
  }

  findByIdWithProduct(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['product'] });
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: { userId: number; productId: number; quantity: number }) {
    return this.repo.save(this.repo.create(data));
  }

  async updateQuantity(id: number, quantity: number) {
    await this.repo.update({ id }, { quantity });
  }

  async deleteById(id: number) {
    await this.repo.delete({ id });
  }

  async deleteByUser(userId: number) {
    await this.repo.delete({ userId });
  }
}
