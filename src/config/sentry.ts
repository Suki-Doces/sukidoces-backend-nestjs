import * as Sentry from '@sentry/node';
import { Logger } from '@nestjs/common';

const logger = new Logger('Sentry');

export function initSentry(dsn?: string) {
  if (!dsn) {
    logger.log('SENTRY_DSN não configurado — captura de erros para o Sentry desativada.');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
  logger.log('Sentry inicializado.');
}

export function captureException(err: unknown) {
  Sentry.captureException(err);
}
