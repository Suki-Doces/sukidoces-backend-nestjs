import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';

export function applyCors(app: INestApplication, configuredOrigins?: string): void {
  const allowedOrigins = configuredOrigins
    ? configuredOrigins.split(',').map((origin) => origin.trim()).filter(Boolean)
    : ['http://localhost:4200', 'http://localhost:3000', 'https://sukidoces.vercel.app'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Blocked by CORS policy'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  });
}

/**
 * HTTP conventions shared by the real server (main.ts) and the integration tests,
 * so both always run with the same prefix and validation rules.
 */
export function applyHttpConventions(app: INestApplication): void {
  // Health and metrics live outside the API prefix so infrastructure can reach them directly.
  app.setGlobalPrefix('suki-doces', {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/(.*)', method: RequestMethod.GET },
      { path: 'metrics', method: RequestMethod.GET },
    ],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
