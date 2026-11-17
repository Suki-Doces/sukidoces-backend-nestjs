import { DomainError } from './domain-error';

export class OrderNotOwnedError extends DomainError {
  constructor() {
    super('You do not have permission.');
  }
}
