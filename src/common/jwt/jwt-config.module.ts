import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';

export const REFRESH_JWT_SERVICE = 'REFRESH_JWT_SERVICE';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m' },
      }),
    }),
  ],
  providers: [
    {
      provide: REFRESH_JWT_SERVICE,
      useFactory: (configService: ConfigService) =>
        new JwtService({
          secret: configService.get<string>('JWT_REFRESH_SECRET'),
          signOptions: {
            expiresIn: configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
          },
        }),
      inject: [ConfigService],
    },
  ],
  exports: [JwtModule, REFRESH_JWT_SERVICE],
})
export class JwtConfigModule {}
