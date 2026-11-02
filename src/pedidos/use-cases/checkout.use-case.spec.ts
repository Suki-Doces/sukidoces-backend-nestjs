import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CheckoutUseCase } from './checkout.use-case';
import { PEDIDO_REPOSITORY } from '../../common/repositories/interfaces/pedido-repository.interface';
import { PRODUTO_REPOSITORY } from '../../common/repositories/interfaces/produto-repository.interface';
import { CupomEntity } from '../../database/entities/cupom.entity';
import { PedidoEntity } from '../../database/entities/pedido.entity';
import { ItemPedidoEntity } from '../../database/entities/item-pedido.entity';
import { ProdutoEntity } from '../../database/entities/produto.entity';

describe('CheckoutUseCase', () => {
  let useCase: CheckoutUseCase;
  let pedidoRepository: any;
  let produtoRepository: any;
  let cupomRepo: any;
  let eventEmitter: any;
  let fakePedidoRepo: any;
  let fakeItemRepo: any;
  let fakeProdutoRepo: any;

  beforeEach(async () => {
    pedidoRepository = { runTransaction: jest.fn() };
    produtoRepository = { findManyByIds: jest.fn() };
    cupomRepo = { findOne: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    // Simula o EntityManager transacional: `manager.getRepository(Entity)`.
    fakePedidoRepo = { create: jest.fn((d) => d), save: jest.fn().mockResolvedValue({ id_pedido: 42 }) };
    fakeItemRepo = { create: jest.fn((d) => d), save: jest.fn().mockResolvedValue([]) };
    fakeProdutoRepo = { decrement: jest.fn().mockResolvedValue({}) };
    pedidoRepository.runTransaction.mockImplementation(async (fn: any) =>
      fn({
        getRepository: (entity: any) => {
          if (entity === PedidoEntity) return fakePedidoRepo;
          if (entity === ItemPedidoEntity) return fakeItemRepo;
          if (entity === ProdutoEntity) return fakeProdutoRepo;
          throw new Error(`Entidade inesperada no teste: ${entity}`);
        },
      }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutUseCase,
        { provide: PEDIDO_REPOSITORY, useValue: pedidoRepository },
        { provide: PRODUTO_REPOSITORY, useValue: produtoRepository },
        { provide: getRepositoryToken(CupomEntity), useValue: cupomRepo },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    useCase = module.get(CheckoutUseCase);
  });

  const bolo = (quantidade = 5) => ({ id_produto: 1, nome: 'Bolo', preco: 10, quantidade, ativo: true });

  it('rejeita checkout sem produtos ou sem método de pagamento', async () => {
    await expect(useCase.execute(1, { produtos: [], metodo_pagamento: 'pix' })).rejects.toThrow(
      'Dados obrigatórios ausentes',
    );
    await expect(
      useCase.execute(1, { produtos: [{ id_produto: 1, quantidade: 1 }], metodo_pagamento: '' }),
    ).rejects.toThrow('Dados obrigatórios ausentes');
  });

  it('rejeita produto inexistente', async () => {
    produtoRepository.findManyByIds.mockResolvedValue([]);
    await expect(
      useCase.execute(1, { produtos: [{ id_produto: 99, quantidade: 1 }], metodo_pagamento: 'pix' }),
    ).rejects.toThrow('Produto ID 99 não encontrado');
  });

  it('rejeita estoque insuficiente (regra vinda do domínio, traduzida para 400)', async () => {
    produtoRepository.findManyByIds.mockResolvedValue([bolo(1)]);
    await expect(
      useCase.execute(1, { produtos: [{ id_produto: 1, quantidade: 5 }], metodo_pagamento: 'pix' }),
    ).rejects.toThrow('Estoque insuficiente para: Bolo. Disponível: 1');
    expect(pedidoRepository.runTransaction).not.toHaveBeenCalled();
  });

  it('conclui o checkout: grava pedido+itens, baixa o estoque atomicamente e emite o evento', async () => {
    produtoRepository.findManyByIds.mockResolvedValue([bolo(5)]);

    const result = await useCase.execute(1, {
      produtos: [{ id_produto: 1, quantidade: 2 }],
      metodo_pagamento: 'pix',
    });

    expect(result.success).toBe(true);
    expect(fakePedidoRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id_usuario: 1, valor_total: 20, status: 'pago' }),
    );
    expect(fakeProdutoRepo.decrement).toHaveBeenCalledWith({ id_produto: 1 }, 'quantidade', 2);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'admin-notification.pedido-criado',
      expect.objectContaining({ idPedido: 42, valorTotal: 20 }),
    );
  });

  it('pagamento que não é pix/cartão começa como pendente', async () => {
    produtoRepository.findManyByIds.mockResolvedValue([bolo(5)]);
    await useCase.execute(1, { produtos: [{ id_produto: 1, quantidade: 1 }], metodo_pagamento: 'boleto' });
    expect(fakePedidoRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pendente' }));
  });

  it('aplica cupom percentual válido', async () => {
    produtoRepository.findManyByIds.mockResolvedValue([bolo(5)]);
    cupomRepo.findOne.mockResolvedValue({ id_cupom: 3, ativo: true, validade: null, tipo: 'percentual', valor: 50 });

    await useCase.execute(1, {
      produtos: [{ id_produto: 1, quantidade: 2 }],
      metodo_pagamento: 'pix',
      codigo_cupom: ' promo50 ',
    });

    expect(cupomRepo.findOne).toHaveBeenCalledWith({ where: { codigo: 'PROMO50' } });
    expect(fakePedidoRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ valor_total: 10, id_cupom: 3 }),
    );
  });

  it('ignora cupom expirado', async () => {
    produtoRepository.findManyByIds.mockResolvedValue([bolo(5)]);
    cupomRepo.findOne.mockResolvedValue({ id_cupom: 3, ativo: true, validade: new Date('2020-01-01'), tipo: 'fixo', valor: 5 });

    await useCase.execute(1, {
      produtos: [{ id_produto: 1, quantidade: 2 }],
      metodo_pagamento: 'pix',
      codigo_cupom: 'VELHO',
    });

    expect(fakePedidoRepo.create).toHaveBeenCalledWith(expect.objectContaining({ valor_total: 20 }));
  });
});
