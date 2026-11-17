import { Module } from '@nestjs/common';
import { MetricsController } from '../controllers/metrics.controller';

@Module({ controllers: [MetricsController] })
export class MetricsModule {}
