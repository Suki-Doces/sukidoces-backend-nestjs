import { Injectable } from '@nestjs/common';
import { CartRepository, ProductRepository } from '@domain/repositories';
import { BadRequestError, NotFoundError } from '@application/errors';

export interface AddToCartInput {
  userId: number;
  productId?: number;
  quantity?: number;
}

@Injectable()
export class AddToCartUseCase {
  constructor(
    private readonly cart: CartRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: AddToCartInput): Promise<void> {
    const { userId, productId, quantity } = input;

    if (!productId || !quantity || quantity < 1) {
      throw new BadRequestError('Invalid product or quantity');
    }

    const product = await this.products.findById(Number(productId));
    if (!product) throw new NotFoundError('Product not found');

    if (!product.hasEnoughStock(Number(quantity))) {
      throw new BadRequestError('Insufficient stock');
    }

    const existing = await this.cart.findByUserAndProduct(userId, Number(productId));

    if (existing) {
      const newQuantity = existing.quantity + Number(quantity);
      if (!product.hasEnoughStock(newQuantity)) {
        throw new BadRequestError('Insufficient stock for the total quantity');
      }
      await this.cart.updateQuantity(existing.id, newQuantity);
      return;
    }

    await this.cart.create({ userId, productId: Number(productId), quantity: Number(quantity) });
  }
}
