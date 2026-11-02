import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarrinhoItemEntity } from '../../database/entities/carrinho-item.entity';
import { IProdutoRepository, PRODUTO_REPOSITORY } from '../../common/repositories/interfaces/produto-repository.interface';
import { ProdutoMapper } from '../../produtos/domain/produto.mapper';
import { AddCarrinhoItemDto } from '../dto/add-carrinho-item.dto';
import { AppError } from '../../common/errors/app-error';
import { buildSuccessResponse } from '../../common/responses/api-response';

@Injectable()
export class AdicionarAoCarrinhoUseCase {
  constructor(
    @InjectRepository(CarrinhoItemEntity) private readonly carrinhoRepo: Repository<CarrinhoItemEntity>,
    @Inject(PRODUTO_REPOSITORY) private readonly produtoRepository: IProdutoRepository,
  ) {}

  async execute(idUsuario: number, dto: AddCarrinhoItemDto) {
    const idProduto = dto.id_produto || dto.produto_id;
    const quantidade = dto.quantidade;

    if (!idProduto || !quantidade || quantidade < 1) {
      throw new AppError('Produto ou quantidade inválida', 400);
    }

    const entity = await this.produtoRepository.findByIdRaw(Number(idProduto));
    if (!entity) throw new AppError('Produto não encontrado', 404);

    // A regra "tem estoque para essa quantidade?" vem do domínio `Produto`.
    const produto = ProdutoMapper.toDomain(entity);
    if (!produto.temEstoqueSuficiente(Number(quantidade))) {
      throw new AppError('Estoque insuficiente', 400);
    }

    const existingItem = await this.carrinhoRepo.findOne({
      where: { usuario_id: idUsuario, id_produto: Number(idProduto) },
    });

    if (existingItem) {
      const novaQuantidade = existingItem.quantidade + Number(quantidade);
      if (!produto.temEstoqueSuficiente(novaQuantidade)) {
        throw new AppError('Estoque insuficiente para a quantidade total', 400);
      }
      await this.carrinhoRepo.update({ id: existingItem.id }, { quantidade: novaQuantidade });
    } else {
      await this.carrinhoRepo.save(
        this.carrinhoRepo.create({
          usuario_id: idUsuario,
          id_produto: Number(idProduto),
          quantidade: Number(quantidade),
        }),
      );
    }

    return buildSuccessResponse('Produto adicionado ao carrinho');
  }
}
