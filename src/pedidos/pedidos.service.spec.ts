import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PedidosService } from './pedidos.service';
import { PEDIDO_REPOSITORY } from '../common/repositories/interfaces/pedido-repository.interface';
import { PRODUTO_REPOSITORY } from '../common/repositories/interfaces/produto-repository.interface';
import { CupomEntity } from '../database/entities/cupom.entity';
import { PedidoEntity } from '../database/entities/pedido.entity';
import { ItemPedidoEntity } from '../database/entities/item-pedido.entity';
import { ProdutoEntity } from '../database/entities/produto.entity';

describe('PedidosService', () => {
  let service: PedidosService;
  let pedidoRepository: any;
  let produtoRepository: any;
  let cupomRepo: any;
  let eventEmitter: any;

  beforeEach(async () => {
    pedidoRepository = {
      findAllAdmin: jest.fn(),
      findById: jest.fn(),
      findByIdWithItens: jest.fn(),
      updateStatus: jest.fn(),
      runTransaction: jest.fn(),
    };
    produtoRepository = {
      findManyByIds: jest.fn(),
      incrementarEstoque: jest.fn(),
      decrementarEstoque: jest.fn(),
    };
    cupomRepo = { findOne: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidosService,
        { provide: getRepositoryToken(CupomEntity), useValue: cupomRepo },
        { provide: PEDIDO_REPOSITORY, useValue: pedidoRepository },
        { provide: PRODUTO_REPOSITORY, useValue: produtoRepository },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<PedidosService>(PedidosService);
  });

  it('deve rejeitar checkout sem produtos', async () => {
    await expect(
      service.checkout(1, { produtos: [], metodo_pagamento: 'pix' }),
    ).rejects.toThrow('Dados obrigatórios ausentes');
  });

  it('deve rejeitar checkout quando produto não existe', async () => {
    produtoRepository.findManyByIds.mockResolvedValue([]);

    await expect(
      service.checkout(1, { produtos: [{ id_produto: 99, quantidade: 1 }], metodo_pagamento: 'pix' }),
    ).rejects.toThrow('Produto ID 99 não encontrado');
  });

  it('deve rejeitar checkout com estoque insuficiente', async () => {
    produtoRepository.findManyByIds.mockResolvedValue([
      { id_produto: 1, nome: 'Bolo', preco: 10, quantidade: 1 },
    ]);

    await expect(
      service.checkout(1, { produtos: [{ id_produto: 1, quantidade: 5 }], metodo_pagamento: 'pix' }),
    ).rejects.toThrow(/Estoque insuficiente/);
  });

  it('deve completar checkout com sucesso e emitir evento de pedido criado', async () => {
    produtoRepository.findManyByIds.mockResolvedValue([
      { id_produto: 1, nome: 'Bolo', preco: 10, quantidade: 5 },
    ]);

    const fakePedidoRepo = { create: jest.fn((d) => d), save: jest.fn().mockResolvedValue({ id_pedido: 42 }) };
    const fakeItemRepo = { create: jest.fn((d) => d), save: jest.fn().mockResolvedValue([]) };
    const fakeProdutoRepo = { decrement: jest.fn().mockResolvedValue({}) };

    pedidoRepository.runTransaction.mockImplementation(async (fn: any) => {
      const manager = {
        getRepository: (entity: any) => {
          if (entity === PedidoEntity) return fakePedidoRepo;
          if (entity === ItemPedidoEntity) return fakeItemRepo;
          if (entity === ProdutoEntity) return fakeProdutoRepo;
          throw new Error(`Entidade inesperada no teste: ${entity}`);
        },
      };
      return fn(manager);
    });

    const result = await service.checkout(1, {
      produtos: [{ id_produto: 1, quantidade: 2 }],
      metodo_pagamento: 'pix',
    });

    expect(result.success).toBe(true);
    expect(fakeProdutoRepo.decrement).toHaveBeenCalledWith({ id_produto: 1 }, 'quantidade', 2);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'admin-notification.pedido-criado',
      expect.objectContaining({ idPedido: 42, valorTotal: 20 }),
    );
  });

  it('deve rejeitar pagar novamente um pedido que não é do usuário', async () => {
    pedidoRepository.findById.mockResolvedValue({ id_pedido: 1, id_usuario: 2, status: 'pendente' });

    await expect(service.pagarNovamente(1, 1)).rejects.toThrow('Você não tem permissão.');
  });

  it('deve reverter estoque ao cancelar um pedido via atualizarStatus', async () => {
    pedidoRepository.findByIdWithItens.mockResolvedValue({
      id_pedido: 1,
      status: 'pago',
      itens_pedido: [{ id_produto: 1, quantidade: 3 }],
    });
    pedidoRepository.updateStatus.mockResolvedValue({ id_pedido: 1, status: 'cancelado' });

    await service.atualizarStatus(1, 'cancelado');

    expect(produtoRepository.incrementarEstoque).toHaveBeenCalledWith(1, 3);
  });
});
