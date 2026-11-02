import { EstoqueInsuficienteError } from '../../common/domain-errors';

// Objeto de domínio "rico": ao contrário de `ProdutoEntity` (espelho da
// tabela, decorado com TypeORM), esta classe não sabe nada sobre
// persistência — só as REGRAS de negócio sobre estoque e preço.
export class Produto {
  constructor(
    public readonly id: number,
    public readonly nome: string,
    public readonly preco: number,
    private _quantidade: number,
    public readonly ativo: boolean,
  ) {}

  get quantidade(): number {
    return this._quantidade;
  }

  temEstoqueSuficiente(quantidadeDesejada: number): boolean {
    return this._quantidade >= quantidadeDesejada;
  }

  // Lança em vez de devolver boolean: o Use Case só decide COMO reagir
  // (traduzir pra HTTP 400), sem reimplementar a regra.
  //
  // IMPORTANTE: isto valida e muta só o objeto em memória. A escrita real
  // no banco continua sendo feita por `ProdutoRepository.decrementarEstoque`
  // (UPDATE ... SET quantidade = quantidade - N), atômica — fazer
  // "lê quantidade, calcula no domínio, grava valor novo" teria race
  // condition entre dois checkouts concorrentes.
  decrementarEstoque(quantidade: number): void {
    if (!this.temEstoqueSuficiente(quantidade)) {
      throw new EstoqueInsuficienteError(this.nome, this._quantidade);
    }
    this._quantidade -= quantidade;
  }

  incrementarEstoque(quantidade: number): void {
    this._quantidade += quantidade;
  }

  calcularSubtotal(quantidade: number): number {
    return this.preco * quantidade;
  }
}
