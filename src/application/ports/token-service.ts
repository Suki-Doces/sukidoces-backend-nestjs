export interface TokenPayload {
  id: number;
  email: string;
  role: string | null;
}

export interface TokenClaims extends TokenPayload {
  type?: string;
  exp?: number;
}

export interface TokenPair {
  /** Kept for compatibility: same value as accessToken. */
  token: string;
  accessToken: string;
  refreshToken: string;
}

export abstract class TokenService {
  abstract issuePair(payload: TokenPayload): Promise<TokenPair>;
  /** Throws TokenExpiredError or InvalidTokenError. */
  abstract verifyAccessToken(token: string): Promise<TokenClaims>;
  abstract verifyRefreshToken(token: string): Promise<TokenClaims>;
  abstract signEmailVerificationToken(userId: number): Promise<string>;
  abstract verifyEmailVerificationToken(token: string): Promise<{ id: number; type?: string }>;
}
