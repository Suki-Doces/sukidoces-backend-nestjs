import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IPedidoRepository, PEDIDO_REPOSITORY } from '../../common/repositories/interfaces/pedido-repository.interface';
import { PedidoMapper } from '../domain/pedido.mapper';
import { ADMIN_NOTIFICATION_EVENTS, PedidoPagoEvent } from '../../notifications/admin-notification.events';
import { buildSuccessResponse } from '../../common/responses/api-response';
import { translateDomainError } from '../../common/utils/translate-domain-error';

@Injectable()
export class PagarNovamenteUseCase {
  constructor(
    @Inject(PEDIDO_REPOSITORY) private readonly pedidoRepository: IPedidoRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(usuarioId: number, idPedido: number) {
    const entity = await this.pedidoRepository.findById(idPedido);
    if (!entity) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // As regras (dono do pedido, só pendente pode ser pago) moram no domínio.
    const pedido = PedidoMapper.toDomain(entity);
    try {
      pedido.garantirQuePertenceAo(usuarioId);
      pedido.marcarComoPago();
    } catch (error) {
      translateDomainError(error);
    }

    try {
      const pedidoPago = await this.pedidoRepository.updateStatus(idPedido, pedido.status);
      this.eventEmitter.emit(ADMIN_NOTIFICATION_EVENTS.PEDIDO_PAGO, new PedidoPagoEvent(idPedido));
      return buildSuccessResponse('Pedido pago com sucesso', { pedido: pedidoPago });
    } catch (error) {
      throw new InternalServerErrorException('Erro interno ao processar pagamento');
    }
  }
}
