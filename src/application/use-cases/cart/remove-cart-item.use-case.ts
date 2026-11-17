import { Injectable } from '@nestjs/common';
import { CartRepository } from '../../../domain/repositories';
import { ForbiddenError } from '../../errors/application-errors';

@Injectable()
export class RemoveCartItemUseCase {
  constructor(private readonly cart: CartRepository) {}

  async execute(userId: number, itemId: number): Promise<void> {
    const item = await this.cart.findById(itemId);
    if (!item || !item.belongsTo(userId)) {
      throw new ForbiddenError('Not authorized or item not found');
    }
    await this.cart.deleteById(itemId);
  }
}
