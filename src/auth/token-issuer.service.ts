import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { REFRESH_JWT_SERVICE } from '../common/jwt/jwt-config.module';

// Compartilhado por RegisterUseCase, LoginUseCase e RefreshTokenUseCase —
// extraído para não duplicar a emissão do par access+refresh.
@Injectable()
export class TokenIssuerService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(REFRESH_JWT_SERVICE) private readonly refreshJwtService: JwtService,
  ) {}

  async issueTokenPair(payload: { id: number; email: string; role: string }) {
    const accessToken = await this.jwtService.signAsync({ ...payload, type: 'access' });
    const refreshToken = await this.refreshJwtService.signAsync({ ...payload, type: 'refresh' });
    return { token: accessToken, accessToken, refreshToken };
  }
}
