import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListFeatureFlagsUseCase } from '../../../application/use-cases/feature-flags/list-feature-flags.use-case';
import { SetFeatureFlagUseCase } from '../../../application/use-cases/feature-flags/set-feature-flag.use-case';
import { SetFeatureFlagDto } from '../dto/feature-flag.dto';
import { AdminGuard } from '../guards/admin.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { successResponse } from '../support/api-response';
import { presentFeatureFlag } from '../support/presenters';

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
    return successResponse('Feature flags loaded successfully', (await this.listFlags.execute()).map(presentFeatureFlag));
  }

  @Put(':key')
  async set(@Param('key') key: string, @Body() dto: SetFeatureFlagDto) {
    return successResponse(`Feature flag "${key}" updated`, presentFeatureFlag(await this.setFlag.execute(key, dto.enabled)));
  }
}
