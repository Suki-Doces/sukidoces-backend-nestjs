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
} from '@application/ports';
import { NotifyAdminUseCase } from '@application/use-cases/notifications';
import { DispatchWebhooksUseCase } from '@application/use-cases/webhooks';
import { CacheManagerStore } from '@infrastructure/cache';
import {
  CloudinaryImageStorage,
  FetchWebhookClient,
  GeminiChatAssistant,
  SmtpEmailSender,
} from '@infrastructure/external';

import { DatabaseHealthProbe, MemoryHealthProbe } from '@infrastructure/health';

import {
  AdminNotificationHandler,
  EventEmitterPublisher,
  WebhookDispatchHandler,
} from '@infrastructure/messaging';

import {
  NestAppLogger,
  PrometheusMetrics,
  SentryErrorReporter,
} from '@infrastructure/observability';

import { PersistenceModule } from '@infrastructure/persistence';
import {
  BcryptPasswordHasher,
  JwtTokenService,
  Sha256RequestHasher,
} from '@infrastructure/security';

/**
 * Composition root of the outer layer: every application port is bound here
 * to its concrete adapter. Swapping an adapter (another e-mail provider, Redis
 * cache, ...) is a one-line change in this file.
 */
@Global()
@Module({
  imports: [
    PersistenceModule,
    CacheModule.register({ isGlobal: true, ttl: 5 * 60 * 1000, max: 100 }),
  ],
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
