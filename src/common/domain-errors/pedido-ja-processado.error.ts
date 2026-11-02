import { DomainError } from './domain-error';

export class PedidoJaProcessadoError extends DomainError {
  constructor() {
    super('Pedido já processado');
  }
}
