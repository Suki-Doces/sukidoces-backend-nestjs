import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthService } from './auth.service';
import { USUARIO_REPOSITORY } from '../common/repositories/interfaces/usuario-repository.interface';
import { ADMINISTRADOR_REPOSITORY } from '../common/repositories/interfaces/administrador-repository.interface';
import { REFRESH_JWT_SERVICE } from '../common/jwt/jwt-config.module';
import { EmailService } from '../email/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let usuarioRepository: any;
  let administradorRepository: any;
  let jwtService: any;
  let refreshJwtService: any;
  let eventEmitter: any;
  let emailService: any;

  beforeEach(async () => {
    usuarioRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      updateSenha: jest.fn(),
    };

    administradorRepository = {
      findByEmail: jest.fn(),
      updateSenha: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('fake-access-token'),
    };

    refreshJwtService = {
      signAsync: jest.fn().mockResolvedValue('fake-refresh-token'),
      verifyAsync: jest.fn(),
    };

    eventEmitter = { emit: jest.fn() };
    emailService = { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USUARIO_REPOSITORY, useValue: usuarioRepository },
        { provide: ADMINISTRADOR_REPOSITORY, useValue: administradorRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: REFRESH_JWT_SERVICE, useValue: refreshJwtService },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: EmailService, useValue: emailService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('deve registrar um usuário com sucesso e emitir evento de notificação', async () => {
    usuarioRepository.findByEmail.mockResolvedValue(null);
    usuarioRepository.create.mockResolvedValue({
      id_usuario: 1,
      nome: 'Maria',
      email: 'maria@email.com',
      telefone: '11999999999',
      role: 'cliente',
      data_criacao: new Date(),
      foto_perfil: null,
    });

    const result = await service.register({
      nome: 'Maria',
      email: 'maria@email.com',
      senha: '123456',
      telefone: '11999999999',
    });

    expect(result.success).toBe(true);
    expect(result.data.token).toBe('fake-access-token');
    expect(result.data.refreshToken).toBe('fake-refresh-token');
    expect(result.data.user.email).toBe('maria@email.com');
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'admin-notification.usuario-registrado',
      expect.objectContaining({ nomeUsuario: 'Maria' }),
    );
  });

  it('deve rejeitar registro com e-mail já cadastrado', async () => {
    usuarioRepository.findByEmail.mockResolvedValue({ id_usuario: 1, email: 'maria@email.com' });

    await expect(
      service.register({
        nome: 'Maria',
        email: 'maria@email.com',
        senha: '123456',
        telefone: '11999999999',
      }),
    ).rejects.toThrow('E-mail já cadastrado');
  });

  it('deve rejeitar login com credenciais inválidas quando nenhum usuário/admin existe', async () => {
    usuarioRepository.findByEmail.mockResolvedValue(null);
    administradorRepository.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'teste@email.com', senha: '123456' }),
    ).rejects.toThrow('Credenciais inválidas');
  });

  it('deve renovar tokens a partir de um refresh token válido', async () => {
    refreshJwtService.verifyAsync.mockResolvedValue({
      id: 1,
      email: 'maria@email.com',
      role: 'cliente',
      type: 'refresh',
    });

    const result = await service.refresh({ refreshToken: 'valid-refresh-token' });

    expect(result.success).toBe(true);
    expect(result.data.accessToken).toBe('fake-access-token');
    expect(result.data.refreshToken).toBe('fake-refresh-token');
  });

  it('deve rejeitar refresh quando o token não é do tipo refresh', async () => {
    refreshJwtService.verifyAsync.mockResolvedValue({
      id: 1,
      email: 'maria@email.com',
      role: 'cliente',
      type: 'access',
    });

    await expect(service.refresh({ refreshToken: 'not-a-refresh-token' })).rejects.toThrow(
      'Token fornecido não é um refresh token',
    );
  });

  it('deve rejeitar refresh token expirado/inválido', async () => {
    refreshJwtService.verifyAsync.mockRejectedValue(new Error('expired'));

    await expect(service.refresh({ refreshToken: 'expired-token' })).rejects.toThrow(
      'Refresh token inválido ou expirado',
    );
  });

  it('deve verificar e-mail com token válido', async () => {
    jwtService.verifyAsync = jest.fn().mockResolvedValue({ id: 1, type: 'email-verification' });
    usuarioRepository.marcarEmailVerificado = jest.fn().mockResolvedValue({});

    const result = await service.verifyEmail('valid-token');

    expect(result.success).toBe(true);
    expect(usuarioRepository.marcarEmailVerificado).toHaveBeenCalledWith(1);
  });

  it('deve rejeitar verificação de e-mail com token de tipo errado', async () => {
    jwtService.verifyAsync = jest.fn().mockResolvedValue({ id: 1, type: 'access' });

    await expect(service.verifyEmail('wrong-type-token')).rejects.toThrow(
      'Token fornecido não é um token de verificação de e-mail',
    );
  });
});
