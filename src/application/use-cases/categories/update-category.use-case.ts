import { Injectable } from '@nestjs/common';
import { Category } from '@domain/entities';
import { CategoryRepository } from '@domain/repositories';
import { InternalError, NotFoundError } from '@application/errors';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  async execute(
    id: number,
    changes: { name?: string; description?: string },
  ): Promise<Category | null> {
    if (!(await this.categories.findById(id))) {
      throw new NotFoundError('Category not found');
    }

    try {
      return await this.categories.update(id, changes);
    } catch {
      throw new InternalError('Error updating the category.');
    }
  }
}
