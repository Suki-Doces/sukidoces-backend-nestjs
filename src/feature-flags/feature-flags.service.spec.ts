import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagEntity } from '../database/entities/feature-flag.entity';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;
  let repo: any;

  beforeEach(async () => {
    repo = { findOne: jest.fn(), find: jest.fn(), upsert: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FeatureFlagsService, { provide: getRepositoryToken(FeatureFlagEntity), useValue: repo }],
    }).compile();

    service = module.get<FeatureFlagsService>(FeatureFlagsService);
  });

  it('deve retornar false (fail-safe) quando a flag não existe', async () => {
    repo.findOne.mockResolvedValue(null);
    expect(await service.isEnabled('webhooks')).toBe(false);
  });

  it('deve retornar o valor real quando a flag existe', async () => {
    repo.findOne.mockResolvedValue({ chave: 'webhooks', ativo: true });
    expect(await service.isEnabled('webhooks')).toBe(true);
  });
});
