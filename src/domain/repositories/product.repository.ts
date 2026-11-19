import { Product } from '@domain/entities';

export interface ProductSearchCriteria {
  categoryId?: number;
  nameContains?: string;
  minPrice?: number;
  maxPrice?: number;
}

export type ProductSort = 'newest' | 'price-asc' | 'price-desc';

export abstract class ProductRepository {
  abstract findByIdWithCategory(id: number): Promise<Product | null>;
  abstract findById(id: number): Promise<Product | null>;
  abstract findManyByIds(ids: number[]): Promise<Product[]>;
  abstract findActiveFeatured(take: number): Promise<Product[]>;
  abstract findActiveByIds(ids: number[]): Promise<Product[]>;
  abstract findNewSince(since: Date, take: number): Promise<Product[]>;
  abstract search(
    criteria: ProductSearchCriteria,
    options: { sort?: ProductSort; take?: number; skip?: number },
  ): Promise<Product[]>;
  abstract count(criteria: ProductSearchCriteria): Promise<number>;
  abstract create(data: Partial<Product>): Promise<Product>;
  abstract update(id: number, data: Partial<Product>): Promise<Product | null>;
  abstract increaseStock(id: number, quantity: number): Promise<void>;
  abstract decreaseStock(id: number, quantity: number): Promise<void>;
  abstract deactivate(id: number): Promise<void>;
  abstract findBasicInfoByIds(ids: number[]): Promise<Product[]>;
  abstract findAllBasicInfo(): Promise<Product[]>;
}
