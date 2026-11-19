import { Injectable } from '@nestjs/common';
import { Product } from '@domain/entities';
import { ProductRepository, ProductSearchCriteria, ProductSort } from '@domain/repositories';
import { buildPagination, clampPagination, Pagination } from '@application/common';

export interface ListProductsInput {
  category?: string;
  query?: string;
  filter?: string;
  minPrice?: string;
  maxPrice?: string;
  isAdmin?: string;
  page?: string;
  limit?: string;
}

const SORTS: Record<string, ProductSort> = {
  newest: 'newest',
  'lowest-price': 'price-asc',
  'highest-price': 'price-desc',
};

@Injectable()
export class ListProductsUseCase {
  constructor(private readonly products: ProductRepository) {}

  /** Only the admin listing is paginated (opted in with isAdmin). */
  async execute(
    input: ListProductsInput,
  ): Promise<{ products: Product[]; pagination?: Pagination }> {
    const criteria: ProductSearchCriteria = {};
    if (input.category) criteria.categoryId = parseInt(input.category, 10);
    if (input.query) criteria.nameContains = input.query;
    if (input.minPrice) criteria.minPrice = parseFloat(input.minPrice);
    if (input.maxPrice) criteria.maxPrice = parseFloat(input.maxPrice);

    const { page, limit, skip } = clampPagination(input.page, input.limit, input.isAdmin ? 10 : 20);
    const sort = input.filter ? SORTS[input.filter] : undefined;

    const products = await this.products.search(criteria, {
      sort,
      ...(input.isAdmin && { take: limit, skip }),
    });

    if (input.isAdmin) {
      const total = await this.products.count(criteria);
      return { products, pagination: buildPagination(total, page, limit) };
    }

    return { products };
  }
}
