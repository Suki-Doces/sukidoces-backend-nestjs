import { Test, TestingModule } from '@nestjs/testing';
import { PedidosService } from './pedidos.service';
import { PEDIDO_REPOSITORY } from '../common/repositories/interfaces/pedido-repository.interface';

describe('PedidosService', () => {
  it('formata a listagem administrativa de pedidos', async () => {
    const pedidoRepository = {
      findAllAdmin: jest.fn().mockResolvedValue([
        {
          id_pedido: 1,
          usuario: { nome: 'Maria', email: 'm@m.com' },
          data_pedido: new Date('2026-01-01'),
          status: 'pago',
          valor_total: '30.50',
          metodo_pagamento: 'pix',
          itens_pedido: [{ quantidade: 2, produtos: { nome: 'Bolo', imagem: 'x.png' } }],
        },
        { id_pedido: 2, usuario: null, data_pedido: new Date(), status: 'pendente', valor_total: 5, itens_pedido: [] },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PedidosService, { provide: PEDIDO_REPOSITORY, useValue: pedidoRepository }],
    }).compile();

    const result = await module.get(PedidosService).listarTodos();

    expect(result.data[0]).toMatchObject({ cliente_nome: 'Maria', valor_total: 30.5, itens: [{ nome: 'Bolo', quantidade: 2 }] });
    expect(result.data[1].cliente_nome).toBe('Cliente'); // fallback quando o usuário foi removido
  });
});
