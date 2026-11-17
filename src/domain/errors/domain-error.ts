/**
 * Base class for business-rule violations. The domain never throws HTTP
 * errors: the outer layers translate a DomainError into a response.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
