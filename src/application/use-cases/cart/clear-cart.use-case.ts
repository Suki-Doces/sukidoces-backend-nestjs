import { Injectable } from '@nestjs/common';
import { CartRepository } from '@domain/repositories';

@Injectable()
export class ClearCartUseCase {
  constructor(private readonly cart: CartRepository) {}

  execute(userId: number): Promise<void> {
    return this.cart.deleteByUser(userId);
  }
}
