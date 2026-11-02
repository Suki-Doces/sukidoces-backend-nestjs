import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RegisterUseCase } from './register.use-case';
import { USUARIO_REPOSITORY } from '../../common/repositories/interfaces/usuario-repository.interface';
import { EmailService } from '../../email/email.service';
import { TokenIssuerService } from '../token-issuer.service';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let usuarioRepository: any;
  let eventEmitter: any;
  let emailService: any;

  beforeEach(async () => {
    usuarioRepository = { findByEmail: jest.fn(), create: jest.fn() };
    eventEmitter = { emit: jest.fn() };
    emailService = { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        { provide: USUARIO_REPOSITORY, useValue: usuarioRepository },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('verification-token') } },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: EmailService, useValue: emailService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('4') } }, // bcrypt rápido nos testes
        {
          provide: TokenIssuerService,
          useValue: {
            issueTokenPair: jest
              .fn()
              .mockResolvedValue({ token: 'access', accessToken: 'access', refreshToken: 'refresh' }),
          },
        },
      ],
    }).compile();

    useCase = module.get(RegisterUseCase);
  });

  it('registra o usuário, emite o evento e devolve os tokens', async () => {
    usuarioRepository.findByEmail.mockResolvedValue(null);
    usuarioRepository.create.mockResolvedValue({
      id_usuario: 1,
      nome: 'Maria',
      email: 'maria@email.com',
      role: 'cliente',
      data_criacao: new Date(),
      foto_perfil: null,
    });

    const result = await useCase.execute({
      nome: 'Maria',
      email: 'Maria@Email.com',
      senha: '123456',
      telefone: '11999999999',
    });

    expect(result.success).toBe(true);
    expect(result.data.token).toBe('access');
    expect(result.data.refreshToken).toBe('refresh');
    expect(usuarioRepository.findByEmail).toHaveBeenCalledWith('maria@email.com'); // normaliza e-mail
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'admin-notification.usuario-registrado',
      expect.objectContaining({ nomeUsuario: 'Maria' }),
    );
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith('maria@email.com', 'verification-token');
  });

  it('nunca grava a senha em texto puro', async () => {
    usuarioRepository.findByEmail.mockResolvedValue(null);
    usuarioRepository.create.mockResolvedValue({ id_usuario: 1, nome: 'M', email: 'm@m.com', role: 'cliente' });

    await useCase.execute({ nome: 'Maria', email: 'm@m.com', senha: '123456', telefone: '11999999999' });

    const dadosGravados = usuarioRepository.create.mock.calls[0][0];
    expect(dadosGravados.senha).not.toBe('123456');
    expect(dadosGravados.senha).toMatch(/^\$2[aby]\$/);
  });

  it('rejeita e-mail já cadastrado', async () => {
    usuarioRepository.findByEmail.mockResolvedValue({ id_usuario: 1 });

    await expect(
      useCase.execute({ nome: 'Maria', email: 'maria@email.com', senha: '123456', telefone: '11999999999' }),
    ).rejects.toThrow('E-mail já cadastrado');
    expect(usuarioRepository.create).not.toHaveBeenCalled();
  });
});
