import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import { REFRESH_JWT_SERVICE } from '../../common/jwt/jwt-config.module';
import { TokenIssuerService } from '../token-issuer.service';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let refreshJwt: any;

  beforeEach(async () => {
    refreshJwt = { verifyAsync: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        { provide: REFRESH_JWT_SERVICE, useValue: refreshJwt },
        {
          provide: TokenIssuerService,
          useValue: { issueTokenPair: jest.fn().mockResolvedValue({ token: 'a', accessToken: 'a', refreshToken: 'r' }) },
        },
      ],
    }).compile();
    useCase = module.get(RefreshTokenUseCase);
  });

  it('renova o par de tokens a partir de um refresh token válido', async () => {
    refreshJwt.verifyAsync.mockResolvedValue({ id: 1, email: 'm@m.com', role: 'cliente', type: 'refresh' });
    const result = await useCase.execute({ refreshToken: 'ok' });
    expect(result.success).toBe(true);
    expect(result.data.accessToken).toBe('a');
  });

  it('rejeita token que não é do tipo refresh', async () => {
    refreshJwt.verifyAsync.mockResolvedValue({ id: 1, email: 'm@m.com', role: 'cliente', type: 'access' });
    await expect(useCase.execute({ refreshToken: 'x' })).rejects.toThrow('Token fornecido não é um refresh token');
  });

  it('rejeita token expirado/inválido', async () => {
    refreshJwt.verifyAsync.mockRejectedValue(new Error('expired'));
    await expect(useCase.execute({ refreshToken: 'x' })).rejects.toThrow('Refresh token inválido ou expirado');
  });
});
