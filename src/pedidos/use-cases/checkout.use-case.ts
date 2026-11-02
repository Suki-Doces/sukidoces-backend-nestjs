import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CupomEntity } from '../../database/entities/cupom.entity';
import { PedidoEntity } from '../../database/entities/pedido.entity';
import { ItemPedidoEntity } from '../../database/entities/item-pedido.entity';
import { ProdutoEntity } from '../../database/entities/produto.entity';
import { IPedidoRepository, PEDIDO_REPOSITORY } from '../../common/repositories/interfaces/pedido-repository.interface';
import { IProdutoRepository, PRODUTO_REPOSITORY } from '../../common/repositories/interfaces/produto-repository.interface';
import { ProdutoMapper } from '../../produtos/domain/produto.mapper';
import { CheckoutDto } from '../dto/checkout.dto';
import { ADMIN_NOTIFICATION_EVENTS, PedidoCriadoEvent } from '../../notifications/admin-notification.events';
import { buildSuccessResponse } from '../../common/responses/api-response';
import { PedidoStatus } from '../../common/enums/pedido-status.enum';
import { translateDomainError } from '../../common/utils/translate-domain-error';

@Injectable()
export class CheckoutUseCase {
  constructor(
    @Inject(PEDIDO_REPOSITORY) private readonly pedidoRepository: IPedidoRepository,
    @Inject(PRODUTO_REPOSITORY) private readonly produtoRepository: IProdutoRepository,
    @InjectRepository(CupomEntity) private readonly cupomRepo: Repository<CupomEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(usuarioId: number, dto: CheckoutDto) {
    const { produtos, metodo_pagamento, codigo_cupom } = dto;

    if (!produtos || produtos.length === 0 || !metodo_pagamento) {
      throw new BadRequestException('Dados obrigatórios ausentes');
    }

    const produtosDoBanco = await this.produtoRepository.findManyByIds(produtos.map((p) => p.id_produto));

    // 1) Regras de estoque e preço vêm do objeto de domínio `Produto` —
    //    o Use Case só orquestra (busca, chama o domínio, soma).
    let subtotal = 0;
    const itensParaSalvar: { id_produto: number; quantidade: number; preco_unitario: number }[] = [];

    for (const itemRequest of produtos) {
      const entity = produtosDoBanco.find((p) => p.id_produto === itemRequest.id_produto);
      if (!entity) {
        throw new NotFoundException(`Produto ID ${itemRequest.id_produto} não encontrado`);
      }

      const produto = ProdutoMapper.toDomain(entity);
      try {
        produto.decrementarEstoque(itemRequest.quantidade); // valida (lança se faltar estoque)
      } catch (error) {
        translateDomainError(error);
      }

      subtotal += produto.calcularSubtotal(itemRequest.quantidade);
      itensParaSalvar.push({
        id_produto: itemRequest.id_produto,
        quantidade: itemRequest.quantidade,
        preco_unitario: produto.preco,
      });
    }

    // 2) Cupom de desconto
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
      metodo_pagamento === 'pix' || metodo_pagamento === 'cartao' ? PedidoStatus.PAGO : PedidoStatus.PENDENTE;

    // 3) Persistência atômica: pedido + itens + baixa de estoque numa transação.
    //    A baixa usa `decrement` (UPDATE ... SET quantidade = quantidade - N),
    //    não "grava o valor calculado pelo domínio" — evita race condition
    //    entre dois checkouts concorrentes.
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
}
