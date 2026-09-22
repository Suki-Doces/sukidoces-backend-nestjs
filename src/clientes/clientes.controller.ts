import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@ApiTags('clientes')
@Controller('admin/clientes')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  listar(@Query() query: Record<string, any>) {
    return this.clientesService.listar(query);
  }

  @Get('estatisticas/novos')
  estatisticasNovos() {
    return this.clientesService.estatisticasNovos();
  }

  @Post()
  criar(@Body() dto: CreateClienteDto) {
    return this.clientesService.criar(dto);
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: UpdateClienteDto) {
    return this.clientesService.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.clientesService.remover(id);
  }
}
