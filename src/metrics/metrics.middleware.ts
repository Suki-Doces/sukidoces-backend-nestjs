import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime();

    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(start);
      const durationSeconds = seconds + nanoseconds / 1e9;
      const route = (req as any).route?.path || req.path;

      const labels = { method: req.method, route, status_code: String(res.statusCode) };

      this.metricsService.httpRequestDuration.observe(labels, durationSeconds);
      this.metricsService.httpRequestsTotal.inc(labels);
    });

    next();
  }
}
