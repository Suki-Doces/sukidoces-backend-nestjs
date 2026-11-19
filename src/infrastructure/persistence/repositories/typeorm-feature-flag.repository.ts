import { Repository } from 'typeorm';
import { InternalError } from '@application/errors';
import { FeatureFlag } from '@domain/entities';
import { FeatureFlagRepository } from '@domain/repositories';

export class TypeOrmFeatureFlagRepository implements FeatureFlagRepository {
  constructor(private readonly repo: Repository<FeatureFlag>) {}

  findByKey(key: string) {
    return this.repo.findOne({ where: { key } });
  }

  findAll() {
    return this.repo.find({ order: { key: 'ASC' } });
  }

  async upsert(key: string, enabled: boolean) {
    await this.repo.upsert({ key, enabled }, ['key']);
    const featureFlag = await this.findByKey(key);
    if (!featureFlag) {
      throw new InternalError(`Feature flag "${key}" was not found after upsert`);
    }
    return featureFlag;
  }
}
