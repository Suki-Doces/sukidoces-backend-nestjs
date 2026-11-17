import { Module } from '@nestjs/common';
import { CreateWebhookUseCase } from '../../../application/use-cases/webhooks/create-webhook.use-case';
import { DeleteWebhookUseCase } from '../../../application/use-cases/webhooks/delete-webhook.use-case';
import { ListWebhooksUseCase } from '../../../application/use-cases/webhooks/list-webhooks.use-case';
import { WebhooksController } from '../controllers/webhooks.controller';
import { FeatureFlagsModule } from './feature-flags.module';

@Module({
  imports: [FeatureFlagsModule],
  controllers: [WebhooksController],
  providers: [ListWebhooksUseCase, CreateWebhookUseCase, DeleteWebhookUseCase],
})
export class WebhooksModule {}
