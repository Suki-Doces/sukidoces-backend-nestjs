import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { IUsuarioRepository, USUARIO_REPOSITORY } from '../common/repositories/interfaces/usuario-repository.interface';
import { IAdministradorRepository, ADMINISTRADOR_REPOSITORY } from '../common/repositories/interfaces/administrador-repository.interface';
import { REFRESH_JWT_SERVICE } from '../common/jwt/jwt-config.module';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  ADMIN_NOTIFICATION_EVENTS,
  UsuarioRegistradoEvent,
} from '../notifications/admin-notification.events';
import { buildSuccessResponse } from '../common/responses/api-response';
import { UserRole } from '../common/enums/user-role.enum';
import { UsuarioPayload } from '../common/types/request-with-user.type';

@Injectable()
export class AuthService {
  private readonly saltRounds: number;

  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: IUsuarioRepository,
    @Inject(ADMINISTRADOR_REPOSITORY) private readonly administradorRepository: IAdministradorRepository,
    private readonly jwtService: JwtService,
    @Inject(REFRESH_JWT_SERVICE) private readonly refreshJwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS')) || 12;
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.usuarioRepository.findByEmail(email);
    if (existing) {
      throw new BadRequestException('E-mail já cadastrado');
    }

    const hashedSenha = await bcrypt.hash(dto.senha, this.saltRounds);

    const user = await this.usuarioRepository.create({
      nome: dto.nome.trim(),
      email,
      senha: hashedSenha,
      telefone: dto.telefone,
    });

    this.eventEmitter.emit(
      ADMIN_NOTIFICATION_EVENTS.USUARIO_REGISTRADO,
      new UsuarioRegistradoEvent(user.nome),
    );

    const verificationToken = await this.jwtService.signAsync(
      { id: user.id_usuario, type: 'email-verification' },
      { expiresIn: '24h' },
    );
    void this.emailService.sendVerificationEmail(user.email, verificationToken);

    const tokens = await this.issueTokenPair({
      id: user.id_usuario,
      email: user.email,
      role: user.role,
    });

    return buildSuccessResponse('Usuário criado com sucesso', {
      ...tokens,
      user: {
        id: user.id_usuario,
        nome: user.nome,
        email: user.email,
        nivel: user.role,
        data_criacao: user.data_criacao,
        foto_perfil: user.foto_perfil,
      },
    });
  }

  async login(dto: LoginDto) {
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

  async verifyEmail(token: string) {
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

  async refresh(dto: RefreshTokenDto) {
    let payload: UsuarioPayload;
    try {
      payload = await this.refreshJwtService.verifyAsync<UsuarioPayload>(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token fornecido não é um refresh token');
    }

    const tokens = await this.issueTokenPair({
      id: payload.id,
      email: payload.email,
      role: payload.role,
    });

    return buildSuccessResponse('Token renovado com sucesso', tokens);
  }

  private async issueTokenPair(payload: { id: number; email: string; role: string }) {
    const accessToken = await this.jwtService.signAsync({ ...payload, type: 'access' });
    const refreshToken = await this.refreshJwtService.signAsync({ ...payload, type: 'refresh' });
    return { token: accessToken, accessToken, refreshToken };
  }

  private async loginComoUsuario(user: any, senha: string) {
    let match = false;
    try {
      match = await bcrypt.compare(senha, user.senha);
    } catch {
      match = false;
    }

    if (!match && user.senha === senha) {
      match = true;
      const hashedSenha = await bcrypt.hash(senha, this.saltRounds);
      await this.usuarioRepository.updateSenha(user.id_usuario, hashedSenha);
    }

    if (!match) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.issueTokenPair({
      id: user.id_usuario,
      email: user.email,
      role: user.role,
    });

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
    let match = false;
    try {
      match = await bcrypt.compare(senha, admin.senha);
    } catch {
      match = false;
    }

    if (!match && admin.senha === senha) {
      match = true;
      const hashedSenha = await bcrypt.hash(senha, this.saltRounds);
      await this.administradorRepository.updateSenha(admin.id_admin, hashedSenha);
    }

    if (!match) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.issueTokenPair({
      id: admin.id_admin,
      email: admin.email,
      role: UserRole.ADMIN,
    });

    return buildSuccessResponse('Login de Administrador bem-sucedido', {
      ...tokens,
      user: {
        id: admin.id_admin,
        nome: admin.nome,
        email: admin.email,
        nivel: UserRole.ADMIN,
      },
    });
  }
}
