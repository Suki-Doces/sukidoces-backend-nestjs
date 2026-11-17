import { Injectable } from '@nestjs/common';
import { Product } from '../../../domain/entities';
import { ProductRepository } from '../../../domain/repositories';

@Injectable()
export class GetNewProductsUseCase {
  constructor(private readonly products: ProductRepository) {}

  execute(): Promise<Product[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return this.products.findNewSince(sevenDaysAgo, 20);
  }
}
