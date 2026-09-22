import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        url: configService.get<string>('DATABASE_URL'),
        entities: Object.values(entities),
        synchronize: false,
        maxQueryExecutionTime: 200,
        logger: 'advanced-console',
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
