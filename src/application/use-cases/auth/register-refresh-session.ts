import { RefreshTokenStore, TokenPair, TokenPayload, TokenService } from '../../ports';

export async function registerRefreshSession(
  tokens: TokenService,
  sessions: RefreshTokenStore,
  pair: TokenPair,
  payload: TokenPayload,
): Promise<void> {
  const claims = await tokens.verifyRefreshToken(pair.refreshToken);
  if (!claims.exp) {
    throw new Error('Refresh token is missing its expiration claim');
  }

  await sessions.register({
    token: pair.refreshToken,
    userId: payload.id,
    role: payload.role,
    expiresAt: new Date(claims.exp * 1000),
  });
}
