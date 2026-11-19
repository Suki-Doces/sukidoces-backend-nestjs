import 'dotenv/config';
import { DataSource } from 'typeorm';
import { allSchemas } from '@infrastructure/persistence/schemas';

// Used by the TypeORM CLI (migrations), which runs outside the Nest container.
const AppDataSource = new DataSource({
  type: 'mysql',
  url: process.env.DATABASE_URL,
  entities: allSchemas,
  migrations: ['src/infrastructure/persistence/migrations/*.ts'],
  synchronize: false,
});

export default AppDataSource;
