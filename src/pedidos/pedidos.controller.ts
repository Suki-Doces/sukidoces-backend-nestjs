import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { Usuario } from '../common/decorators/usuario.decorator';
import { PedidosService } from './pedidos.service';
import { CheckoutDto } from './dto/checkout.dto';

@ApiTags('pedidos')
@Controller(['pedidos', 'admin/pedidos'])
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get()
  @UseGuards(AdminGuard)
  listarTodos() {
    return this.pedidosService.listarTodos();
  }

  @Post()
  @HttpCode(201)
  checkout(@Usuario('id') usuarioId: number, @Body() dto: CheckoutDto) {
    return this.pedidosService.checkout(usuarioId, dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':id/pagar')
  pagarNovamente(@Usuario('id') usuarioId: number, @Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.pagarNovamente(usuarioId, id);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  atualizarStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.pedidosService.atualizarStatus(id, status);
  }
}
