import { Inject, Injectable } from '@nestjs/common';
import { buildHealthReport, HealthReport, ProbeResult } from '@domain/health';
import { HEALTH_PROBES, HealthProbe } from '@application/ports';

@Injectable()
export class CheckHealthUseCase {
  constructor(@Inject(HEALTH_PROBES) private readonly probes: HealthProbe[]) {}

  /** Readiness: runs every dependency probe. A probe that throws counts as "down". */
  async execute(): Promise<HealthReport> {
    const entries = await Promise.all(
      this.probes.map(async (probe): Promise<[string, ProbeResult]> => {
        const startedAt = Date.now();
        try {
          return [probe.name, await probe.check()];
        } catch (error) {
          return [
            probe.name,
            {
              status: 'down',
              responseTimeMs: Date.now() - startedAt,
              details: { error: (error as Error).message },
            },
          ];
        }
      }),
    );

    return buildHealthReport(Object.fromEntries(entries), process.uptime());
  }

  /** Liveness: the process is up and able to answer. It deliberately checks no dependency. */
  liveness(): { status: 'ok'; uptimeSeconds: number } {
    return { status: 'ok', uptimeSeconds: process.uptime() };
  }
}
