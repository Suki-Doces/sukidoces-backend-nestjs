import { Repository } from 'typeorm';
import { Webhook } from '@domain/entities';
import { WebhookRepository } from '@domain/repositories';

export class TypeOrmWebhookRepository implements WebhookRepository {
  constructor(private readonly repo: Repository<Webhook>) {}

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findActive() {
    return this.repo.find({ where: { active: true } });
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: { url: string; events: string }) {
    return this.repo.save(this.repo.create({ ...data, active: true }));
  }

  async delete(id: number) {
    await this.repo.delete({ id });
  }
}
