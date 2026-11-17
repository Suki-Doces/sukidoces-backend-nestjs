import { Injectable, Logger } from '@nestjs/common';
import { AppLogger } from '../../application/ports/app-logger';

@Injectable()
export class NestAppLogger extends AppLogger {
  private readonly logger = new Logger('Application');

  log(message: string): void {
    this.logger.log(message);
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  error(message: string, trace?: unknown): void {
    this.logger.error(message, trace instanceof Error ? trace.stack : trace);
  }
}
