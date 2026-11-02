import { Module } from '@nestjs/common';
import { JwtConfigModule } from '../common/jwt/jwt-config.module';
import { TokenIssuerService } from './token-issuer.service';
import { RegisterUseCase } from './use-cases/register.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { VerifyEmailUseCase } from './use-cases/verify-email.use-case';

// O antigo AuthService foi substituído por 4 Use Cases (um por ação de
// negócio) + TokenIssuerService (emissão do par de tokens, compartilhada).
@Module({
  imports: [JwtConfigModule],
  providers: [TokenIssuerService, RegisterUseCase, LoginUseCase, RefreshTokenUseCase, VerifyEmailUseCase],
  exports: [RegisterUseCase, LoginUseCase, RefreshTokenUseCase, VerifyEmailUseCase, JwtConfigModule],
})
export class AuthModule {}
