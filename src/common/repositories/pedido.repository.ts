import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PedidoEntity } from '../../database/entities/pedido.entity';
import { ItemPedidoEntity } from '../../database/entities/item-pedido.entity';
import { IPedidoRepository } from './interfaces/pedido-repository.interface';

@Injectable()
export class PedidoRepository implements IPedidoRepository {
  constructor(
    @InjectRepository(PedidoEntity)
    private readonly repo: Repository<PedidoEntity>,
    private readonly dataSource: DataSource,
  ) {}

  findById(id: number) {
    return this.repo.findOne({ where: { id_pedido: id } });
  }

  findByIdWithItens(id: number) {
    return this.repo.findOne({ where: { id_pedido: id }, relations: ['itens_pedido'] });
  }

  findAllAdmin() {
    return this.repo.find({
      order: { data_pedido: 'DESC' },
      relations: ['usuario', 'itens_pedido', 'itens_pedido.produtos'],
    });
  }

  findByUsuario(usuarioId: number) {
    return this.repo.find({
      where: { id_usuario: usuarioId },
      relations: ['itens_pedido', 'itens_pedido.produtos'],
      order: { data_pedido: 'DESC' },
    });
  }

  count(where: Record<string, any> = {}) {
    return this.repo.count({ where });
  }

  async aggregate(args: {
    where: Record<string, any>;
    _sum?: { valor_total: true };
    _count?: boolean;
  }): Promise<{ _sum: { valor_total: number }; _count: number }> {
    const qb = this.repo.createQueryBuilder('pedido');
    this.applyDynamicWhere(qb, args.where);

    const result = await qb
      .select('COALESCE(SUM(pedido.valor_total), 0)', 'sum')
      .addSelect('COUNT(pedido.id_pedido)', 'count')
      .getRawOne();

    return {
      _sum: { valor_total: parseFloat(result.sum) || 0 },
      _count: parseInt(result.count, 10) || 0,
    };
  }

  private applyDynamicWhere(
    qb: ReturnType<Repository<PedidoEntity>['createQueryBuilder']>,
    where: Record<string, any>,
  ) {
    let first = true;
    const cond = (sql: string, params: Record<string, any>) => {
      if (first) {
        qb.where(sql, params);
        first = false;
      } else {
        qb.andWhere(sql, params);
      }
    };

    if (where.status?.in) {
      cond('pedido.status IN (:...status)', { status: where.status.in });
    } else if (typeof where.status === 'string') {
      cond('pedido.status = :status', { status: where.status });
    }

    if (where.data_pedido?.gte && where.data_pedido?.lt) {
      cond('pedido.data_pedido >= :gte AND pedido.data_pedido < :lt', {
        gte: where.data_pedido.gte,
        lt: where.data_pedido.lt,
      });
    } else if (where.data_pedido?.gte) {
      cond('pedido.data_pedido >= :gte', { gte: where.data_pedido.gte });
    }

    if (first) qb.where('1 = 1');
  }

  findRecentes(take: number) {
    return this.repo.find({
      take,
      order: { data_pedido: 'DESC' },
      relations: ['usuario'],
    });
  }

  async groupByProdutoMaisVendido(take: number): Promise<{ id_produto: number; _sum: { quantidade: number } }[]> {
    const rows = await this.dataSource
      .getRepository(ItemPedidoEntity)
      .createQueryBuilder('item')
      .select('item.id_produto', 'id_produto')
      .addSelect('SUM(item.quantidade)', 'total')
      .groupBy('item.id_produto')
      .orderBy('total', 'DESC')
      .limit(take)
      .getRawMany();

    return rows.map((r) => ({
      id_produto: Number(r.id_produto),
      _sum: { quantidade: Number(r.total) },
    }));
  }

  async updateStatus(id: number, status: string) {
    await this.repo.update({ id_pedido: id }, { status });
    return this.findById(id);
  }

  runTransaction<T>(fn: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(fn);
  }
}
