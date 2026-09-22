import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ICategoriaRepository, CATEGORIA_REPOSITORY } from '../common/repositories/interfaces/categoria-repository.interface';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { buildSuccessResponse } from '../common/responses/api-response';

@Injectable()
export class CategoriasService {
  constructor(@Inject(CATEGORIA_REPOSITORY) private readonly categoriaRepository: ICategoriaRepository) {}

  async findAll() {
    try {
      const categorias = await this.categoriaRepository.findAll();
      return buildSuccessResponse('Categorias carregadas com sucesso', categorias);
    } catch (error) {
      throw new InternalServerErrorException('Erro interno ao buscar categorias.');
    }
  }

  async create(dto: CreateCategoriaDto) {
    try {
      const categoria = await this.categoriaRepository.create(dto);
      return buildSuccessResponse('Categoria criada com sucesso', categoria);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao criar a categoria.');
    }
  }

  async update(id: number, dto: UpdateCategoriaDto) {
    const categoriaExistente = await this.categoriaRepository.findById(id);
    if (!categoriaExistente) {
      throw new NotFoundException('Categoria não encontrada');
    }

    try {
      const categoria = await this.categoriaRepository.update(id, dto);
      return buildSuccessResponse('Categoria atualizada com sucesso', categoria);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao atualizar a categoria.');
    }
  }

  async remove(id: number) {
    try {
      await this.categoriaRepository.delete(id);
      return buildSuccessResponse('Categoria deletada com sucesso');
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao deletar a categoria. Ela pode estar vinculada a produtos.',
      );
    }
  }
}
