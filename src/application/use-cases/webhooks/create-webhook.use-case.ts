import { Injectable } from '@nestjs/common';
import { Webhook } from '@domain/entities';
import { WebhookRepository } from '@domain/repositories';

@Injectable()
export class CreateWebhookUseCase {
  constructor(private readonly webhooks: WebhookRepository) {}

  execute(input: { url: string; events: string[] }): Promise<Webhook> {
    return this.webhooks.create({ url: input.url, events: input.events.join(',') });
  }
}
