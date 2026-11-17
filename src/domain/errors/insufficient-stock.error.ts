import { DomainError } from './domain-error';

export class InsufficientStockError extends DomainError {
  constructor(productName: string, available: number) {
    super(`Insufficient stock for: ${productName}. Available: ${available}`);
  }
}
