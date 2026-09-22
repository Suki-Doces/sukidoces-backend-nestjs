import { NestFactory } from '@nestjs/core';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { initSentry } from './config/sentry';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  initSentry(configService.get<string>('SENTRY_DSN'));

  app.use(helmet());

  const origensEnv = configService.get<string>('ALLOWED_ORIGINS');
  const origensPermitidas = origensEnv
    ? origensEnv.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:4200', 'http://localhost:3000', 'https://sukidoces.vercel.app'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origensPermitidas.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Acesso bloqueado pela política de CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('suki-doces', {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: '/health', method: RequestMethod.GET },
      { path: '/metrics', method: RequestMethod.GET },
    ],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Suki Doces API')
    .setDescription('API REST da loja Suki Doces — catálogo, carrinho, pedidos e painel admin.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  const PORT = configService.get<number>('PORT') || 3000;
  await app.listen(PORT);
  logger.log(`Servidor da loja rodando na porta ${PORT}`);
  logger.log(`Documentação da API disponível em http://localhost:${PORT}/docs`);
}

bootstrap();
