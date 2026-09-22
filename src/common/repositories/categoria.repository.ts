import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaEntity } from '../../database/entities/categoria.entity';
import { ICategoriaRepository } from './interfaces/categoria-repository.interface';

@Injectable()
export class CategoriaRepository implements ICategoriaRepository {
  constructor(
    @InjectRepository(CategoriaEntity)
    private readonly repo: Repository<CategoriaEntity>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id_categoria: 'DESC' } });
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id_categoria: id } });
  }

  findAllPublic() {
    return this.repo.find({
      select: ['id_categoria', 'nome', 'descricao'],
      order: { nome: 'ASC' },
    });
  }

  create(data: { nome: string; descricao?: string }) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Record<string, any>) {
    await this.repo.update({ id_categoria: id }, data);
    return this.findById(id);
  }

  async delete(id: number) {
    await this.repo.delete({ id_categoria: id });
  }
}
