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
import { CheckoutUseCase } from './use-cases/checkout.use-case';
import { PagarNovamenteUseCase } from './use-cases/pagar-novamente.use-case';
import { AtualizarStatusUseCase } from './use-cases/atualizar-status.use-case';
import { CheckoutDto } from './dto/checkout.dto';

@ApiTags('pedidos')
@Controller(['pedidos', 'admin/pedidos'])
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(
    private readonly pedidosService: PedidosService,
    private readonly checkoutUseCase: CheckoutUseCase,
    private readonly pagarNovamenteUseCase: PagarNovamenteUseCase,
    private readonly atualizarStatusUseCase: AtualizarStatusUseCase,
  ) {}

  @Get()
  @UseGuards(AdminGuard)
  listarTodos() {
    return this.pedidosService.listarTodos();
  }

  @Post()
  @HttpCode(201)
  checkout(@Usuario('id') usuarioId: number, @Body() dto: CheckoutDto) {
    return this.checkoutUseCase.execute(usuarioId, dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':id/pagar')
  pagarNovamente(@Usuario('id') usuarioId: number, @Param('id', ParseIntPipe) id: number) {
    return this.pagarNovamenteUseCase.execute(usuarioId, id);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  atualizarStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.atualizarStatusUseCase.execute(id, status);
  }
}
