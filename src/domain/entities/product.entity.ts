import { InsufficientStockError } from '@domain/errors';
import type { Category } from './category.entity';

export class Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  image: string | null;
  active: boolean;
  categoryId: number | null;
  createdAt: Date;
  category?: Category | null;

  constructor(props?: Partial<Product>) {
    if (props) Object.assign(this, props);
  }

  hasEnoughStock(desiredQuantity: number): boolean {
    return this.quantity >= desiredQuantity;
  }

  /**
   * Validates (and mutates the in-memory object only). The real stock write
   * is an atomic `quantity = quantity - N` in the repository, which avoids a
   * read-modify-write race between concurrent checkouts.
   */
  decreaseStock(quantity: number): void {
    if (!this.hasEnoughStock(quantity)) {
      throw new InsufficientStockError(this.name, this.quantity);
    }
    this.quantity -= quantity;
  }

  increaseStock(quantity: number): void {
    this.quantity += quantity;
  }

  subtotalFor(quantity: number): number {
    return Number(this.price) * quantity;
  }
}
