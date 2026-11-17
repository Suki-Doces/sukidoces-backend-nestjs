import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { AppLogger } from '../../application/ports/app-logger';
import { ErrorReporter } from '../../application/ports/error-reporter';

/** Inert unless SENTRY_DSN is set. */
@Injectable()
export class SentryErrorReporter extends ErrorReporter {
  constructor(config: ConfigService, logger: AppLogger) {
    super();
    const dsn = config.get<string>('SENTRY_DSN');
    if (!dsn) {
      logger.log('SENTRY_DSN not set: error reporting to Sentry is disabled.');
      return;
    }
    Sentry.init({ dsn, environment: config.get<string>('NODE_ENV') || 'development', tracesSampleRate: 0.1 });
    logger.log('Sentry initialized.');
  }

  capture(error: unknown): void {
    Sentry.captureException(error);
  }
}
