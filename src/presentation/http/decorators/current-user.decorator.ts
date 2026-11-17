import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from '../support/request-with-user';

/** Injects the authenticated user's token claims (or a single claim, e.g. @CurrentUser('id')). */
export const CurrentUser = createParamDecorator((claim: string | undefined, context: ExecutionContext) => {
  const user = context.switchToHttp().getRequest<RequestWithUser>().user;
  return claim ? user?.[claim] : user;
});
