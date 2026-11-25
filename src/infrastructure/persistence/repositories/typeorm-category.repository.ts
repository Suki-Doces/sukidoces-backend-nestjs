import { Repository } from 'typeorm';
import { Category } from '@domain/entities';
import { CategoryRepository } from '@domain/repositories';

export class TypeOrmCategoryRepository implements CategoryRepository {
  constructor(private readonly repo: Repository<Category>) {}

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  findAllPublic() {
    return this.repo.find({
      select: { id: true, name: true, description: true },
      order: { name: 'ASC' },
    });
  }

  create(data: { name: string; description?: string }) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Category>) {
    await this.repo.update({ id }, data);
    return this.findById(id);
  }

  async delete(id: number) {
    await this.repo.delete({ id });
  }
}
