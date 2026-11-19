import { Injectable } from '@nestjs/common';
import { AppLogger, WebhookClient, WebhookDelivery } from '@application/ports';

import { toWebhookBody } from './legacy-webhook-payload';

@Injectable()
export class FetchWebhookClient extends WebhookClient {
  constructor(private readonly logger: AppLogger) {
    super();
  }

  async post(url: string, delivery: WebhookDelivery): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toWebhookBody(delivery)),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        this.logger.warn(`Webhook ${url} responded with status ${response.status}`);
      }
    } catch (error) {
      this.logger.error(`Failed to call webhook ${url}`, (error as Error).message);
    }
  }
}
