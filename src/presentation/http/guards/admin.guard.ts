import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../application/errors/application-errors';
import { UserRole } from '../../../domain/enums';
import { RequestWithUser } from '../support/request-with-user';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<RequestWithUser>().user;
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Access denied: you do not have administrator permissions.');
    }
    return true;
  }
}
