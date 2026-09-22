import { CanActivate, ExecutionContext, ForbiddenException, Injectable, mixin, Type } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';

export function FeatureFlagGuard(chave: string): Type<CanActivate> {
  @Injectable()
  class FeatureFlagGuardMixin implements CanActivate {
    constructor(private readonly featureFlagsService: FeatureFlagsService) {}

    async canActivate(_context: ExecutionContext): Promise<boolean> {
      const habilitada = await this.featureFlagsService.isEnabled(chave);
      if (!habilitada) {
        throw new ForbiddenException(`Funcionalidade "${chave}" está desativada no momento.`);
      }
      return true;
    }
  }

  return mixin(FeatureFlagGuardMixin);
}
