import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificacoesService } from './notificacoes.service';
import { NotificacaoEntity } from '../database/entities/notificacao.entity';

describe('NotificacoesService', () => {
  let service: NotificacoesService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificacoesService, { provide: getRepositoryToken(NotificacaoEntity), useValue: repo }],
    }).compile();

    service = module.get<NotificacoesService>(NotificacoesService);
  });

  it('deve limitar o limite de paginação ao teto máximo (100)', async () => {
    await service.listar(1, { limit: '99999' });
    expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
  });

  it('deve rejeitar marcar como lida uma notificação que não é do usuário', async () => {
    repo.update.mockResolvedValue({ affected: 0 });
    await expect(service.marcarLida(1, '999')).rejects.toThrow('Não autorizado ou notificação inexistente');
  });

  it('deve marcar como lida com sucesso quando a notificação é do usuário', async () => {
    repo.update.mockResolvedValue({ affected: 1 });
    const result = await service.marcarLida(1, '5');
    expect(result.success).toBe(true);
  });
});
