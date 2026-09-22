import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Usuario } from '../common/decorators/usuario.decorator';
import { CarrinhoService } from './carrinho.service';
import { AddCarrinhoItemDto } from './dto/add-carrinho-item.dto';
import { UpdateCarrinhoItemDto } from './dto/update-carrinho-item.dto';

@ApiTags('carrinho')
@Controller('carrinho')
@UseGuards(JwtAuthGuard)
export class CarrinhoController {
  constructor(private readonly carrinhoService: CarrinhoService) {}

  @Get()
  listar(@Usuario('id') usuarioId: number) {
    return this.carrinhoService.listar(usuarioId);
  }

  @Post('add')
  adicionar(@Usuario('id') usuarioId: number, @Body() dto: AddCarrinhoItemDto) {
    return this.carrinhoService.adicionar(usuarioId, dto);
  }

  @Put(':itemId')
  atualizar(
    @Usuario('id') usuarioId: number,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCarrinhoItemDto,
  ) {
    return this.carrinhoService.atualizarQuantidade(usuarioId, itemId, dto.quantidade);
  }

  @Delete(':itemId')
  remover(@Usuario('id') usuarioId: number, @Param('itemId') itemId: string) {
    return this.carrinhoService.remover(usuarioId, itemId);
  }

  @Delete()
  limpar(@Usuario('id') usuarioId: number) {
    return this.carrinhoService.limpar(usuarioId);
  }
}
