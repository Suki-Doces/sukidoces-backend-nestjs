import { Repository } from 'typeorm';
import { ContactMessage } from '@domain/entities';
import { ContactMessageRepository } from '@domain/repositories';

export class TypeOrmContactMessageRepository implements ContactMessageRepository {
  constructor(private readonly repo: Repository<ContactMessage>) {}

  create(data: Partial<ContactMessage>) {
    return this.repo.save(this.repo.create(data));
  }

  findByUser(userId: number) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  save(message: ContactMessage) {
    return this.repo.save(message);
  }
}
