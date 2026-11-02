import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { IUsuarioRepository, USUARIO_REPOSITORY } from '../../common/repositories/interfaces/usuario-repository.interface';
import { IAdministradorRepository, ADMINISTRADOR_REPOSITORY } from '../../common/repositories/interfaces/administrador-repository.interface';
import { TokenIssuerService } from '../token-issuer.service';
import { LoginDto } from '../dto/login.dto';
import { buildSuccessResponse } from '../../common/responses/api-response';
import { UserRole } from '../../common/enums/user-role.enum';

// Login unificado: tenta primeiro a tabela de usuários (clientes), depois a
// de administradores — mesma regra usada por POST /usuario/login e
// POST /admin/login.
@Injectable()
export class LoginUseCase {
  private readonly saltRounds: number;

  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: IUsuarioRepository,
    @Inject(ADMINISTRADOR_REPOSITORY) private readonly administradorRepository: IAdministradorRepository,
    private readonly configService: ConfigService,
    private readonly tokenIssuer: TokenIssuerService,
  ) {
    this.saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS')) || 12;
  }

  async execute(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.usuarioRepository.findByEmail(email);
    if (user) {
      return this.loginComoUsuario(user, dto.senha);
    }

    const admin = await this.administradorRepository.findByEmail(email);
    if (admin) {
      return this.loginComoAdmin(admin, dto.senha);
    }

    throw new UnauthorizedException('Credenciais inválidas');
  }

  private async senhaConfere(senhaDigitada: string, senhaArmazenada: string): Promise<{ confere: boolean; precisaRehash: boolean }> {
    let confere = false;
    try {
      confere = await bcrypt.compare(senhaDigitada, senhaArmazenada);
    } catch {
      confere = false;
    }

    // Senhas legadas em texto puro (migração silenciosa para bcrypt)
    if (!confere && senhaArmazenada === senhaDigitada) {
      return { confere: true, precisaRehash: true };
    }
    return { confere, precisaRehash: false };
  }

  private async loginComoUsuario(user: any, senha: string) {
    const { confere, precisaRehash } = await this.senhaConfere(senha, user.senha);
    if (!confere) throw new UnauthorizedException('Credenciais inválidas');

    if (precisaRehash) {
      await this.usuarioRepository.updateSenha(user.id_usuario, await bcrypt.hash(senha, this.saltRounds));
    }

    const tokens = await this.tokenIssuer.issueTokenPair({ id: user.id_usuario, email: user.email, role: user.role });

    return buildSuccessResponse('Login realizado com sucesso', {
      ...tokens,
      user: {
        id: user.id_usuario,
        nome: user.nome,
        email: user.email,
        nivel: user.role,
        foto_perfil: user.foto_perfil,
      },
    });
  }

  private async loginComoAdmin(admin: any, senha: string) {
    const { confere, precisaRehash } = await this.senhaConfere(senha, admin.senha);
    if (!confere) throw new UnauthorizedException('Credenciais inválidas');

    if (precisaRehash) {
      await this.administradorRepository.updateSenha(admin.id_admin, await bcrypt.hash(senha, this.saltRounds));
    }

    const tokens = await this.tokenIssuer.issueTokenPair({ id: admin.id_admin, email: admin.email, role: UserRole.ADMIN });

    return buildSuccessResponse('Login de Administrador bem-sucedido', {
      ...tokens,
      user: { id: admin.id_admin, nome: admin.nome, email: admin.email, nivel: UserRole.ADMIN },
    });
  }
}
