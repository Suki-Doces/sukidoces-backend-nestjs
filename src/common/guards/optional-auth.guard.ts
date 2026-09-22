import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RequestWithUsuario, UsuarioPayload } from '../types/request-with-user.type';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUsuario>();
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        const decoded = await this.jwtService.verifyAsync<UsuarioPayload>(token);
        req.usuario = decoded;
      } catch {
        // Falha silenciosa: continua como deslogado
      }
    }
    return true;
  }
}
