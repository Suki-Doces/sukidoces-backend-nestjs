import { Module } from '@nestjs/common';
import { CheckHealthUseCase } from '@application/use-cases/health';
import { HealthController } from '@presentation/http/controllers';

@Module({
  controllers: [HealthController],
  providers: [CheckHealthUseCase],
})
export class HealthModule {}
