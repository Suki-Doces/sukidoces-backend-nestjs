import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IPedidoRepository, PEDIDO_REPOSITORY } from '../../common/repositories/interfaces/pedido-repository.interface';
import { PedidoEntity } from '../../database/entities/pedido.entity';
import { ProdutoEntity } from '../../database/entities/produto.entity';
import { PedidoMapper } from '../../pedidos/domain/pedido.mapper';
import { ADMIN_NOTIFICATION_EVENTS, PedidoCanceladoEvent } from '../../notifications/admin-notification.events';
import { buildSuccessResponse } from '../../common/responses/api-response';
import { translateDomainError } from '../../common/utils/translate-domain-error';

@Injectable()
export class CancelarPedidoUseCase {
  constructor(
    @Inject(PEDIDO_REPOSITORY) private readonly pedidoRepository: IPedidoRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(usuarioId: number, idPedido: number) {
    const entity = await this.pedidoRepository.findByIdWithItens(idPedido);
    if (!entity) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Toda a regra (dono do pedido, status cancelável, janela de 2h) está no
    // objeto de domínio `Pedido` — o Use Case só orquestra.
    const pedido = PedidoMapper.toDomain(entity);
    try {
      pedido.garantirQuePertenceAo(usuarioId);
      pedido.cancelar();
    } catch (error) {
      translateDomainError(error);
    }

    const pedidoCancelado = await this.pedidoRepository.runTransaction(async (manager) => {
      const pedidoRepo = manager.getRepository(PedidoEntity);
      const produtoRepo = manager.getRepository(ProdutoEntity);

      await pedidoRepo.update({ id_pedido: idPedido }, { status: pedido.status });

      for (const item of entity.itens_pedido) {
        await produtoRepo.increment({ id_produto: item.id_produto }, 'quantidade', item.quantidade);
      }

      return pedidoRepo.findOne({ where: { id_pedido: idPedido } });
    });

    this.eventEmitter.emit(ADMIN_NOTIFICATION_EVENTS.PEDIDO_CANCELADO, new PedidoCanceladoEvent(idPedido));

    return buildSuccessResponse('Pedido cancelado com sucesso', { pedido: pedidoCancelado });
  }
}
