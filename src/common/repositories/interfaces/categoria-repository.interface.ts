import { CategoriaEntity } from '../../../database/entities/categoria.entity';

export interface ICategoriaRepository {
  findAll(): Promise<CategoriaEntity[]>;
  findById(id: number): Promise<CategoriaEntity | null>;
  findAllPublic(): Promise<Partial<CategoriaEntity>[]>;
  create(data: { nome: string; descricao?: string }): Promise<CategoriaEntity>;
  update(id: number, data: Record<string, any>): Promise<CategoriaEntity | null>;
  delete(id: number): Promise<void>;
}

export const CATEGORIA_REPOSITORY = Symbol('CATEGORIA_REPOSITORY');
