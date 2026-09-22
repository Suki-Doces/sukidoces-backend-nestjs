import { Inject, Injectable } from '@nestjs/common';
import { IPedidoRepository, PEDIDO_REPOSITORY } from '../common/repositories/interfaces/pedido-repository.interface';
import { IProdutoRepository, PRODUTO_REPOSITORY } from '../common/repositories/interfaces/produto-repository.interface';
import { STATUS_QUE_CONTAM_COMO_VENDA } from '../common/enums/pedido-status.enum';
import { buildSuccessResponse } from '../common/responses/api-response';

@Injectable()
export class AdminService {
  constructor(
    @Inject(PEDIDO_REPOSITORY) private readonly pedidoRepository: IPedidoRepository,
    @Inject(PRODUTO_REPOSITORY) private readonly produtoRepository: IProdutoRepository,
  ) {}

  async dashboard() {
    const totalPedidos = await this.pedidoRepository.count();
    const pendentes = await this.pedidoRepository.count({ status: 'pendente' });
    const cancelados = await this.pedidoRepository.count({ status: 'cancelado' });

    const vendasAggregate = await this.pedidoRepository.aggregate({
      _sum: { valor_total: true },
      where: { status: { in: STATUS_QUE_CONTAM_COMO_VENDA } },
    });

    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - 7);
    const inicioSemanaPassada = new Date(hoje);
    inicioSemanaPassada.setDate(hoje.getDate() - 14);

    const vendasSemana = await this.pedidoRepository.aggregate({
      _sum: { valor_total: true },
      _count: true,
      where: { data_pedido: { gte: inicioSemana }, status: { in: STATUS_QUE_CONTAM_COMO_VENDA } },
    });

    const vendasSemanaPassada = await this.pedidoRepository.aggregate({
      _sum: { valor_total: true },
      _count: true,
      where: {
        data_pedido: { gte: inicioSemanaPassada, lt: inicioSemana },
        status: { in: STATUS_QUE_CONTAM_COMO_VENDA },
      },
    });

    const topProdutosGroupBy = await this.pedidoRepository.groupByProdutoMaisVendido(5);
    const idsProdutos = topProdutosGroupBy.map((p) => p.id_produto);

    const produtosDetalhes = await this.produtoRepository.findSelectFields(idsProdutos, [
      'id_produto',
      'nome',
      'preco',
      'imagem',
      'quantidade',
    ]);

    const produtosDestaque = topProdutosGroupBy.map((item) => {
      const produto = produtosDetalhes.find((p) => p.id_produto === item.id_produto);
      return {
        id_produto: item.id_produto,
        nome: produto?.nome || 'Produto',
        vendas: item._sum.quantidade || 0,
        preco: Number(produto?.preco || 0),
        imagem: produto?.imagem,
        status: (produto?.quantidade ?? 0) > 0 ? 'Em Estoque' : 'Sem Estoque',
        corStatus: (produto?.quantidade ?? 0) > 0 ? '#21c45d' : '#ef4343',
      };
    });

    const transacoesRecentes = await this.pedidoRepository.findRecentes(10);

    const valorSemana = Number(vendasSemana._sum.valor_total || 0);
    const valorPassada = Number(vendasSemanaPassada._sum.valor_total || 0);
    const aumentoVendas =
      valorPassada > 0 ? Number((((valorSemana - valorPassada) / valorPassada) * 100).toFixed(1)) : 0;

    const pedidosSemana = vendasSemana._count || 0;
    const pedidosPassada = vendasSemanaPassada._count || 0;
    const aumentoPedidos =
      pedidosPassada > 0
        ? Number((((pedidosSemana - pedidosPassada) / pedidosPassada) * 100).toFixed(1))
        : 0;

    return buildSuccessResponse('Dashboard carregado com sucesso', {
      resumo: {
        vendasSemana: valorSemana,
        aumentoVendas,
        vendasPassada: valorPassada,
        pedidosSemana,
        aumentoPedidos,
        pedidosPassada,
        pendentes,
        cancelados,
        totalVendas: Number(vendasAggregate._sum.valor_total || 0),
        totalPedidos,
      },
      produtosDestaque,
      transacoes: transacoesRecentes.map((p) => ({
        id_pedido: p.id_pedido,
        cliente_nome: p.usuario?.nome || `#${p.id_pedido}`,
        data_pedido: p.data_pedido,
        status: p.status,
        valor_total: Number(p.valor_total),
      })),
    });
  }
}
