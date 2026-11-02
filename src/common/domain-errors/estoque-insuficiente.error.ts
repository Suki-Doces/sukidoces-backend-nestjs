import { DomainError } from './domain-error';

export class EstoqueInsuficienteError extends DomainError {
  constructor(nomeProduto: string, disponivel: number) {
    super(`Estoque insuficiente para: ${nomeProduto}. Disponível: ${disponivel}`);
  }
}
