/*
 * Development server with an in-memory database (SQL.js) - no MySQL needed.
 *
 *   npm run start:memory
 *
 * Runs the real AppModule (same routes, guards, validation and events as production) with the
 * persistence swapped for the in-memory database used by the integration tests, plus sample data.
 * Meant for running the Angular website and the Expo app against one local API and watching a
 * purchase made in one client show up in the other. Everything is lost when the process stops.
 *
 * Sample logins: admin@sukidoces.com / senha123 (admin)  -  cliente@sukidoces.com / senha123
 */
import 'dotenv/config';
import 'reflect-metadata';

const defaults: Record<string, string> = {
  NODE_ENV: 'development',
  PORT: '3000',
  DATABASE_URL: 'mysql://memory:memory@localhost:3306/memory', // unused: replaced by SQL.js
  JWT_SECRET: 'memory-mode-access-secret-change-me',
  JWT_REFRESH_SECRET: 'memory-mode-refresh-secret-change-me',
  CLOUDINARY_CLOUD_NAME: 'memory',
  CLOUDINARY_API_KEY: 'memory',
  CLOUDINARY_API_SECRET: 'memory',
  EMAIL_VERIFICATION_REQUIRED: 'false',
  ALLOWED_ORIGINS:
    'http://localhost:4200,http://localhost:8081,http://localhost:19006,http://127.0.0.1:4200,http://127.0.0.1:8081',
  BCRYPT_SALT_ROUNDS: '10',
};
for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) process.env[key] = value;
}

async function main() {
  // Imported after the defaults so the Joi env validation sees them.
  const { Test } = await import('@nestjs/testing');
  const { Logger } = await import('@nestjs/common');
  const { ConfigService } = await import('@nestjs/config');
  const bcrypt = await import('bcrypt');
  const { DataSource } = await import('typeorm');
  const { AppModule } = await import('../src/app.module');
  const { applyCors, applyHttpConventions } = await import('../src/app.setup');
  const { ImageStorage } = await import('@application/ports');
  const { DatabaseModule } = await import('@infrastructure/persistence');
  const schemas = await import('@infrastructure/persistence/schemas');
  const { TestDatabaseModule } = await import('../test/test-database.module');

  const logger = new Logger('MemoryMode');
  const cloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME !== 'memory';

  let builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideModule(DatabaseModule)
    .useModule(TestDatabaseModule);
  if (!cloudinaryConfigured) {
    // Without Cloudinary credentials uploads are skipped (products keep the default image).
    builder = builder.overrideProvider(ImageStorage).useValue({ upload: async () => null });
  }
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication();
  const config = app.get(ConfigService);
  applyCors(app, config.get<string>('ALLOWED_ORIGINS'));
  applyHttpConventions(app);
  await app.init();

  const dataSource = app.get(DataSource);
  const hash = await bcrypt.hash('senha123', 10);

  await dataSource
    .getRepository(schemas.AdminSchema)
    .save({ name: 'Suki Doces Admin', email: 'admin@sukidoces.com', password: hash });
  await dataSource.getRepository(schemas.UserSchema).save({
    name: 'Cliente Demo',
    email: 'cliente@sukidoces.com',
    password: hash,
    phone: '11999999999',
    role: 'cliente',
    active: true,
    emailVerified: true,
  });

  const categories = dataSource.getRepository(schemas.CategorySchema);
  const sweets = await categories.save({ name: 'Doces', description: 'Docinhos artesanais' });
  const cakes = await categories.save({ name: 'Bolos', description: 'Bolos caseiros' });
  const iceCream = await categories.save({ name: 'Sorvetes', description: 'Sorvetes e picolés' });

  await dataSource.getRepository(schemas.ProductSchema).save([
    {
      name: 'Brigadeiro Gourmet',
      description: 'Brigadeiro belga',
      price: 4.5,
      quantity: 100,
      active: true,
      categoryId: sweets.id,
    },
    {
      name: 'Beijinho',
      description: 'Coco fresco',
      price: 4,
      quantity: 80,
      active: true,
      categoryId: sweets.id,
    },
    {
      name: 'Bolo de Chocolate',
      description: 'Cobertura de brigadeiro',
      price: 45.9,
      quantity: 10,
      active: true,
      categoryId: cakes.id,
    },
    {
      name: 'Bolo de Cenoura',
      description: 'Com calda de chocolate',
      price: 39.9,
      quantity: 8,
      active: true,
      categoryId: cakes.id,
    },
    {
      name: 'Sorvete de Morango',
      description: 'Pote 500 ml',
      price: 22,
      quantity: 25,
      active: true,
      categoryId: iceCream.id,
    },
  ]);
  await dataSource
    .getRepository(schemas.CouponSchema)
    .save({ code: 'SUKI10', type: 'percentual', value: 10, active: true });

  const port = Number(config.get('PORT')) || 3000;
  await app.listen(port);
  logger.log(`API (in-memory database) on http://localhost:${port}/suki-doces`);
  logger.log(
    'Logins: admin@sukidoces.com / senha123  -  cliente@sukidoces.com / senha123  -  coupon SUKI10',
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
