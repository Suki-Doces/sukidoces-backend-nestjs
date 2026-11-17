import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LoginUseCase } from '../../../application/use-cases/auth/login.use-case';
import { GetDashboardUseCase } from '../../../application/use-cases/admin/get-dashboard.use-case';
import { LoginDto } from '../dto/auth.dto';
import { AdminGuard } from '../guards/admin.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { successResponse } from '../support/api-response';
import { presentDashboard, presentSession } from '../support/presenters';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly getDashboard: GetDashboardUseCase,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Admin login (same unified logic as user login)' })
  async signIn(@Body() dto: LoginDto) {
    return successResponse('Admin login successful', presentSession(await this.login.execute(dto)));
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sales metrics and summary for the admin panel' })
  async dashboard() {
    return successResponse('Dashboard loaded successfully', presentDashboard(await this.getDashboard.execute()));
  }
}
