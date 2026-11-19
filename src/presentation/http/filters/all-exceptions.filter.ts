import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApplicationError,
  BadRequestError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  UnauthorizedError,
} from '@application/errors';
import { ErrorReporter } from '@application/ports';
import { DomainError, OrderNotOwnedError } from '@domain/errors';
import { mapDatabaseError } from './database-error-mapper';

const REASON_PHRASES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
};

interface MulterError extends Error {
  code: string;
}

function isMulterError(error: unknown): error is MulterError {
  return (
    error instanceof Error &&
    error.name === 'MulterError' &&
    'code' in error &&
    typeof error.code === 'string'
  );
}

/**
 * Single global filter and the only place where application/domain errors
 * become HTTP responses. Business errors (4xx) are logged as warnings; technical
 * failures (5xx) are logged with the stack trace and reported.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  constructor(private readonly errorReporter: ErrorReporter) {}

  catch(error: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    // Errors that already carry a complete HTTP response (validation, 404 route, throttling...).
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const body = error.getResponse();
      return this.send(
        response,
        request,
        status,
        typeof body === 'string' ? { statusCode: status, message: body } : body,
        error,
      );
    }

    if (isMulterError(error)) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'Image too large. The maximum size is 5MB.'
          : error.message;
      return this.send(response, request, 400, this.body(400, message));
    }

    const status = this.statusFor(error);
    if (status) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return this.send(response, request, status, this.body(status, message), error);
    }

    const mapped = mapDatabaseError(error);
    if (mapped) {
      return this.send(
        response,
        request,
        mapped.status,
        this.body(mapped.status, mapped.message),
        error,
      );
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    return this.send(response, request, 500, this.body(500, message), error);
  }

  private statusFor(error: unknown): number | null {
    if (error instanceof OrderNotOwnedError) return 403;
    if (error instanceof DomainError) return 400;
    if (error instanceof BadRequestError) return 400;
    if (error instanceof UnauthorizedError) return 401;
    if (error instanceof ForbiddenError) return 403;
    if (error instanceof NotFoundError) return 404;
    if (error instanceof InternalError) return 500;
    if (error instanceof ApplicationError) return 500;
    return null;
  }

  private body(status: number, message: string) {
    return { statusCode: status, message, error: REASON_PHRASES[status] };
  }

  private send(
    response: Response,
    request: Request,
    status: number,
    body: unknown,
    error?: unknown,
  ) {
    const context = `${request?.method ?? ''} ${request?.originalUrl ?? request?.url ?? ''}`.trim();

    if (status >= 500) {
      this.logger.error(`[${status}] ${context}`, error instanceof Error ? error.stack : undefined);
      this.errorReporter.capture(error);
    } else {
      this.logger.warn(`[${status}] ${context} - ${JSON.stringify(body)}`);
    }

    return response.status(status).json(body);
  }
}
