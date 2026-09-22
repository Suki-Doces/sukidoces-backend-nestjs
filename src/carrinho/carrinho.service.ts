import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarrinhoItemEntity } from '../database/entities/carrinho-item.entity';
import { ProdutoEntity } from '../database/entities/produto.entity';
import { AppError } from '../common/errors/app-error';
import { buildSuccessResponse } from '../common/responses/api-response';
import { AddCarrinhoItemDto } from './dto/add-carrinho-item.dto';

@Injectable()
export class CarrinhoService {
  constructor(
    @InjectRepository(CarrinhoItemEntity)
    private readonly carrinhoRepo: Repository<CarrinhoItemEntity>,
    @InjectRepository(ProdutoEntity)
    private readonly produtoRepo: Repository<ProdutoEntity>,
  ) {}

  async listar(idUsuario: number) {
    const cartItems = await this.carrinhoRepo.find({
      where: { usuario_id: idUsuario },
      order: { data_adicionado: 'DESC' },
      relations: ['produto'],
    });

    const itemsComTotal = cartItems.map((item) => ({
      ...item,
      total: Number(item.produto.preco) * item.quantidade,
    }));

    const subtotal = itemsComTotal.reduce((sum, item) => sum + item.total, 0);
    const frete = subtotal >= 50 ? 0 : 8.9;
    const total = subtotal + frete;

    return buildSuccessResponse('Carrinho carregado com sucesso', {
      cartItems: itemsComTotal,
      subtotal,
      frete,
      total,
      freteGratis: subtotal >= 50,
      itemCount: cartItems.length,
    });
  }

  async adicionar(idUsuario: number, dto: AddCarrinhoItemDto) {
    const id_produto = dto.id_produto || dto.produto_id;
    const quantidade = dto.quantidade;

    if (!id_produto || !quantidade || quantidade < 1) {
      throw new AppError('Produto ou quantidade inválida', 400);
    }

    const product = await this.produtoRepo.findOne({ where: { id_produto: Number(id_produto) } });
    if (!product) throw new AppError('Produto não encontrado', 404);

    if ((product.quantidade ?? 0) < Number(quantidade)) {
      throw new AppError('Estoque insuficiente', 400);
    }

    const existingItem = await this.carrinhoRepo.findOne({
      where: { usuario_id: idUsuario, id_produto: Number(id_produto) },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantidade + Number(quantidade);
      if ((product.quantidade ?? 0) < newQuantity) {
        throw new AppError('Estoque insuficiente para a quantidade total', 400);
      }
      await this.carrinhoRepo.update({ id: existingItem.id }, { quantidade: newQuantity });
    } else {
      await this.carrinhoRepo.save(
        this.carrinhoRepo.create({
          usuario_id: idUsuario,
          id_produto: Number(id_produto),
          quantidade: Number(quantidade),
        }),
      );
    }

    return buildSuccessResponse('Produto adicionado ao carrinho');
  }

  async atualizarQuantidade(idUsuario: number, itemId: string, quantidade: number) {
    if (!quantidade || quantidade < 1) {
      throw new AppError('Quantidade inválida', 400);
    }

    const cartItem = await this.carrinhoRepo.findOne({
      where: { id: Number(itemId) },
      relations: ['produto'],
    });

    if (!cartItem || cartItem.usuario_id !== idUsuario) {
      throw new AppError('Não autorizado ou item não encontrado', 403);
    }

    if ((cartItem.produto?.quantidade ?? 0) < Number(quantidade)) {
      throw new AppError('Estoque insuficiente', 400);
    }

    await this.carrinhoRepo.update({ id: Number(itemId) }, { quantidade: Number(quantidade) });
    return buildSuccessResponse('Quantidade atualizada');
  }

  async remover(idUsuario: number, itemId: string) {
    const cartItem = await this.carrinhoRepo.findOne({ where: { id: Number(itemId) } });

    if (!cartItem || cartItem.usuario_id !== idUsuario) {
      throw new AppError('Não autorizado ou item não encontrado', 403);
    }

    await this.carrinhoRepo.delete({ id: Number(itemId) });
    return buildSuccessResponse('Item removido do carrinho');
  }

  async limpar(idUsuario: number) {
    await this.carrinhoRepo.delete({ usuario_id: idUsuario });
    return buildSuccessResponse('Carrinho esvaziado com sucesso');
  }
}
