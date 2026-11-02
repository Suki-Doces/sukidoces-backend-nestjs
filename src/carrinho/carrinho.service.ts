import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarrinhoItemEntity } from '../database/entities/carrinho-item.entity';
import { AppError } from '../common/errors/app-error';
import { buildSuccessResponse } from '../common/responses/api-response';

// "Adicionar ao carrinho" (com regra de estoque) virou o
// AdicionarAoCarrinhoUseCase. Aqui ficaram leitura e manutenção simples.
@Injectable()
export class CarrinhoService {
  constructor(
    @InjectRepository(CarrinhoItemEntity)
    private readonly carrinhoRepo: Repository<CarrinhoItemEntity>,
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
