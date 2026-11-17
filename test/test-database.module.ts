import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { allSchemas } from '../src/infrastructure/persistence/schemas/schemas';

/**
 * Uses in-memory SQLite for local integration runs, or the migrated MySQL
 * database when TEST_DATABASE_URL is set (as in CI).
 */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.TEST_DATABASE_URL ? 'mysql' : 'better-sqlite3',
      ...(process.env.TEST_DATABASE_URL
        ? { url: process.env.TEST_DATABASE_URL, synchronize: false, dropSchema: false }
        : { database: ':memory:', synchronize: true, dropSchema: true }),
      entities: allSchemas,
      logging: false,
    }),
  ],
})
export class TestDatabaseModule {}
