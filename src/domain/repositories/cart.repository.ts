import { CartItem } from '../entities';

export abstract class CartRepository {
  abstract findByUser(userId: number): Promise<CartItem[]>;
  abstract findByUserAndProduct(userId: number, productId: number): Promise<CartItem | null>;
  abstract findByIdWithProduct(id: number): Promise<CartItem | null>;
  abstract findById(id: number): Promise<CartItem | null>;
  abstract create(data: { userId: number; productId: number; quantity: number }): Promise<CartItem>;
  abstract updateQuantity(id: number, quantity: number): Promise<void>;
  abstract deleteById(id: number): Promise<void>;
  abstract deleteByUser(userId: number): Promise<void>;
}
