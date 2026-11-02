import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { IUsuarioRepository, USUARIO_REPOSITORY } from '../../common/repositories/interfaces/usuario-repository.interface';
import { EmailService } from '../../email/email.service';
import { TokenIssuerService } from '../token-issuer.service';
import { RegisterDto } from '../dto/register.dto';
import { ADMIN_NOTIFICATION_EVENTS, UsuarioRegistradoEvent } from '../../notifications/admin-notification.events';
import { buildSuccessResponse } from '../../common/responses/api-response';

@Injectable()
export class RegisterUseCase {
  private readonly saltRounds: number;

  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: IUsuarioRepository,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly tokenIssuer: TokenIssuerService,
  ) {
    this.saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS')) || 12;
  }

  async execute(dto: RegisterDto) {
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

    this.eventEmitter.emit(ADMIN_NOTIFICATION_EVENTS.USUARIO_REGISTRADO, new UsuarioRegistradoEvent(user.nome));

    const verificationToken = await this.jwtService.signAsync(
      { id: user.id_usuario, type: 'email-verification' },
      { expiresIn: '24h' },
    );
    void this.emailService.sendVerificationEmail(user.email, verificationToken);

    const tokens = await this.tokenIssuer.issueTokenPair({
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
}
