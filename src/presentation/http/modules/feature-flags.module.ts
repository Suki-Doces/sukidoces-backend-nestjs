import { Module } from '@nestjs/common';
import { IsFeatureEnabledUseCase } from '../../../application/use-cases/feature-flags/is-feature-enabled.use-case';
import { ListFeatureFlagsUseCase } from '../../../application/use-cases/feature-flags/list-feature-flags.use-case';
import { SetFeatureFlagUseCase } from '../../../application/use-cases/feature-flags/set-feature-flag.use-case';
import { FeatureFlagsController } from '../controllers/feature-flags.controller';

@Module({
  controllers: [FeatureFlagsController],
  providers: [IsFeatureEnabledUseCase, ListFeatureFlagsUseCase, SetFeatureFlagUseCase],
  exports: [IsFeatureEnabledUseCase],
})
export class FeatureFlagsModule {}
