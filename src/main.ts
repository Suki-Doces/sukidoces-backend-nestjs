import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { applyCors, applyHttpConventions } from './app.setup';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const trustProxy = parseTrustProxy(config.get<string>('TRUST_PROXY'));
  app.getHttpAdapter().getInstance().set('trust proxy', trustProxy);

  app.use(helmet());

  applyCors(app, config.get<string>('ALLOWED_ORIGINS'));
  applyHttpConventions(app);

  const swagger = new DocumentBuilder()
    .setTitle('Suki Doces API')
    .setDescription('Suki Doces store REST API: catalog, cart, orders and admin panel.')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = config.get<number>('PORT') || 3000;
  await app.listen(port);
  logger.log(`Server running on port ${port}`);
  logger.log(`API docs available at http://localhost:${port}/docs`);
}

bootstrap();

function parseTrustProxy(value?: string): boolean | number | string[] {
  const setting = value?.trim();
  if (!setting) return false;
  if (setting === 'true') return true;
  if (setting === 'false') return false;
  if (/^\d+$/.test(setting)) return Number(setting);
  return setting.split(',').map((entry) => entry.trim()).filter(Boolean);
}
