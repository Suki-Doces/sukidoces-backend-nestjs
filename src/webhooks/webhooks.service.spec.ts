import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WebhooksService } from './webhooks.service';
import { WebhookEntity } from '../database/entities/webhook.entity';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let repo: any;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    repo = { find: jest.fn(), findOne: jest.fn(), create: jest.fn((d) => d), save: jest.fn(), delete: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhooksService, { provide: getRepositoryToken(WebhookEntity), useValue: repo }],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 200 } as any);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('deve filtrar apenas webhooks ativos assinantes do evento pedido', async () => {
    repo.find.mockResolvedValue([
      { id_webhook: 1, url: 'https://a.com', eventos: 'admin-notification.pedido-criado', ativo: true },
      { id_webhook: 2, url: 'https://b.com', eventos: 'admin-notification.pedido-pago', ativo: true },
    ]);

    const result = await service.findAtivosParaEvento('admin-notification.pedido-criado');

    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://a.com');
  });

  it('deve chamar fetch com o payload correto ao disparar um webhook', async () => {
    await service.dispatch('https://exemplo.com/webhook', { evento: 'teste' });
    expect(fetchSpy).toHaveBeenCalledWith('https://exemplo.com/webhook', expect.objectContaining({ method: 'POST' }));
  });

  it('NÃO deve lançar erro quando o webhook de terceiro falha (melhor esforço)', async () => {
    fetchSpy.mockRejectedValue(new Error('timeout'));
    await expect(service.dispatch('https://exemplo.com/webhook', {})).resolves.toBeUndefined();
  });
});
