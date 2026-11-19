import { Module } from '@nestjs/common';
import {
  IsFeatureEnabledUseCase,
  ListFeatureFlagsUseCase,
  SetFeatureFlagUseCase,
} from '@application/use-cases/feature-flags';

import { FeatureFlagsController } from '@presentation/http/controllers';

@Module({
  controllers: [FeatureFlagsController],
  providers: [IsFeatureEnabledUseCase, ListFeatureFlagsUseCase, SetFeatureFlagUseCase],
  exports: [IsFeatureEnabledUseCase],
})
export class FeatureFlagsModule {}
