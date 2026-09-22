import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logMessage = `${new Date().toISOString()} | ${req.method} ${req.path} | Status: ${res.statusCode} | ${duration}ms`;

      if (res.statusCode >= 400) {
        console.error(logMessage);
      } else {
        console.log(logMessage);
      }
    });

    next();
  }
}
