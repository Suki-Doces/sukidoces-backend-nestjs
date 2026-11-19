import { OrderStatus } from '@domain/enums';
import { DomainError } from './domain-error';

export class OrderCannotBeCancelledError extends DomainError {
  constructor(status: string) {
    const messages: Record<string, string> = {
      [OrderStatus.CANCELLED]: 'This order has already been cancelled',
      [OrderStatus.DELIVERED]: 'Delivered orders cannot be cancelled',
    };
    super(messages[status] || `An order with status "${status}" cannot be cancelled`);
  }
}
