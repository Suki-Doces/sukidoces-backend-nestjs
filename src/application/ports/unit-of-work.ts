import { OrderRepository } from '../../domain/repositories/order.repository';
import { ProductRepository } from '../../domain/repositories/product.repository';

/** Repositories bound to a single database transaction. */
export interface TransactionContext {
  orders: OrderRepository;
  products: ProductRepository;
}

export abstract class UnitOfWork {
  /** Runs the work atomically: commit when it resolves, rollback when it throws. */
  abstract run<T>(work: (context: TransactionContext) => Promise<T>): Promise<T>;
}
