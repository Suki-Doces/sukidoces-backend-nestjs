import { Repository } from 'typeorm';
import { FeatureFlag } from '../../../domain/entities';
import { FeatureFlagRepository } from '../../../domain/repositories';

export class TypeOrmFeatureFlagRepository implements FeatureFlagRepository {
  constructor(private readonly repo: Repository<FeatureFlag>) {}

  findByKey(key: string) {
    return this.repo.findOne({ where: { key } });
  }

  findAll() {
    return this.repo.find({ order: { key: 'ASC' } });
  }

  async upsert(key: string, enabled: boolean) {
    await this.repo.upsert({ key, enabled } as any, ['key']);
    return this.findByKey(key);
  }
}
