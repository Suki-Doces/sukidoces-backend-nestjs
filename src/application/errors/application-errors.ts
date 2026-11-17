/**
 * Errors raised by use cases. They carry no HTTP knowledge: the presentation
 * layer maps each class to a status code.
 */
export abstract class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BadRequestError extends ApplicationError {}
export class NotFoundError extends ApplicationError {}
export class UnauthorizedError extends ApplicationError {}
export class ForbiddenError extends ApplicationError {}
export class InternalError extends ApplicationError {}

export class TokenExpiredError extends UnauthorizedError {
  constructor() {
    super('Token expired');
  }
}

export class InvalidTokenError extends UnauthorizedError {
  constructor() {
    super('Invalid token');
  }
}
