import { PedidoEntity } from '../../database/entities/pedido.entity';
import { Pedido } from './pedido.domain';

export class PedidoMapper {
  static toDomain(entity: PedidoEntity): Pedido {
    return new Pedido(entity.id_pedido, entity.id_usuario, entity.status, new Date(entity.data_pedido));
  }
}
