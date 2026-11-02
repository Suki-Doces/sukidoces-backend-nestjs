import { Inject, Injectable } from '@nestjs/common';
import { IPedidoRepository, PEDIDO_REPOSITORY } from '../common/repositories/interfaces/pedido-repository.interface';
import { buildSuccessResponse } from '../common/responses/api-response';

// As ações com regra de negócio (checkout, pagar, atualizar status) viraram
// Use Cases em ./use-cases. Aqui ficou só a consulta administrativa, que é
// leitura + formatação, sem regra de negócio a isolar.
@Injectable()
export class PedidosService {
  constructor(@Inject(PEDIDO_REPOSITORY) private readonly pedidoRepository: IPedidoRepository) {}

  async listarTodos() {
    const pedidos = await this.pedidoRepository.findAllAdmin();

    const payload = pedidos.map((p) => ({
      id_pedido: p.id_pedido,
      cliente_nome: p.usuario?.nome || 'Cliente',
      cliente_email: p.usuario?.email || '',
      data_pedido: p.data_pedido,
      status: p.status,
      valor_total: Number(p.valor_total),
      metodo_pagamento: p.metodo_pagamento,
      itens: p.itens_pedido.map((i) => ({
        nome: i.produtos?.nome,
        quantidade: i.quantidade,
        imagem: i.produtos?.imagem,
      })),
    }));

    return buildSuccessResponse('Pedidos carregados com sucesso', payload);
  }
}
