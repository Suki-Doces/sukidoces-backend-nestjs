import { Injectable } from '@nestjs/common';
import { FeatureFlagRepository } from '../../../domain/repositories';

@Injectable()
export class IsFeatureEnabledUseCase {
  constructor(private readonly flags: FeatureFlagRepository) {}

  /** Unknown flags are disabled (fail-safe): a new feature never turns itself on. */
  async execute(key: string): Promise<boolean> {
    const flag = await this.flags.findByKey(key);
    return flag?.enabled ?? false;
  }
}
