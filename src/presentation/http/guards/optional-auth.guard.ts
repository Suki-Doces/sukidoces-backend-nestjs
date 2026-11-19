import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TokenService } from '@application/ports';
import { RequestWithUser } from '@presentation/http/support';

/** Authenticates when a valid token is present; otherwise the request continues as anonymous. */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = request.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        request.user = await this.tokens.verifyAccessToken(token);
      } catch {
        // Invalid token: treat as anonymous.
      }
    }
    return true;
  }
}
