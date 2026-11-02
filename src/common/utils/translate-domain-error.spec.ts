import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { translateDomainError } from './translate-domain-error';
import { EstoqueInsuficienteError, PedidoNaoPertenceAoUsuarioError } from '../domain-errors';

describe('translateDomainError', () => {
  it('traduz erro de "pedido de outro usuário" para 403', () => {
    expect(() => translateDomainError(new PedidoNaoPertenceAoUsuarioError())).toThrow(ForbiddenException);
  });

  it('traduz qualquer outro DomainError para 400, preservando a mensagem', () => {
    expect(() => translateDomainError(new EstoqueInsuficienteError('Bolo', 1))).toThrow(BadRequestException);
    expect(() => translateDomainError(new EstoqueInsuficienteError('Bolo', 1))).toThrow(
      'Estoque insuficiente para: Bolo. Disponível: 1',
    );
  });

  it('deixa passar erros que NÃO são de domínio', () => {
    const erroTecnico = new Error('conexão caiu');
    expect(() => translateDomainError(erroTecnico)).toThrow(erroTecnico);
  });
});
