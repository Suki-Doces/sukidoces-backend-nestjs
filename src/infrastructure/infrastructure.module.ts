import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import {
  AppLogger,
  CacheStore,
  ChatAssistant,
  EmailSender,
  ErrorReporter,
  EventPublisher,
  HEALTH_PROBES,
  ImageStorage,
  Metrics,
  PasswordHasher,
  RequestHasher,
  TokenService,
  WebhookClient,
} from '../application/ports';
import { NotifyAdminUseCase } from '../application/use-cases/notifications/notify-admin.use-case';
import { DispatchWebhooksUseCase } from '../application/use-cases/webhooks/dispatch-webhooks.use-case';
import { CacheManagerStore } from './cache/cache-manager-store';
import { CloudinaryImageStorage } from './external/cloudinary-image-storage';
import { FetchWebhookClient } from './external/fetch-webhook-client';
import { GeminiChatAssistant } from './external/gemini-chat-assistant';
import { SmtpEmailSender } from './external/smtp-email-sender';
import { DatabaseHealthProbe } from './health/database-health.probe';
import { MemoryHealthProbe } from './health/memory-health.probe';
import { AdminNotificationHandler } from './messaging/admin-notification.handler';
import { EventEmitterPublisher } from './messaging/event-emitter-publisher';
import { WebhookDispatchHandler } from './messaging/webhook-dispatch.handler';
import { NestAppLogger } from './observability/nest-app-logger';
import { PrometheusMetrics } from './observability/prometheus-metrics';
import { SentryErrorReporter } from './observability/sentry-error-reporter';
import { PersistenceModule } from './persistence/persistence.module';
import { BcryptPasswordHasher } from './security/bcrypt-password-hasher';
import { JwtTokenService } from './security/jwt-token-service';
import { Sha256RequestHasher } from './security/sha256-request-hasher';

/**
 * Composition root of the outer layer: every application port is bound here
 * to its concrete adapter. Swapping an adapter (another e-mail provider, Redis
 * cache, ...) is a one-line change in this file.
 */
@Global()
@Module({
  imports: [PersistenceModule, CacheModule.register({ isGlobal: true, ttl: 5 * 60 * 1000, max: 100 })],
  providers: [
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    { provide: TokenService, useClass: JwtTokenService },
    { provide: RequestHasher, useClass: Sha256RequestHasher },
    { provide: ImageStorage, useClass: CloudinaryImageStorage },
    { provide: EmailSender, useClass: SmtpEmailSender },
    { provide: ChatAssistant, useClass: GeminiChatAssistant },
    { provide: EventPublisher, useClass: EventEmitterPublisher },
    { provide: CacheStore, useClass: CacheManagerStore },
    { provide: ErrorReporter, useClass: SentryErrorReporter },
    { provide: AppLogger, useClass: NestAppLogger },
    { provide: WebhookClient, useClass: FetchWebhookClient },
    { provide: Metrics, useClass: PrometheusMetrics },
    DatabaseHealthProbe,
    MemoryHealthProbe,
    {
      provide: HEALTH_PROBES,
      useFactory: (database: DatabaseHealthProbe, memory: MemoryHealthProbe) => [database, memory],
      inject: [DatabaseHealthProbe, MemoryHealthProbe],
    },
    NotifyAdminUseCase,
    DispatchWebhooksUseCase,
    AdminNotificationHandler,
    WebhookDispatchHandler,
  ],
  exports: [
    PersistenceModule,
    PasswordHasher,
    TokenService,
    RequestHasher,
    ImageStorage,
    EmailSender,
    ChatAssistant,
    EventPublisher,
    CacheStore,
    ErrorReporter,
    AppLogger,
    WebhookClient,
    Metrics,
    HEALTH_PROBES,
  ],
})
export class InfrastructureModule {}
