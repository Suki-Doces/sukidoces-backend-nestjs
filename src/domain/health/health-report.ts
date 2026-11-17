export type ProbeStatus = 'up' | 'down';

export interface ProbeResult {
  status: ProbeStatus;
  responseTimeMs: number;
  details?: Record<string, unknown>;
}

export interface HealthReport {
  status: 'ok' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  checks: Record<string, ProbeResult>;
}

/** The application is healthy only when every dependency probe is up. */
export function buildHealthReport(checks: Record<string, ProbeResult>, uptimeSeconds: number, now = new Date()): HealthReport {
  const allUp = Object.values(checks).every((check) => check.status === 'up');
  return {
    status: allUp ? 'ok' : 'error',
    timestamp: now.toISOString(),
    uptimeSeconds,
    checks,
  };
}
