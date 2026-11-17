import { Injectable } from '@nestjs/common';
import { Product } from '../../../domain/entities';
import { CartRepository } from '../../../domain/repositories';

export interface CartLine {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  addedAt: Date;
  product: Product;
  total: number;
}

export interface CartSummary {
  cartItems: CartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  freeShipping: boolean;
  itemCount: number;
}

const FREE_SHIPPING_THRESHOLD = 50;
const SHIPPING_FEE = 8.9;

@Injectable()
export class ListCartUseCase {
  constructor(private readonly cart: CartRepository) {}

  async execute(userId: number): Promise<CartSummary> {
    const items = await this.cart.findByUser(userId);

    const cartItems: CartLine[] = items.map((item) => ({
      id: item.id,
      userId: item.userId,
      productId: item.productId,
      quantity: item.quantity,
      addedAt: item.addedAt,
      product: item.product,
      total: Number(item.product.price) * item.quantity,
    }));

    const subtotal = cartItems.reduce((sum, line) => sum + line.total, 0);
    const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shipping = freeShipping ? 0 : SHIPPING_FEE;

    return { cartItems, subtotal, shipping, total: subtotal + shipping, freeShipping, itemCount: items.length };
  }
}
