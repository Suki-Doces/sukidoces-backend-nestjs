import { Pedido } from './pedido.domain';
import {
  PedidoJaProcessadoError,
  PedidoNaoPertenceAoUsuarioError,
  PedidoNaoPodeSerCanceladoError,
  PrazoCancelamentoExpiradoError,
} from '../../common/domain-errors';

const horasAtras = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);

describe('Pedido (domínio)', () => {
  it('deve cancelar um pedido pendente dentro da janela de 2h', () => {
    const pedido = new Pedido(1, 7, 'pendente', horasAtras(1));
    pedido.cancelar();
    expect(pedido.status).toBe('cancelado');
  });

  it('deve recusar cancelamento fora da janela de 2h', () => {
    const pedido = new Pedido(1, 7, 'pendente', horasAtras(3));
    expect(() => pedido.cancelar()).toThrow(PrazoCancelamentoExpiradoError);
    expect(() => pedido.cancelar()).toThrow(/prazo de 2 horas/);
    expect(pedido.status).toBe('pendente');
  });

  it('deve recusar cancelar pedido já cancelado ou entregue', () => {
    expect(() => new Pedido(1, 7, 'cancelado', horasAtras(0)).cancelar()).toThrow(PedidoNaoPodeSerCanceladoError);
    expect(() => new Pedido(1, 7, 'entregue', horasAtras(0)).cancelar()).toThrow(
      'Pedidos entregues não podem ser cancelados',
    );
  });

  it('deve garantir que o pedido pertence ao usuário', () => {
    const pedido = new Pedido(1, 7, 'pendente', horasAtras(0));
    expect(() => pedido.garantirQuePertenceAo(8)).toThrow(PedidoNaoPertenceAoUsuarioError);
    expect(() => pedido.garantirQuePertenceAo(7)).not.toThrow();
  });

  it('deve marcar como pago apenas pedidos pendentes', () => {
    const pendente = new Pedido(1, 7, 'pendente', horasAtras(0));
    pendente.marcarComoPago();
    expect(pendente.status).toBe('pago');

    expect(() => new Pedido(2, 7, 'pago', horasAtras(0)).marcarComoPago()).toThrow(PedidoJaProcessadoError);
  });
});
