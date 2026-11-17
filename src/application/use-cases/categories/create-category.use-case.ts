import { Injectable } from '@nestjs/common';
import { Category } from '../../../domain/entities';
import { CategoryRepository } from '../../../domain/repositories';
import { InternalError } from '../../errors/application-errors';

@Injectable()
export class CreateCategoryUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  async execute(input: { name: string; description?: string }): Promise<Category> {
    try {
      return await this.categories.create(input);
    } catch {
      throw new InternalError('Error creating the category.');
    }
  }
}
