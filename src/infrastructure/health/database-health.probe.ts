import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthProbe } from '@application/ports';
import { ProbeResult } from '@domain/health';

@Injectable()
export class DatabaseHealthProbe implements HealthProbe {
  readonly name = 'database';

  constructor(private readonly dataSource: DataSource) {}

  async check(): Promise<ProbeResult> {
    const startedAt = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up', responseTimeMs: Date.now() - startedAt };
    } catch (error) {
      return {
        status: 'down',
        responseTimeMs: Date.now() - startedAt,
        details: { error: (error as Error).message },
      };
    }
  }
}
