import type { Order } from './order.entity';
import type { Product } from './product.entity';

export class OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  order?: Order;
  product?: Product;

  constructor(props?: Partial<OrderItem>) {
    if (props) Object.assign(this, props);
  }
}
