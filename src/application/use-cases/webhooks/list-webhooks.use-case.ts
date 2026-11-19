import { Injectable } from '@nestjs/common';
import { Webhook } from '@domain/entities';
import { WebhookRepository } from '@domain/repositories';

@Injectable()
export class ListWebhooksUseCase {
  constructor(private readonly webhooks: WebhookRepository) {}

  execute(): Promise<Webhook[]> {
    return this.webhooks.findAll();
  }
}
