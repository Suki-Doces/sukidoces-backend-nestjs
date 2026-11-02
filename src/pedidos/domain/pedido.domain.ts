import { PedidoStatus } from '../../common/enums/pedido-status.enum';
import {
  PedidoJaProcessadoError,
  PedidoNaoPertenceAoUsuarioError,
  PedidoNaoPodeSerCanceladoError,
  PrazoCancelamentoExpiradoError,
} from '../../common/domain-errors';

const JANELA_CANCELAMENTO_HORAS = 2;

// Regras sobre um pedido (quem pode cancelar, em qual prazo, quais
// transições de status são válidas) — sem TypeORM e sem HTTP.
export class Pedido {
  constructor(
    public readonly id: number,
    public readonly idUsuario: number,
    private _status: string,
    public readonly dataPedido: Date,
  ) {}

  get status(): string {
    return this._status;
  }

  garantirQuePertenceAo(usuarioId: number): void {
    if (this.idUsuario !== usuarioId) {
      throw new PedidoNaoPertenceAoUsuarioError();
    }
  }

  cancelar(agora: Date = new Date()): void {
    if (this._status === PedidoStatus.CANCELADO || this._status === PedidoStatus.ENTREGUE) {
      throw new PedidoNaoPodeSerCanceladoError(this._status);
    }

    const horas = (agora.getTime() - this.dataPedido.getTime()) / (1000 * 60 * 60);
    if (horas > JANELA_CANCELAMENTO_HORAS) {
      throw new PrazoCancelamentoExpiradoError(horas);
    }

    this._status = PedidoStatus.CANCELADO;
  }

  marcarComoPago(): void {
    if (this._status !== PedidoStatus.PENDENTE) {
      throw new PedidoJaProcessadoError();
    }
    this._status = PedidoStatus.PAGO;
  }
}
