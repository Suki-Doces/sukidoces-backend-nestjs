import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TokenClaims } from '@application/ports';
import { RequestWithUser } from '@presentation/http/support';

/** Injects the authenticated user's token claims (or a single claim, e.g. @CurrentUser('id')). */
export const CurrentUser = createParamDecorator(
  (claim: keyof TokenClaims | undefined, context: ExecutionContext) => {
    const user = context.switchToHttp().getRequest<RequestWithUser>().user;
    return claim ? user?.[claim] : user;
  },
);
