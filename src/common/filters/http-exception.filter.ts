import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { mapDbError } from './db-error-mapper';
import { captureException } from '../../config/sentry';

// Filtro global único. Delega o mapeamento de erros de banco para uma
// função pura (db-error-mapper.ts) em vez de registrar um segundo
// @Catch() especializado — o Nest resolve múltiplos filtros globais numa
// ordem que depende de como foram registrados, fácil de acertar errado
// silenciosamente. Um filtro único com lógica interna clara é mais
// previsível.
//
// Separa explicitamente erro de NEGÓCIO (HttpException 4xx) de erro
// TÉCNICO (5xx) para fins de log: negócio vira 'warn' sem stack, técnico
// vira 'error' com stack completo + Sentry.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(err: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest();

    if (err.name === 'JsonWebTokenError') {
      return this.respond(res, req, 401, { error: 'Invalid token' }, false);
    }
    if (err.name === 'TokenExpiredError') {
      return this.respond(res, req, 401, { error: 'Token expired' }, false);
    }

    if (err.name === 'MulterError') {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return this.respond(
          res,
          req,
          400,
          { error: 'Imagem muito grande. O tamanho máximo é 5MB.' },
          false,
        );
      }
      return this.respond(res, req, 400, { error: err.message }, false);
    }

    const mapped = mapDbError(err);
    if (mapped) {
      const status = mapped.getStatus();
      return this.respond(res, req, status, mapped.getResponse(), status >= 500);
    }

    if (err instanceof HttpException) {
      const status = err.getStatus();
      const response = err.getResponse();
      const body = typeof response === 'string' ? { error: response } : response;
      return this.respond(res, req, status, body, status >= 500, err);
    }

    return this.respond(
      res,
      req,
      err.status || 500,
      {
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
      true,
      err,
    );
  }

  private respond(
    res: Response,
    req: any,
    status: number,
    body: unknown,
    isTechnical: boolean,
    err?: any,
  ) {
    const context = `${req?.method ?? ''} ${req?.originalUrl ?? req?.url ?? ''}`.trim();

    if (isTechnical) {
      this.logger.error(`[${status}] ${context}`, err?.stack);
      captureException(err);
    } else {
      this.logger.warn(`[${status}] ${context} — ${JSON.stringify(body)}`);
    }

    return res.status(status).json(body);
  }
}
