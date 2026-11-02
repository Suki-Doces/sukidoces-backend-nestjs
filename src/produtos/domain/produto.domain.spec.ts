import { Produto } from './produto.domain';
import { EstoqueInsuficienteError } from '../../common/domain-errors';

describe('Produto (domínio)', () => {
  const novo = (quantidade = 5) => new Produto(1, 'Bolo', 10, quantidade, true);

  it('deve informar se tem estoque suficiente', () => {
    expect(novo(5).temEstoqueSuficiente(5)).toBe(true);
    expect(novo(5).temEstoqueSuficiente(6)).toBe(false);
  });

  it('deve decrementar o estoque quando há quantidade suficiente', () => {
    const produto = novo(5);
    produto.decrementarEstoque(3);
    expect(produto.quantidade).toBe(2);
  });

  it('deve lançar EstoqueInsuficienteError (com a mensagem original) quando falta estoque', () => {
    const produto = novo(2);
    expect(() => produto.decrementarEstoque(5)).toThrow(EstoqueInsuficienteError);
    expect(() => produto.decrementarEstoque(5)).toThrow('Estoque insuficiente para: Bolo. Disponível: 2');
    expect(produto.quantidade).toBe(2); // não muta quando falha
  });

  it('deve incrementar o estoque e calcular subtotal', () => {
    const produto = novo(1);
    produto.incrementarEstoque(4);
    expect(produto.quantidade).toBe(5);
    expect(produto.calcularSubtotal(3)).toBe(30);
  });
});
