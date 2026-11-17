import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';
import { Metrics } from '../../application/ports/metrics';

@Injectable()
export class PrometheusMetrics extends Metrics {
  private readonly registry = new client.Registry();
  readonly contentType: string;

  private readonly requestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [this.registry],
  });

  private readonly requestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  });

  constructor() {
    super();
    client.collectDefaultMetrics({ register: this.registry });
    this.contentType = this.registry.contentType;
  }

  recordHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number): void {
    const labels = { method, route, status_code: String(statusCode) };
    this.requestDuration.observe(labels, durationSeconds);
    this.requestsTotal.inc(labels);
  }

  export(): Promise<string> {
    return this.registry.metrics();
  }
}
