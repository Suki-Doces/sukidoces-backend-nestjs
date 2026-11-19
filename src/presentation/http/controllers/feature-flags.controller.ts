import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ListFeatureFlagsUseCase,
  SetFeatureFlagUseCase,
} from '@application/use-cases/feature-flags';

import { SetFeatureFlagDto } from '@presentation/http/dto';
import { AdminGuard, JwtAuthGuard } from '@presentation/http/guards';

import { successResponse, presentFeatureFlag } from '@presentation/http/support';

@ApiTags('feature-flags')
@Controller('admin/feature-flags')
@UseGuards(JwtAuthGuard, AdminGuard)
export class FeatureFlagsController {
  constructor(
    private readonly listFlags: ListFeatureFlagsUseCase,
    private readonly setFlag: SetFeatureFlagUseCase,
  ) {}

  @Get()
  async list() {
    return successResponse(
      'Feature flags loaded successfully',
      (await this.listFlags.execute()).map(presentFeatureFlag),
    );
  }

  @Put(':key')
  async set(@Param('key') key: string, @Body() dto: SetFeatureFlagDto) {
    return successResponse(
      `Feature flag "${key}" updated`,
      presentFeatureFlag(await this.setFlag.execute(key, dto.enabled)),
    );
  }
}
