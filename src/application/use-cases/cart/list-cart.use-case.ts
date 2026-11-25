import { Injectable } from '@nestjs/common';
import { Product } from '@domain/entities';
import { CartRepository } from '@domain/repositories';
import { quoteShipping } from '@domain/shipping';
import { InternalError } from '@application/errors';
import { DestinationInput, ShippingDestinationResolver } from '@application/shipping';

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
  /** False while no usable destination is known: shipping is then 0 and decided at checkout. */
  shippingCalculated: boolean;
  itemCount: number;
}

@Injectable()
export class ListCartUseCase {
  constructor(
    private readonly cart: CartRepository,
    private readonly destinations: ShippingDestinationResolver,
  ) {}

  /** Shipping depends on where the order goes: the sent destination, else the saved main address. */
  async execute(userId: number, destinationInput?: DestinationInput): Promise<CartSummary> {
    const items = await this.cart.findByUser(userId);

    const cartItems: CartLine[] = items.map((item) => {
      const product = item.product;
      if (!product) {
        throw new InternalError(`Cart item ${item.id} has no associated product`);
      }

      return {
        id: item.id,
        userId: item.userId,
        productId: item.productId,
        quantity: item.quantity,
        addedAt: item.addedAt,
        product,
        total: Number(product.price) * item.quantity,
      };
    });

    const subtotal = cartItems.reduce((sum, line) => sum + line.total, 0);

    const resolved = cartItems.length
      ? await this.destinations.resolve(userId, destinationInput)
      : ({ status: 'missing' } as const);
    const quote = resolved.status === 'ok' ? quoteShipping(subtotal, resolved.destination) : null;
    const shipping = quote?.amount ?? 0;

    return {
      cartItems,
      subtotal,
      shipping,
      total: subtotal + shipping,
      freeShipping: quote?.freeShipping ?? false,
      shippingCalculated: quote !== null,
      itemCount: items.length,
    };
  }
}
