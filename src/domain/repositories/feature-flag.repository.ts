import { FeatureFlag } from '@domain/entities';

export abstract class FeatureFlagRepository {
  abstract findByKey(key: string): Promise<FeatureFlag | null>;
  abstract findAll(): Promise<FeatureFlag[]>;
  abstract upsert(key: string, enabled: boolean): Promise<FeatureFlag>;
}
