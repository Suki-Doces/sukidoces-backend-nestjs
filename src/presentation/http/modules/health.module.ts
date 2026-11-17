import { Module } from '@nestjs/common';
import { CheckHealthUseCase } from '../../../application/use-cases/health/check-health.use-case';
import { HealthController } from '../controllers/health.controller';

@Module({
  controllers: [HealthController],
  providers: [CheckHealthUseCase],
})
export class HealthModule {}
