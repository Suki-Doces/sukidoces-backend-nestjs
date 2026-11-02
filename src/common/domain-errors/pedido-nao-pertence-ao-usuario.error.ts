import { DomainError } from './domain-error';

export class PedidoNaoPertenceAoUsuarioError extends DomainError {
  constructor() {
    super('Você não tem permissão.');
  }
}
