import { Module } from '@nestjs/common';
import { MetricsController } from '@presentation/http/controllers';

@Module({ controllers: [MetricsController] })
export class MetricsModule {}
