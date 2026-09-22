import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RequestWithUsuario } from '../types/request-with-user.type';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUsuario>();
    const usuario = req.usuario;

    const isAdmin = usuario && usuario.role === UserRole.ADMIN;

    if (!isAdmin) {
      throw new ForbiddenException(
        'Acesso negado: você não possui permissões de administrador.',
      );
    }
    return true;
  }
}
