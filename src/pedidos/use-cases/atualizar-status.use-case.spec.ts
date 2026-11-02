import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AtualizarStatusUseCase } from './atualizar-status.use-case';
import { PEDIDO_REPOSITORY } from '../../common/repositories/interfaces/pedido-repository.interface';
import { PRODUTO_REPOSITORY } from '../../common/repositories/interfaces/produto-repository.interface';

describe('AtualizarStatusUseCase', () => {
  let useCase: AtualizarStatusUseCase;
  let pedidoRepository: any;
  let produtoRepository: any;
  let eventEmitter: any;

  beforeEach(async () => {
    pedidoRepository = { findByIdWithItens: jest.fn(), updateStatus: jest.fn().mockResolvedValue({}) };
    produtoRepository = { incrementarEstoque: jest.fn(), decrementarEstoque: jest.fn() };
    eventEmitter = { emit: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AtualizarStatusUseCase,
        { provide: PEDIDO_REPOSITORY, useValue: pedidoRepository },
        { provide: PRODUTO_REPOSITORY, useValue: produtoRepository },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();
    useCase = module.get(AtualizarStatusUseCase);
  });

  const comItens = (status: string) => ({ id_pedido: 1, status, itens_pedido: [{ id_produto: 1, quantidade: 3 }] });

  it('404 quando o pedido não existe', async () => {
    pedidoRepository.findByIdWithItens.mockResolvedValue(null);
    await expect(useCase.execute(1, 'enviado')).rejects.toThrow('Pedido não encontrado');
  });

  it('devolve o estoque ao cancelar', async () => {
    pedidoRepository.findByIdWithItens.mockResolvedValue(comItens('pago'));
    await useCase.execute(1, 'cancelado');
    expect(produtoRepository.incrementarEstoque).toHaveBeenCalledWith(1, 3);
  });

  it('baixa o estoque de novo ao reabrir um pedido cancelado', async () => {
    pedidoRepository.findByIdWithItens.mockResolvedValue(comItens('cancelado'));
    await useCase.execute(1, 'pendente');
    expect(produtoRepository.decrementarEstoque).toHaveBeenCalledWith(1, 3);
  });

  it('não mexe no estoque em transições comuns e emite o evento', async () => {
    pedidoRepository.findByIdWithItens.mockResolvedValue(comItens('pago'));
    await useCase.execute(1, 'enviado');
    expect(produtoRepository.incrementarEstoque).not.toHaveBeenCalled();
    expect(produtoRepository.decrementarEstoque).not.toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'admin-notification.pedido-status-atualizado',
      expect.objectContaining({ idPedido: 1, novoStatus: 'enviado' }),
    );
  });
});
