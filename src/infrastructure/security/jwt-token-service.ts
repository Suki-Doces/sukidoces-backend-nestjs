import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { InvalidTokenError, TokenExpiredError } from '../../application/errors/application-errors';
import { TokenClaims, TokenPair, TokenPayload, TokenService } from '../../application/ports/token-service';

/**
 * Access and refresh tokens use different secrets: leaking the access secret
 * does not let an attacker mint new refresh tokens.
 */
@Injectable()
export class JwtTokenService extends TokenService {
  private readonly accessJwt: JwtService;
  private readonly refreshJwt: JwtService;

  constructor(config: ConfigService) {
    super();
    this.accessJwt = new JwtService({
      secret: config.get<string>('JWT_SECRET'),
      signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m' },
    });
    this.refreshJwt = new JwtService({
      secret: config.get<string>('JWT_REFRESH_SECRET'),
      signOptions: { expiresIn: config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d' },
    });
  }

  async issuePair(payload: TokenPayload): Promise<TokenPair> {
    const accessToken = await this.accessJwt.signAsync({ ...payload, type: 'access' });
    const refreshToken = await this.refreshJwt.signAsync({ ...payload, type: 'refresh', jti: randomUUID() });
    return { token: accessToken, accessToken, refreshToken };
  }

  verifyAccessToken(token: string): Promise<TokenClaims> {
    return this.verify(this.accessJwt, token);
  }

  verifyRefreshToken(token: string): Promise<TokenClaims> {
    return this.verify(this.refreshJwt, token);
  }

  signEmailVerificationToken(userId: number): Promise<string> {
    return this.accessJwt.signAsync({ id: userId, type: 'email-verification' }, { expiresIn: '24h' });
  }

  verifyEmailVerificationToken(token: string): Promise<{ id: number; type?: string }> {
    return this.accessJwt.verifyAsync(token);
  }

  private async verify(jwt: JwtService, token: string): Promise<TokenClaims> {
    try {
      return await jwt.verifyAsync<TokenClaims>(token);
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') throw new TokenExpiredError();
      if (error?.name === 'JsonWebTokenError' || error?.name === 'NotBeforeError') throw new InvalidTokenError();
      throw error;
    }
  }
}
