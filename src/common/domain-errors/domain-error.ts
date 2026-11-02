// Base de todos os erros de DOMÍNIO — regras de negócio violadas, não erros
// técnicos. O domínio nunca lança HttpException (não sabe o que é HTTP);
// quem traduz um DomainError em status HTTP é a camada de Use Case, na
// fronteira com o mundo exterior.
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
