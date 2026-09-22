import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { envValidationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AppCacheModule } from './common/cache/app-cache.module';
import { RepositoriesModule } from './common/repositories/repositories.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsMiddleware } from './metrics/metrics.middleware';
import { WebhooksModule } from './webhooks/webhooks.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ProdutosModule } from './produtos/produtos.module';
import { CarrinhoModule } from './carrinho/carrinho.module';
import { CategoriasModule } from './categorias/categorias.module';
import { ChatModule } from './chat/chat.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { AdminModule } from './admin/admin.module';
import { AdminPerfilModule } from './admin-perfil/admin-perfil.module';
import { ClientesModule } from './clientes/clientes.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { ContatoModule } from './contato/contato.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

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

    DatabaseModule,
    CloudinaryModule,
    AppCacheModule,
    RepositoriesModule,
    NotificationsModule,
    HealthModule,
    MetricsModule,
    FeatureFlagsModule,
    WebhooksModule,
    EmailModule,

    AuthModule,
    UsuarioModule,
    ProdutosModule,
    CarrinhoModule,
    CategoriasModule,
    ChatModule,
    PedidosModule,
    AdminModule,
    AdminPerfilModule,
    ClientesModule,
    NotificacoesModule,
    ContatoModule,
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
