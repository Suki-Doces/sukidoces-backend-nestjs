import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PEDIDO_REPOSITORY } from '../common/repositories/interfaces/pedido-repository.interface';
import { PRODUTO_REPOSITORY } from '../common/repositories/interfaces/produto-repository.interface';

describe('AdminService', () => {
  let service: AdminService;
  let pedidoRepository: any;

  beforeEach(async () => {
    pedidoRepository = {
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { valor_total: 0 }, _count: 0 }),
      groupByProdutoMaisVendido: jest.fn().mockResolvedValue([]),
      findRecentes: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PEDIDO_REPOSITORY, useValue: pedidoRepository },
        { provide: PRODUTO_REPOSITORY, useValue: { findSelectFields: jest.fn().mockResolvedValue([]) } },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('deve montar o dashboard sem quebrar quando não há pedidos', async () => {
    const result = await service.dashboard();

    expect(result.success).toBe(true);
    expect(result.data.resumo.totalPedidos).toBe(0);
    expect(result.data.resumo.aumentoVendas).toBe(0);
  });
});
