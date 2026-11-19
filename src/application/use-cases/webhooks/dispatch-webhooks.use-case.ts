import { Injectable } from '@nestjs/common';
import { DomainEvent } from '@domain/events';
import { WebhookRepository } from '@domain/repositories';
import { WebhookClient } from '@application/ports';

@Injectable()
export class DispatchWebhooksUseCase {
  constructor(
    private readonly webhooks: WebhookRepository,
    private readonly client: WebhookClient,
  ) {}

  async execute(event: DomainEvent): Promise<void> {
    const subscribers = (await this.webhooks.findActive()).filter((webhook) =>
      webhook.subscribesTo(event.name),
    );
    if (subscribers.length === 0) return;

    const dispatchedAt = new Date();
    await Promise.all(
      subscribers.map((webhook) => this.client.post(webhook.url, { event, dispatchedAt })),
    );
  }
}
