import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { VerifyEmailUseCase } from './verify-email.use-case';
import { USUARIO_REPOSITORY } from '../../common/repositories/interfaces/usuario-repository.interface';

describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
  let jwt: any;
  let usuarioRepository: any;

  beforeEach(async () => {
    jwt = { verifyAsync: jest.fn() };
    usuarioRepository = { marcarEmailVerificado: jest.fn().mockResolvedValue({}) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyEmailUseCase,
        { provide: JwtService, useValue: jwt },
        { provide: USUARIO_REPOSITORY, useValue: usuarioRepository },
      ],
    }).compile();
    useCase = module.get(VerifyEmailUseCase);
  });

  it('marca o e-mail como verificado com um token válido', async () => {
    jwt.verifyAsync.mockResolvedValue({ id: 1, type: 'email-verification' });
    const result = await useCase.execute('t');
    expect(result.success).toBe(true);
    expect(usuarioRepository.marcarEmailVerificado).toHaveBeenCalledWith(1);
  });

  it('rejeita token de outro tipo e token inválido', async () => {
    jwt.verifyAsync.mockResolvedValue({ id: 1, type: 'access' });
    await expect(useCase.execute('t')).rejects.toThrow('Token fornecido não é um token de verificação de e-mail');

    jwt.verifyAsync.mockRejectedValue(new Error('x'));
    await expect(useCase.execute('t')).rejects.toThrow('Link de verificação inválido ou expirado');
  });
});
