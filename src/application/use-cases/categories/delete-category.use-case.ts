import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '@domain/repositories';
import { InternalError } from '@application/errors';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  async execute(id: number): Promise<void> {
    try {
      await this.categories.delete(id);
    } catch {
      throw new InternalError('Error deleting the category. It may be linked to products.');
    }
  }
}
