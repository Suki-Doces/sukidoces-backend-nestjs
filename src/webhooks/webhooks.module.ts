import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookEntity } from '../database/entities/webhook.entity';
import { JwtConfigModule } from '../common/jwt/jwt-config.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookDispatcherListener } from './webhook-dispatcher.listener';

@Module({
  imports: [JwtConfigModule, TypeOrmModule.forFeature([WebhookEntity])],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookDispatcherListener],
})
export class WebhooksModule {}
