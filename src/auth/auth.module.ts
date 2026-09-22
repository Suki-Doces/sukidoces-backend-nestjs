import { Module } from '@nestjs/common';
import { JwtConfigModule } from '../common/jwt/jwt-config.module';
import { AuthService } from './auth.service';

@Module({
  imports: [JwtConfigModule],
  providers: [AuthService],
  exports: [AuthService, JwtConfigModule],
})
export class AuthModule {}
