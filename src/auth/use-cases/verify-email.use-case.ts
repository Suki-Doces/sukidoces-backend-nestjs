import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUsuarioRepository, USUARIO_REPOSITORY } from '../../common/repositories/interfaces/usuario-repository.interface';
import { buildSuccessResponse } from '../../common/responses/api-response';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(token: string) {
    let payload: { id: number; type?: string };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Link de verificação inválido ou expirado');
    }

    if (payload.type !== 'email-verification') {
      throw new UnauthorizedException('Token fornecido não é um token de verificação de e-mail');
    }

    await this.usuarioRepository.marcarEmailVerificado(payload.id);
    return buildSuccessResponse('E-mail verificado com sucesso');
  }
}
