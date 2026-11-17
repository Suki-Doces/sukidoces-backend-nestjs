import { Injectable } from '@nestjs/common';
import { Category } from '../../../domain/entities';
import { CategoryRepository } from '../../../domain/repositories';
import { CacheStore } from '../../ports';

const CACHE_KEY = 'products:categories';

@Injectable()
export class ListProductCategoriesUseCase {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly cache: CacheStore,
  ) {}

  async execute(): Promise<Category[]> {
    const cached = await this.cache.get<Category[]>(CACHE_KEY);
    if (cached) {
      return cached;
    }

    const categories = await this.categories.findAllPublic();
    await this.cache.set(CACHE_KEY, categories);
    return categories;
  }
}
