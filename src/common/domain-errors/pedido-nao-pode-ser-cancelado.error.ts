import { DomainError } from './domain-error';

export class PedidoNaoPodeSerCanceladoError extends DomainError {
  constructor(status: string) {
    const mensagens: Record<string, string> = {
      cancelado: 'Este pedido já foi cancelado',
      entregue: 'Pedidos entregues não podem ser cancelados',
    };
    super(mensagens[status] || `Pedido com status "${status}" não pode ser cancelado`);
  }
}
