import * as bcrypt from 'bcrypt';
import AppDataSource from './data-source';
import { AdminSchema, CategorySchema, FeatureFlagSchema, ProductSchema } from './schemas/schemas';

async function seed() {
  await AppDataSource.initialize();

  const admins = AppDataSource.getRepository(AdminSchema);
  const categories = AppDataSource.getRepository(CategorySchema);
  const products = AppDataSource.getRepository(ProductSchema);
  const flags = AppDataSource.getRepository(FeatureFlagSchema);

  const passwordHash = await bcrypt.hash('senha123', 12);

  let admin = await admins.findOne({ where: { email: 'admin@sukidoces.com' } });
  if (!admin) {
    admin = await admins.save(admins.create({ name: 'Suki Doces Admin', email: 'admin@sukidoces.com', password: passwordHash }));
  }
  console.log('Admin seeded:', admin.email);

  const findOrCreateCategory = async (name: string, description: string) =>
    (await categories.findOne({ where: { name } })) ?? categories.save(categories.create({ name, description }));

  const cakes = await findOrCreateCategory('Bolos', 'Artisan cakes');
  const sweets = await findOrCreateCategory('Doces', 'Assorted sweets');

  if (!(await products.findOne({ where: { name: 'Bolo de Chocolate' } }))) {
    await products.save(
      products.create({
        name: 'Bolo de Chocolate',
        description: 'Chocolate cake with brigadeiro frosting',
        price: 45.9,
        quantity: 10,
        active: true,
        categoryId: cakes.id,
      }),
    );
    await products.save(
      products.create({
        name: 'Brigadeiro Gourmet (unidade)',
        description: 'Artisan brigadeiro',
        price: 4.5,
        quantity: 100,
        active: true,
        categoryId: sweets.id,
      }),
    );
  }

  await flags.upsert({ key: 'webhooks', enabled: false } as any, ['key']);

  console.log('Seed completed.');
  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
