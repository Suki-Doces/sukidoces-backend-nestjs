import { Injectable } from '@nestjs/common';
import { Product } from '@domain/entities';
import { ProductRepository } from '@domain/repositories';
import { BadRequestError, NotFoundError } from '@application/errors';

@Injectable()
export class GetProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: number): Promise<Product> {
    if (isNaN(id)) {
      throw new BadRequestError('Invalid ID');
    }

    const product = await this.products.findByIdWithCategory(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }
}
