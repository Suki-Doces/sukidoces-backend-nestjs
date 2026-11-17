import { DomainError } from './domain-error';

export class CancellationWindowExpiredError extends DomainError {
  constructor(hoursSincePurchase: number) {
    super(
      `The 2-hour cancellation window has expired (${hoursSincePurchase.toFixed(1)}h after purchase). Please contact support.`,
    );
  }
}
