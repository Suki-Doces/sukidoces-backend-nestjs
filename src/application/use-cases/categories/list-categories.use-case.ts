import { Injectable } from '@nestjs/common';
import { Category } from '../../../domain/entities';
import { CategoryRepository } from '../../../domain/repositories';
import { InternalError } from '../../errors/application-errors';

@Injectable()
export class ListCategoriesUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  async execute(): Promise<Category[]> {
    try {
      return await this.categories.findAll();
    } catch {
      throw new InternalError('Internal error while fetching categories.');
    }
  }
}
