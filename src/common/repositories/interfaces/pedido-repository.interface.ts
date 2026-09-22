import { EntityManager } from 'typeorm';
import { PedidoEntity } from '../../../database/entities/pedido.entity';

export interface IPedidoRepository {
  findById(id: number): Promise<PedidoEntity | null>;
  findByIdWithItens(id: number): Promise<PedidoEntity | null>;
  findAllAdmin(): Promise<PedidoEntity[]>;
  findByUsuario(usuarioId: number): Promise<PedidoEntity[]>;
  count(where?: Record<string, any>): Promise<number>;
  aggregate(args: {
    where: Record<string, any>;
    _sum?: { valor_total: true };
    _count?: boolean;
  }): Promise<{ _sum: { valor_total: number }; _count: number }>;
  findRecentes(take: number): Promise<PedidoEntity[]>;
  groupByProdutoMaisVendido(
    take: number,
  ): Promise<{ id_produto: number; _sum: { quantidade: number } }[]>;
  updateStatus(id: number, status: string): Promise<PedidoEntity | null>;
  runTransaction<T>(fn: (manager: EntityManager) => Promise<T>): Promise<T>;
}

export const PEDIDO_REPOSITORY = Symbol('PEDIDO_REPOSITORY');
