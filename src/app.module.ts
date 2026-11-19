import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { envValidationSchema } from '@infrastructure/config';
import { InfrastructureModule } from '@infrastructure';
import { DatabaseModule } from '@infrastructure/persistence';
import { AppController } from '@presentation/http/controllers';
import { AllExceptionsFilter } from '@presentation/http/filters';
import { LoggerMiddleware, MetricsMiddleware } from '@presentation/http/middleware';

import {
  AdminModule,
  CartModule,
  CatalogModule,
  ChatModule,
  ContactsModule,
  CustomersModule,
  FeatureFlagsModule,
  HealthModule,
  MetricsModule,
  NotificationsModule,
  OrdersModule,
  UsersModule,
  WebhooksModule,
} from '@presentation/http/modules';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get<number>('THROTTLE_TTL_MS') ?? 60_000,
          limit: config.get<number>('THROTTLE_LIMIT') ?? 100,
        },
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
    consumer
      .apply(LoggerMiddleware, MetricsMiddleware)
      .forRoutes({ path: '/{*splat}', method: RequestMethod.ALL });
  }
}
