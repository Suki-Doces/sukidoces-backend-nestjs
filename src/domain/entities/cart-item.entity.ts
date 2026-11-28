import type { Product } from './product.entity';
import type { User } from './user.entity';

export class CartItem {
  id!: number;
  userId!: number;
  productId!: number;
  quantity!: number;
  addedAt!: Date;
  user?: User;
  product?: Product;

  constructor(props?: Partial<CartItem>) {
    if (props) Object.assign(this, props);
  }

  belongsTo(userId: number): boolean {
    return this.userId === userId;
  }
}
