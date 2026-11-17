import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext, UnitOfWork } from '../../application/ports/unit-of-work';
import { OrderItemSchema, OrderSchema, ProductSchema } from './schemas/schemas';
import { TypeOrmOrderRepository } from './repositories/typeorm-order.repository';
import { TypeOrmProductRepository } from './repositories/typeorm-product.repository';

@Injectable()
export class TypeOrmUnitOfWork extends UnitOfWork {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  run<T>(work: (context: TransactionContext) => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) =>
      work({
        orders: new TypeOrmOrderRepository(manager.getRepository(OrderSchema), manager.getRepository(OrderItemSchema)),
        products: new TypeOrmProductRepository(manager.getRepository(ProductSchema)),
      }),
    );
  }
}
