import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const startedAt = Date.now();

    response.on('finish', () => {
      const message = `${new Date().toISOString()} | ${request.method} ${request.path} | Status: ${response.statusCode} | ${Date.now() - startedAt}ms`;
      if (response.statusCode >= 400) console.error(message);
      else console.log(message);
    });

    next();
  }
}
