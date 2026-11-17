import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { envValidationSchema } from './infrastructure/config/env.validation';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { DatabaseModule } from './infrastructure/persistence/database.module';
import { AppController } from './presentation/http/controllers/app.controller';
import { AllExceptionsFilter } from './presentation/http/filters/all-exceptions.filter';
import { LoggerMiddleware } from './presentation/http/middleware/logger.middleware';
import { MetricsMiddleware } from './presentation/http/middleware/metrics.middleware';
import { AdminModule } from './presentation/http/modules/admin.module';
import { CartModule } from './presentation/http/modules/cart.module';
import { CatalogModule } from './presentation/http/modules/catalog.module';
import { ChatModule } from './presentation/http/modules/chat.module';
import { ContactsModule } from './presentation/http/modules/contacts.module';
import { CustomersModule } from './presentation/http/modules/customers.module';
import { FeatureFlagsModule } from './presentation/http/modules/feature-flags.module';
import { HealthModule } from './presentation/http/modules/health.module';
import { MetricsModule } from './presentation/http/modules/metrics.module';
import { NotificationsModule } from './presentation/http/modules/notifications.module';
import { OrdersModule } from './presentation/http/modules/orders.module';
import { UsersModule } from './presentation/http/modules/users.module';
import { WebhooksModule } from './presentation/http/modules/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema, validationOptions: { abortEarly: false } }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        { name: 'default', ttl: config.get<number>('THROTTLE_TTL_MS') ?? 60_000, limit: config.get<number>('THROTTLE_LIMIT') ?? 100 },
      ],
    }),

    // Outer layers: persistence/adapters (infrastructure) and HTTP feature modules (presentation).
    DatabaseModule,
    InfrastructureModule,
    UsersModule,
    AdminModule,
    CatalogModule,
    CartModule,
    OrdersModule,
    CustomersModule,
    NotificationsModule,
    ContactsModule,
    ChatModule,
    FeatureFlagsModule,
    WebhooksModule,
    HealthModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware, MetricsMiddleware).forRoutes('*');
  }
}
