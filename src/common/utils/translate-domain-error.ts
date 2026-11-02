import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DomainError, PedidoNaoPertenceAoUsuarioError } from '../domain-errors';

// Fronteira entre domínio e HTTP: o domínio lança DomainError (sem saber o
// que é um status code); o Use Case chama isto no `catch` para traduzir.
// Erros que NÃO são de domínio (bugs, falhas técnicas) passam intactos.
export function translateDomainError(error: unknown): never {
  if (error instanceof PedidoNaoPertenceAoUsuarioError) {
    throw new ForbiddenException(error.message);
  }
  if (error instanceof DomainError) {
    throw new BadRequestException(error.message);
  }
  throw error;
}
