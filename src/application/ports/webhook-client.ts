import { DomainEvent } from '../../domain/events/domain-events';

export interface WebhookDelivery {
  event: DomainEvent;
  dispatchedAt: Date;
}

export abstract class WebhookClient {
  /** Best-effort delivery: implementations must not throw. */
  abstract post(url: string, delivery: WebhookDelivery): Promise<void>;
}
