import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { allSchemas } from './schemas/schemas';

// synchronize is always false: schema changes go through explicit migrations.
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        url: config.get<string>('DATABASE_URL'),
        entities: allSchemas,
        synchronize: false,
        maxQueryExecutionTime: 200,
        logger: 'advanced-console',
      }),
    }),
  ],
})
export class DatabaseModule {}
