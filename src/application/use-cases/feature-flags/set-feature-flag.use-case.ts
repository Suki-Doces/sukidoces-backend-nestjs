import { Injectable } from '@nestjs/common';
import { FeatureFlag } from '../../../domain/entities';
import { FeatureFlagRepository } from '../../../domain/repositories';

@Injectable()
export class SetFeatureFlagUseCase {
  constructor(private readonly flags: FeatureFlagRepository) {}

  execute(key: string, enabled: boolean): Promise<FeatureFlag> {
    return this.flags.upsert(key, enabled);
  }
}
