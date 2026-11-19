import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { CheckHealthUseCase } from '@application/use-cases/health';

/**
 * Health endpoints for load balancers and orchestrators (served outside the
 * API prefix, and exempt from rate limiting so probes are never throttled).
 *  - /health        full report (every dependency), 200 when healthy, 503 otherwise
 *  - /health/ready  same report: "can this instance receive traffic?"
 *  - /health/live   process liveness only: "is this instance running?"
 */
@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly checkHealth: CheckHealthUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Full health report (dependencies included)' })
  health(@Res({ passthrough: true }) response: Response) {
    return this.report(response);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  ready(@Res({ passthrough: true }) response: Response) {
    return this.report(response);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return this.checkHealth.liveness();
  }

  private async report(response: Response) {
    const report = await this.checkHealth.execute();
    if (report.status !== 'ok') {
      response.status(503);
    }
    return report;
  }
}
