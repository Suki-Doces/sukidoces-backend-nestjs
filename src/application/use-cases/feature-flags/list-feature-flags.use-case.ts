import { Injectable } from '@nestjs/common';
import { FeatureFlag } from '../../../domain/entities';
import { FeatureFlagRepository } from '../../../domain/repositories';

@Injectable()
export class ListFeatureFlagsUseCase {
  constructor(private readonly flags: FeatureFlagRepository) {}

  execute(): Promise<FeatureFlag[]> {
    return this.flags.findAll();
  }
}
