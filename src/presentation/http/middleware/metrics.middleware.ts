import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { Metrics } from '../../../application/ports/metrics';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: Metrics) {}

  use(request: Request, response: Response, next: NextFunction) {
    const start = process.hrtime();

    response.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(start);
      const route = (request as any).route?.path || request.path;
      this.metrics.recordHttpRequest(request.method, route, response.statusCode, seconds + nanoseconds / 1e9);
    });

    next();
  }
}
