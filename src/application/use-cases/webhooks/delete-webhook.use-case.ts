import { Injectable } from '@nestjs/common';
import { WebhookRepository } from '@domain/repositories';
import { NotFoundError } from '@application/errors';

@Injectable()
export class DeleteWebhookUseCase {
  constructor(private readonly webhooks: WebhookRepository) {}

  async execute(id: number): Promise<void> {
    if (!(await this.webhooks.findById(id))) {
      throw new NotFoundError('Webhook not found');
    }
    await this.webhooks.delete(id);
  }
}
