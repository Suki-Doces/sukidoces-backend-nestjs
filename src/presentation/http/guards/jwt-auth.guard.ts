import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InvalidTokenError, UnauthorizedError } from '@application/errors';
import { TokenService } from '@application/ports';
import { UserRole } from '@domain/enums';
import { UserRepository } from '@domain/repositories';
import { RequestWithUser } from '@presentation/http/support';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly users: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const header = request.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid token');
    }

    const token = header.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Missing or invalid token');
    }

    const claims = await this.tokens.verifyAccessToken(token);

    // A refresh token must never be accepted as an access token.
    if (claims.type && claims.type !== 'access') {
      throw new InvalidTokenError();
    }

    if (claims.role !== UserRole.ADMIN) {
      const user = await this.users.findById(claims.id);
      if (!user?.emailVerified) {
        throw new UnauthorizedError('Email address is not verified');
      }
    }

    request.user = claims;
    return true;
  }
}
