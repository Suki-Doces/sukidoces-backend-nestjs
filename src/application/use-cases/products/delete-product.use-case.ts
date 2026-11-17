import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../../../domain/repositories';
import { NotFoundError } from '../../errors/application-errors';

/** Soft delete: the product is deactivated so past orders keep their references. */
@Injectable()
export class DeleteProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: number): Promise<void> {
    if (!(await this.products.findById(id))) {
      throw new NotFoundError('Product not found');
    }
    await this.products.deactivate(id);
  }
}
