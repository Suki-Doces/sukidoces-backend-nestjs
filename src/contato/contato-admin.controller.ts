import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ContatoService } from './contato.service';
import { RespondContatoDto } from './dto/respond-contato.dto';

@ApiTags('admin-contatos')
@Controller('admin/contatos')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ContatoAdminController {
  constructor(private readonly contatoService: ContatoService) {}

  @Get()
  listar() {
    return this.contatoService.listarAdmin();
  }

  @Put(':id/respond')
  responder(@Param('id') id: string, @Body() dto: RespondContatoDto) {
    return this.contatoService.responder(id, dto.resposta);
  }
}
