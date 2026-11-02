import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IPedidoRepository, PEDIDO_REPOSITORY } from '../../common/repositories/interfaces/pedido-repository.interface';
import { IProdutoRepository, PRODUTO_REPOSITORY } from '../../common/repositories/interfaces/produto-repository.interface';
import { ADMIN_NOTIFICATION_EVENTS, PedidoStatusAtualizadoEvent } from '../../notifications/admin-notification.events';
import { buildSuccessResponse } from '../../common/responses/api-response';
import { PedidoStatus } from '../../common/enums/pedido-status.enum';

// Ação administrativa: o admin pode mover o pedido para qualquer status
// (inclusive reabrir um cancelado), ajustando o estoque em conformidade.
@Injectable()
export class AtualizarStatusUseCase {
  constructor(
    @Inject(PEDIDO_REPOSITORY) private readonly pedidoRepository: IPedidoRepository,
    @Inject(PRODUTO_REPOSITORY) private readonly produtoRepository: IProdutoRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(idPedido: number, status: string) {
    const pedido = await this.pedidoRepository.findByIdWithItens(idPedido);
    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    try {
      if (status === PedidoStatus.CANCELADO && pedido.status !== PedidoStatus.CANCELADO) {
        for (const item of pedido.itens_pedido) {
          await this.produtoRepository.incrementarEstoque(item.id_produto, item.quantidade);
        }
      } else if (pedido.status === PedidoStatus.CANCELADO && status !== PedidoStatus.CANCELADO) {
        for (const item of pedido.itens_pedido) {
          await this.produtoRepository.decrementarEstoque(item.id_produto, item.quantidade);
        }
      }

      const pedidoAtualizado = await this.pedidoRepository.updateStatus(idPedido, status);

      this.eventEmitter.emit(
        ADMIN_NOTIFICATION_EVENTS.PEDIDO_STATUS_ATUALIZADO,
        new PedidoStatusAtualizadoEvent(idPedido, status),
      );

      return buildSuccessResponse(`Status atualizado para ${status}`, { pedido: pedidoAtualizado });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao atualizar pedido no banco');
    }
  }
}
