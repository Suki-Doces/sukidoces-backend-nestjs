import { Injectable } from '@nestjs/common';
import { UnauthorizedError } from '../../errors/application-errors';
import { RefreshTokenStore, TokenClaims, TokenService } from '../../ports';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly tokens: TokenService,
    private readonly refreshTokens: RefreshTokenStore,
  ) {}

  async execute(refreshToken: string, currentUser: TokenClaims): Promise<void> {
    let claims: TokenClaims;
    try {
      claims = await this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (
      claims.type !== 'refresh' ||
      claims.id !== currentUser.id ||
      claims.role !== currentUser.role
    ) {
      throw new UnauthorizedError('Refresh token does not belong to the authenticated user');
    }

    await this.refreshTokens.consume(refreshToken);
  }
}
