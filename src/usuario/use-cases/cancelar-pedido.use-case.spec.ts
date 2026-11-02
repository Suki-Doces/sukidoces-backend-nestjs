import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CancelarPedidoUseCase } from './cancelar-pedido.use-case';
import { PEDIDO_REPOSITORY } from '../../common/repositories/interfaces/pedido-repository.interface';
import { PedidoEntity } from '../../database/entities/pedido.entity';
import { ProdutoEntity } from '../../database/entities/produto.entity';

describe('CancelarPedidoUseCase', () => {
  let useCase: CancelarPedidoUseCase;
  let pedidoRepository: any;
  let eventEmitter: any;
  let fakePedidoRepo: any;
  let fakeProdutoRepo: any;

  beforeEach(async () => {
    fakePedidoRepo = {
      update: jest.fn().mockResolvedValue({}),
      findOne: jest.fn().mockResolvedValue({ id_pedido: 10, status: 'cancelado' }),
    };
    fakeProdutoRepo = { increment: jest.fn().mockResolvedValue({}) };
    pedidoRepository = {
      findByIdWithItens: jest.fn(),
      runTransaction: jest.fn(async (fn: any) =>
        fn({
          getRepository: (entity: any) => {
            if (entity === PedidoEntity) return fakePedidoRepo;
            if (entity === ProdutoEntity) return fakeProdutoRepo;
            throw new Error(`Entidade inesperada no teste: ${entity}`);
          },
        }),
      ),
    };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelarPedidoUseCase,
        { provide: PEDIDO_REPOSITORY, useValue: pedidoRepository },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();
    useCase = module.get(CancelarPedidoUseCase);
  });

  const pedido = (over: Record<string, any> = {}) => ({
    id_pedido: 10,
    id_usuario: 1,
    status: 'pendente',
    data_pedido: new Date(),
    itens_pedido: [{ id_produto: 5, quantidade: 2 }],
    ...over,
  });

  it('404 quando o pedido não existe', async () => {
    pedidoRepository.findByIdWithItens.mockResolvedValue(null);
    await expect(useCase.execute(1, 10)).rejects.toThrow('Pedido não encontrado');
  });

  it('403 ao cancelar pedido de outro usuário', async () => {
    pedidoRepository.findByIdWithItens.mockResolvedValue(pedido({ id_usuario: 2 }));
    await expect(useCase.execute(1, 10)).rejects.toThrow('Você não tem permissão.');
  });

  it('400 ao cancelar pedido já entregue', async () => {
    pedidoRepository.findByIdWithItens.mockResolvedValue(pedido({ status: 'entregue' }));
    await expect(useCase.execute(1, 10)).rejects.toThrow('Pedidos entregues não podem ser cancelados');
  });

  it('400 ao cancelar pedido já cancelado', async () => {
    pedidoRepository.findByIdWithItens.mockResolvedValue(pedido({ status: 'cancelado' }));
    await expect(useCase.execute(1, 10)).rejects.toThrow('Este pedido já foi cancelado');
  });

  it('400 fora da janela de 2 horas, sem tocar no banco', async () => {
    pedidoRepository.findByIdWithItens.mockResolvedValue(pedido({ data_pedido: new Date(Date.now() - 3 * 3600 * 1000) }));
    await expect(useCase.execute(1, 10)).rejects.toThrow(/prazo de 2 horas/);
    expect(pedidoRepository.runTransaction).not.toHaveBeenCalled();
  });

  it('cancela dentro do prazo, devolve o estoque e emite o evento', async () => {
    pedidoRepository.findByIdWithItens.mockResolvedValue(pedido());

    const result = await useCase.execute(1, 10);

    expect(result.success).toBe(true);
    expect(fakePedidoRepo.update).toHaveBeenCalledWith({ id_pedido: 10 }, { status: 'cancelado' });
    expect(fakeProdutoRepo.increment).toHaveBeenCalledWith({ id_produto: 5 }, 'quantidade', 2);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'admin-notification.pedido-cancelado',
      expect.objectContaining({ idPedido: 10 }),
    );
  });
});
