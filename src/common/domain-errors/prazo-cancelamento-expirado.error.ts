import { DomainError } from './domain-error';

export class PrazoCancelamentoExpiradoError extends DomainError {
  constructor(horasPassadas: number) {
    super(
      `O prazo de 2 horas para cancelamento expirou (${horasPassadas.toFixed(1)}h após a compra). Entre em contato com o suporte.`,
    );
  }
}
