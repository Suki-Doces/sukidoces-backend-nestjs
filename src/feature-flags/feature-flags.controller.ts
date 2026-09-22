import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { FeatureFlagsService } from './feature-flags.service';
import { SetFeatureFlagDto } from './dto/set-feature-flag.dto';

@ApiTags('admin-feature-flags')
@Controller('admin/feature-flags')
@UseGuards(JwtAuthGuard, AdminGuard)
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  listar() {
    return this.featureFlagsService.listar();
  }

  @Put(':chave')
  definir(@Param('chave') chave: string, @Body() dto: SetFeatureFlagDto) {
    return this.featureFlagsService.definir(chave, dto.ativo);
  }
}
