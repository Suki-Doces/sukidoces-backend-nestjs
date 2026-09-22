import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CupomEntity } from '../database/entities/cupom.entity';
import { PedidoEntity } from '../database/entities/pedido.entity';
import { ItemPedidoEntity } from '../database/entities/item-pedido.entity';
import { ProdutoEntity } from '../database/entities/produto.entity';
import { IPedidoRepository, PEDIDO_REPOSITORY } from '../common/repositories/interfaces/pedido-repository.interface';
import { IProdutoRepository, PRODUTO_REPOSITORY } from '../common/repositories/interfaces/produto-repository.interface';
import { CheckoutDto } from './dto/checkout.dto';
import {
  ADMIN_NOTIFICATION_EVENTS,
  PedidoCriadoEvent,
  PedidoPagoEvent,
  PedidoStatusAtualizadoEvent,
} from '../notifications/admin-notification.events';
import { buildSuccessResponse } from '../common/responses/api-response';
import { PedidoStatus } from '../common/enums/pedido-status.enum';

@Injectable()
export class PedidosService {
  constructor(
    @Inject(PEDIDO_REPOSITORY) private readonly pedidoRepository: IPedidoRepository,
    @Inject(PRODUTO_REPOSITORY) private readonly produtoRepository: IProdutoRepository,
    @InjectRepository(CupomEntity)
    private readonly cupomRepo: Repository<CupomEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

  async checkout(usuarioId: number, dto: CheckoutDto) {
    const { produtos, metodo_pagamento, codigo_cupom } = dto;

    if (!produtos || produtos.length === 0 || !metodo_pagamento) {
      throw new BadRequestException('Dados obrigatórios ausentes');
    }

    const idsProdutos = produtos.map((item) => item.id_produto);
    const produtosDoBanco = await this.produtoRepository.findManyByIds(idsProdutos);

    for (const itemRequest of produtos) {
      const produtoReal = produtosDoBanco.find((p) => p.id_produto === itemRequest.id_produto);
      if (!produtoReal) {
        throw new NotFoundException(`Produto ID ${itemRequest.id_produto} não encontrado`);
      }
      if ((produtoReal.quantidade ?? 0) < itemRequest.quantidade) {
        throw new BadRequestException(
          `Estoque insuficiente para: ${produtoReal.nome}. Disponível: ${produtoReal.quantidade}`,
        );
      }
    }

    let subtotal = 0;
    const itensParaSalvar: { id_produto: number; quantidade: number; preco_unitario: number }[] = [];

    for (const itemRequest of produtos) {
      const produtoReal = produtosDoBanco.find((p) => p.id_produto === itemRequest.id_produto);
      const preco = Number(produtoReal.preco);
      subtotal += preco * itemRequest.quantidade;
      itensParaSalvar.push({
        id_produto: itemRequest.id_produto,
        quantidade: itemRequest.quantidade,
        preco_unitario: preco,
      });
    }

    let desconto = 0;
    let cupomUsado: CupomEntity | null = null;

    if (codigo_cupom) {
      const cupom = await this.cupomRepo.findOne({ where: { codigo: codigo_cupom.toUpperCase().trim() } });

      if (cupom && cupom.ativo && (!cupom.validade || new Date(cupom.validade) >= new Date())) {
        desconto =
          cupom.tipo === 'percentual'
            ? subtotal * (Number(cupom.valor) / 100)
            : Math.min(Number(cupom.valor), subtotal);
        cupomUsado = cupom;
      }
    }

    const valor_total = Math.max(0, subtotal - desconto);
    const statusInicial =
      metodo_pagamento === 'pix' || metodo_pagamento === 'cartao'
        ? PedidoStatus.PAGO
        : PedidoStatus.PENDENTE;

    try {
      const novoPedido = await this.pedidoRepository.runTransaction(async (manager) => {
        const pedidoRepo = manager.getRepository(PedidoEntity);
        const itemRepo = manager.getRepository(ItemPedidoEntity);
        const produtoRepo = manager.getRepository(ProdutoEntity);

        const pedido = await pedidoRepo.save(
          pedidoRepo.create({
            id_usuario: usuarioId,
            valor_total,
            status: statusInicial,
            metodo_pagamento,
            ...(cupomUsado && { id_cupom: cupomUsado.id_cupom }),
          }),
        );

        await itemRepo.save(
          itensParaSalvar.map((item) =>
            itemRepo.create({
              id_pedido: pedido.id_pedido,
              id_produto: item.id_produto,
              quantidade: item.quantidade,
              preco_unitario: item.preco_unitario,
            }),
          ),
        );

        for (const item of itensParaSalvar) {
          await produtoRepo.decrement({ id_produto: item.id_produto }, 'quantidade', item.quantidade);
        }

        return pedido;
      });

      this.eventEmitter.emit(
        ADMIN_NOTIFICATION_EVENTS.PEDIDO_CRIADO,
        new PedidoCriadoEvent(novoPedido.id_pedido, valor_total),
      );

      return buildSuccessResponse('Pedido realizado com sucesso', { pedido: novoPedido });
    } catch (error) {
      throw new InternalServerErrorException('Erro interno ao processar pedido');
    }
  }

  async pagarNovamente(usuarioId: number, idPedido: number) {
    const pedido = await this.pedidoRepository.findById(idPedido);
    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }
    if (pedido.id_usuario !== usuarioId) {
      throw new ForbiddenException('Você não tem permissão.');
    }
    if (pedido.status !== PedidoStatus.PENDENTE) {
      throw new BadRequestException('Pedido já processado');
    }

    try {
      const pedidoPago = await this.pedidoRepository.updateStatus(idPedido, PedidoStatus.PAGO);

      this.eventEmitter.emit(ADMIN_NOTIFICATION_EVENTS.PEDIDO_PAGO, new PedidoPagoEvent(idPedido));

      return buildSuccessResponse('Pedido pago com sucesso', { pedido: pedidoPago });
    } catch (error) {
      throw new InternalServerErrorException('Erro interno ao processar pagamento');
    }
  }

  async atualizarStatus(idPedido: number, status: string) {
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
