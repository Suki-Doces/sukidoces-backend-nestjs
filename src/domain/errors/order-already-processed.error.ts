import { DomainError } from './domain-error';

export class OrderAlreadyProcessedError extends DomainError {
  constructor() {
    super('Order already processed');
  }
}
