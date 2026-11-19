import { Injectable } from '@nestjs/common';
import { UserRole } from '@domain/enums';
import { UserRepository } from '@domain/repositories';
import { UnauthorizedError } from '@application/errors';
import { RefreshTokenStore, TokenClaims, TokenPair, TokenService } from '@application/ports';
import { registerRefreshSession } from './register-refresh-session';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly tokens: TokenService,
    private readonly refreshTokens: RefreshTokenStore,
    private readonly users: UserRepository,
  ) {}

  async execute(refreshToken: string): Promise<TokenPair> {
    let claims: TokenClaims;
    try {
      claims = await this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (claims.type !== 'refresh') {
      throw new UnauthorizedError('Provided token is not a refresh token');
    }

    if (claims.role !== UserRole.ADMIN) {
      const user = await this.users.findById(claims.id);
      if (!user?.emailVerified) {
        throw new UnauthorizedError('Email address is not verified');
      }
    }

    if (!(await this.refreshTokens.consume(refreshToken))) {
      throw new UnauthorizedError('Refresh token has already been used or revoked');
    }

    const payload = { id: claims.id, email: claims.email, role: claims.role };
    const pair = await this.tokens.issuePair(payload);
    await registerRefreshSession(this.tokens, this.refreshTokens, pair, payload);
    return pair;
  }
}
