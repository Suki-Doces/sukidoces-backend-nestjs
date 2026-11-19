import { Injectable } from '@nestjs/common';
import { HealthProbe } from '@application/ports';
import { ProbeResult } from '@domain/health';

const HEAP_LIMIT_BYTES = 500 * 1024 * 1024;
const toMegabytes = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;

@Injectable()
export class MemoryHealthProbe implements HealthProbe {
  readonly name = 'memory';

  async check(): Promise<ProbeResult> {
    const startedAt = Date.now();
    const { heapUsed } = process.memoryUsage();
    return {
      status: heapUsed < HEAP_LIMIT_BYTES ? 'up' : 'down',
      responseTimeMs: Date.now() - startedAt,
      details: { heapUsedMb: toMegabytes(heapUsed), heapLimitMb: toMegabytes(HEAP_LIMIT_BYTES) },
    };
  }
}
