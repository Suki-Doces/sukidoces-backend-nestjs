import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { REFRESH_JWT_SERVICE } from '../../common/jwt/jwt-config.module';
import { TokenIssuerService } from '../token-issuer.service';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { buildSuccessResponse } from '../../common/responses/api-response';
import { UsuarioPayload } from '../../common/types/request-with-user.type';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(REFRESH_JWT_SERVICE) private readonly refreshJwtService: JwtService,
    private readonly tokenIssuer: TokenIssuerService,
  ) {}

  async execute(dto: RefreshTokenDto) {
    let payload: UsuarioPayload;
    try {
      payload = await this.refreshJwtService.verifyAsync<UsuarioPayload>(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token fornecido não é um refresh token');
    }

    const tokens = await this.tokenIssuer.issueTokenPair({
      id: payload.id,
      email: payload.email,
      role: payload.role,
    });

    return buildSuccessResponse('Token renovado com sucesso', tokens);
  }
}
