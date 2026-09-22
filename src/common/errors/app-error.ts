import { HttpException } from '@nestjs/common';

export class AppError extends HttpException {
  constructor(message: string, status = 500) {
    super(message, status);
  }
}
