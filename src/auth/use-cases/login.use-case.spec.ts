import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginUseCase } from './login.use-case';
import { USUARIO_REPOSITORY } from '../../common/repositories/interfaces/usuario-repository.interface';
import { ADMINISTRADOR_REPOSITORY } from '../../common/repositories/interfaces/administrador-repository.interface';
import { TokenIssuerService } from '../token-issuer.service';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let usuarioRepository: any;
  let administradorRepository: any;
  let tokenIssuer: any;

  const hash = bcrypt.hashSync('123456', 4);

  beforeEach(async () => {
    usuarioRepository = { findByEmail: jest.fn(), updateSenha: jest.fn() };
    administradorRepository = { findByEmail: jest.fn(), updateSenha: jest.fn() };
    tokenIssuer = {
      issueTokenPair: jest.fn().mockResolvedValue({ token: 'a', accessToken: 'a', refreshToken: 'r' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: USUARIO_REPOSITORY, useValue: usuarioRepository },
        { provide: ADMINISTRADOR_REPOSITORY, useValue: administradorRepository },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('4') } },
        { provide: TokenIssuerService, useValue: tokenIssuer },
      ],
    }).compile();

    useCase = module.get(LoginUseCase);
  });

  it('autentica um cliente com a senha correta', async () => {
    usuarioRepository.findByEmail.mockResolvedValue({
      id_usuario: 1, nome: 'Maria', email: 'm@m.com', senha: hash, role: 'cliente', foto_perfil: null,
    });

    const result = await useCase.execute({ email: 'M@M.com', senha: '123456' });

    expect(result.success).toBe(true);
    expect(tokenIssuer.issueTokenPair).toHaveBeenCalledWith({ id: 1, email: 'm@m.com', role: 'cliente' });
  });

  it('rejeita senha errada', async () => {
    usuarioRepository.findByEmail.mockResolvedValue({ id_usuario: 1, email: 'm@m.com', senha: hash, role: 'cliente' });
    await expect(useCase.execute({ email: 'm@m.com', senha: 'errada1' })).rejects.toThrow('Credenciais inválidas');
    expect(tokenIssuer.issueTokenPair).not.toHaveBeenCalled();
  });

  it('autentica um administrador (cai na tabela de administradores) com role admin', async () => {
    usuarioRepository.findByEmail.mockResolvedValue(null);
    administradorRepository.findByEmail.mockResolvedValue({ id_admin: 9, nome: 'Adm', email: 'a@a.com', senha: hash });

    const result = await useCase.execute({ email: 'a@a.com', senha: '123456' });

    expect(result.data.user.nivel).toBe('admin');
    expect(tokenIssuer.issueTokenPair).toHaveBeenCalledWith({ id: 9, email: 'a@a.com', role: 'admin' });
  });

  it('rejeita e-mail que não existe em nenhuma tabela', async () => {
    usuarioRepository.findByEmail.mockResolvedValue(null);
    administradorRepository.findByEmail.mockResolvedValue(null);
    await expect(useCase.execute({ email: 'x@x.com', senha: '123456' })).rejects.toThrow('Credenciais inválidas');
  });

  it('migra silenciosamente senha legada em texto puro para bcrypt', async () => {
    usuarioRepository.findByEmail.mockResolvedValue({
      id_usuario: 1, nome: 'M', email: 'm@m.com', senha: 'legada123', role: 'cliente',
    });

    const result = await useCase.execute({ email: 'm@m.com', senha: 'legada123' });

    expect(result.success).toBe(true);
    expect(usuarioRepository.updateSenha).toHaveBeenCalledWith(1, expect.stringMatching(/^\$2[aby]\$/));
  });
});
