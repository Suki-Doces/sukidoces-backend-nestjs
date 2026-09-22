import { Controller, Delete, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Usuario } from '../common/decorators/usuario.decorator';
import { NotificacoesService } from './notificacoes.service';

@ApiTags('notificacoes')
@Controller('admin/notificacoes')
@UseGuards(JwtAuthGuard)
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Get()
  listar(@Usuario('id') usuarioId: number, @Query() query: Record<string, any>) {
    return this.notificacoesService.listar(usuarioId, query);
  }

  @Put(':id/read')
  marcarLida(@Usuario('id') usuarioId: number, @Param('id') id: string) {
    return this.notificacoesService.marcarLida(usuarioId, id);
  }

  @Put('read-all')
  marcarTodasLidas(@Usuario('id') usuarioId: number) {
    return this.notificacoesService.marcarTodasLidas(usuarioId);
  }

  @Delete(':id')
  remover(@Usuario('id') usuarioId: number, @Param('id') id: string) {
    return this.notificacoesService.remover(usuarioId, id);
  }
}
