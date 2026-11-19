import { Module } from '@nestjs/common';
import {
  CreateWebhookUseCase,
  DeleteWebhookUseCase,
  ListWebhooksUseCase,
} from '@application/use-cases/webhooks';

import { WebhooksController } from '@presentation/http/controllers';
import { FeatureFlagsModule } from './feature-flags.module';

@Module({
  imports: [FeatureFlagsModule],
  controllers: [WebhooksController],
  providers: [ListWebhooksUseCase, CreateWebhookUseCase, DeleteWebhookUseCase],
})
export class WebhooksModule {}
