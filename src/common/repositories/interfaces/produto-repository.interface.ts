import { ProdutoEntity } from '../../../database/entities/produto.entity';

export interface IProdutoRepository {
  findById(id: number): Promise<ProdutoEntity | null>;
  findByIdRaw(id: number): Promise<ProdutoEntity | null>;
  findManyByIds(ids: number[]): Promise<ProdutoEntity[]>;
  findAtivosDestacados(take: number): Promise<ProdutoEntity[]>;
  findAtivosPorIds(ids: number[]): Promise<ProdutoEntity[]>;
  findNovos(sinceDate: Date, take: number): Promise<ProdutoEntity[]>;
  findManyWithOptions(options: {
    where: Record<string, any>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    take?: number;
    skip?: number;
  }): Promise<ProdutoEntity[]>;
  count(where: Record<string, any>): Promise<number>;
  create(data: Record<string, any>): Promise<ProdutoEntity>;
  update(id: number, data: Record<string, any>): Promise<ProdutoEntity | null>;
  incrementarEstoque(id: number, quantidade: number): Promise<unknown>;
  decrementarEstoque(id: number, quantidade: number): Promise<unknown>;
  softDelete(id: number): Promise<void>;
  findSelectFields(ids: number[], select: (keyof ProdutoEntity)[]): Promise<Partial<ProdutoEntity>[]>;
}

export const PRODUTO_REPOSITORY = Symbol('PRODUTO_REPOSITORY');
