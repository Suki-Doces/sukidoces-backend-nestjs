import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { ProdutoEntity } from '../../database/entities/produto.entity';
import { IProdutoRepository } from './interfaces/produto-repository.interface';

@Injectable()
export class ProdutoRepository implements IProdutoRepository {
  constructor(
    @InjectRepository(ProdutoEntity)
    private readonly repo: Repository<ProdutoEntity>,
  ) {}

  findById(id: number) {
    return this.repo.findOne({ where: { id_produto: id }, relations: ['categorias'] });
  }

  findByIdRaw(id: number) {
    return this.repo.findOne({ where: { id_produto: id } });
  }

  findManyByIds(ids: number[]) {
    return this.repo.find({ where: { id_produto: In(ids) } });
  }

  findAtivosDestacados(take: number) {
    return this.repo.find({
      where: { ativo: true },
      take,
      order: { id_produto: 'DESC' },
      relations: ['categorias'],
    });
  }

  findAtivosPorIds(ids: number[]) {
    return this.repo.find({
      where: { id_produto: In(ids), ativo: true },
      relations: ['categorias'],
    });
  }

  findNovos(sinceDate: Date, take: number) {
    return this.repo
      .createQueryBuilder('produto')
      .leftJoinAndSelect('produto.categorias', 'categorias')
      .where('produto.ativo = :ativo', { ativo: true })
      .andWhere('produto.data_criacao >= :sinceDate', { sinceDate })
      .orderBy('produto.data_criacao', 'DESC')
      .take(take)
      .getMany();
  }

  findManyWithOptions(options: {
    where: Record<string, any>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    take?: number;
    skip?: number;
  }) {
    const qb = this.repo.createQueryBuilder('produto').leftJoinAndSelect('produto.categorias', 'categorias');
    this.applyDynamicWhere(qb, options.where);

    if (options.orderBy) {
      const [field, dir] = Object.entries(options.orderBy)[0];
      qb.orderBy(`produto.${field}`, dir.toUpperCase() as 'ASC' | 'DESC');
    }
    if (options.take !== undefined) qb.take(options.take);
    if (options.skip !== undefined) qb.skip(options.skip);

    return qb.getMany();
  }

  count(where: Record<string, any>) {
    const qb = this.repo.createQueryBuilder('produto');
    this.applyDynamicWhere(qb, where);
    return qb.getCount();
  }

  private applyDynamicWhere(qb: ReturnType<Repository<ProdutoEntity>['createQueryBuilder']>, where: Record<string, any>) {
    qb.where('produto.ativo = :ativo', { ativo: where.ativo ?? true });

    if (where.id_categoria !== undefined) {
      qb.andWhere('produto.id_categoria = :idCategoria', { idCategoria: where.id_categoria });
    }
    if (where.nome?.contains !== undefined) {
      qb.andWhere('produto.nome LIKE :nome', { nome: `%${where.nome.contains}%` });
    }
    if (where.preco?.gte !== undefined) {
      qb.andWhere('produto.preco >= :precoMin', { precoMin: where.preco.gte });
    }
    if (where.preco?.lte !== undefined) {
      qb.andWhere('produto.preco <= :precoMax', { precoMax: where.preco.lte });
    }
  }

  create(data: Record<string, any>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Record<string, any>) {
    await this.repo.update({ id_produto: id }, data);
    return this.findByIdRaw(id);
  }

  incrementarEstoque(id: number, quantidade: number) {
    return this.repo.increment({ id_produto: id }, 'quantidade', quantidade);
  }

  decrementarEstoque(id: number, quantidade: number) {
    return this.repo.decrement({ id_produto: id }, 'quantidade', quantidade);
  }

  async softDelete(id: number) {
    await this.repo.update({ id_produto: id }, { ativo: false });
  }

  findSelectFields(ids: number[], select: (keyof ProdutoEntity)[]) {
    return this.repo.find({ where: { id_produto: In(ids) } as FindOptionsWhere<ProdutoEntity>, select });
  }
}
