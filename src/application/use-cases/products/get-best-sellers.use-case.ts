import { Injectable } from '@nestjs/common';
import { Product } from '@domain/entities';
import { OrderRepository, ProductRepository } from '@domain/repositories';

@Injectable()
export class GetBestSellersUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly products: ProductRepository,
  ) {}

  /** Falls back to featured products while there are no sales yet. */
  async execute(): Promise<{ featured: boolean; products: Product[] }> {
    const bestSelling = await this.orders.bestSellingProducts(8);

    if (bestSelling.length === 0) {
      return { featured: true, products: await this.products.findActiveFeatured(8) };
    }

    const ids = bestSelling.map((item) => item.productId);
    const found = await this.products.findActiveByIds(ids);
    const ordered = ids
      .map((id) => found.find((product) => product.id === id))
      .filter((product): product is Product => product !== undefined);
    return { featured: false, products: ordered };
  }
}
