import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HTTP_MESSAGES } from '../constants/http-messages.constant';
import { RequestWithUsuario, UsuarioPayload } from '../types/request-with-user.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUsuario>();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(HTTP_MESSAGES.TOKEN_MISSING);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException(HTTP_MESSAGES.TOKEN_MISSING);
    }

    if (!process.env.JWT_SECRET) {
      throw new InternalServerErrorException(HTTP_MESSAGES.INTERNAL_AUTH_ERROR);
    }

    try {
      const decoded = await this.jwtService.verifyAsync<UsuarioPayload>(token);

      if (decoded.type && decoded.type !== 'access') {
        throw new UnauthorizedException(HTTP_MESSAGES.TOKEN_INVALID);
      }

      req.usuario = decoded;
      return true;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;

      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException(HTTP_MESSAGES.TOKEN_EXPIRED);
      }
      if (error?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException(HTTP_MESSAGES.TOKEN_INVALID);
      }

      throw new InternalServerErrorException(HTTP_MESSAGES.INTERNAL_AUTH_ERROR);
    }
  }
}
