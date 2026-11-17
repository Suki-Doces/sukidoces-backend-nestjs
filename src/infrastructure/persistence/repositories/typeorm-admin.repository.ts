import { Repository } from 'typeorm';
import { Admin } from '../../../domain/entities';
import { AdminRepository } from '../../../domain/repositories';

export class TypeOrmAdminRepository implements AdminRepository {
  constructor(private readonly repo: Repository<Admin>) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async findFirst() {
    const [admin] = await this.repo.find({ take: 1 });
    return admin ?? null;
  }

  async updatePassword(id: number, passwordHash: string) {
    await this.repo.update({ id }, { password: passwordHash });
  }

  async update(id: number, data: Partial<Admin>) {
    await this.repo.update({ id }, data as any);
  }
}
