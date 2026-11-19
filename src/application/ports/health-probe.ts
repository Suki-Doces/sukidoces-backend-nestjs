import { ProbeResult } from '@domain/health';

export interface HealthProbe {
  readonly name: string;
  check(): Promise<ProbeResult>;
}

export const HEALTH_PROBES = Symbol('HEALTH_PROBES');
