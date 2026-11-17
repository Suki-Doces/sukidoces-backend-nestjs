import { Category } from '../entities';

export abstract class CategoryRepository {
  abstract findAll(): Promise<Category[]>;
  abstract findById(id: number): Promise<Category | null>;
  abstract findAllPublic(): Promise<Category[]>;
  abstract create(data: { name: string; description?: string }): Promise<Category>;
  abstract update(id: number, data: Partial<Category>): Promise<Category | null>;
  abstract delete(id: number): Promise<void>;
}
