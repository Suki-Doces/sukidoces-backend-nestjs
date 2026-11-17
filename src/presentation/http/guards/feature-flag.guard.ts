import { CanActivate, ExecutionContext, Injectable, mixin, Type } from '@nestjs/common';
import { ForbiddenError } from '../../../application/errors/application-errors';
import { IsFeatureEnabledUseCase } from '../../../application/use-cases/feature-flags/is-feature-enabled.use-case';

/** Blocks the route while the given feature flag is disabled. Usage: @UseGuards(FeatureFlagGuard('webhooks')). */
export function FeatureFlagGuard(key: string): Type<CanActivate> {
  @Injectable()
  class FeatureFlagGuardMixin implements CanActivate {
    constructor(private readonly isFeatureEnabled: IsFeatureEnabledUseCase) {}

    async canActivate(_context: ExecutionContext): Promise<boolean> {
      if (!(await this.isFeatureEnabled.execute(key))) {
        throw new ForbiddenError(`Feature "${key}" is currently disabled.`);
      }
      return true;
    }
  }

  return mixin(FeatureFlagGuardMixin);
}
