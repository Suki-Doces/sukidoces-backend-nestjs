import { Injectable } from '@nestjs/common';
import { CartRepository } from '@domain/repositories';
import { BadRequestError, ForbiddenError } from '@application/errors';

@Injectable()
export class UpdateCartItemQuantityUseCase {
  constructor(private readonly cart: CartRepository) {}

  async execute(input: { userId: number; itemId: number; quantity: number }): Promise<void> {
    const { userId, itemId, quantity } = input;

    if (!quantity || quantity < 1) {
      throw new BadRequestError('Invalid quantity');
    }

    const item = await this.cart.findByIdWithProduct(itemId);
    if (!item || !item.belongsTo(userId)) {
      throw new ForbiddenError('Not authorized or item not found');
    }

    if ((item.product?.quantity ?? 0) < Number(quantity)) {
      throw new BadRequestError('Insufficient stock');
    }

    await this.cart.updateQuantity(itemId, Number(quantity));
  }
}
