import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Usuario } from '../common/decorators/usuario.decorator';
import { ContatoService } from './contato.service';
import { CreateContatoDto } from './dto/create-contato.dto';
import { UsuarioPayload } from '../common/types/request-with-user.type';

@ApiTags('contatos')
@Controller('contatos')
export class ContatoController {
  constructor(private readonly contatoService: ContatoService) {}

  @Post()
  @HttpCode(201)
  @UseGuards(OptionalAuthGuard)
  criar(@Body() dto: CreateContatoDto, @Usuario() usuario?: UsuarioPayload) {
    return this.contatoService.criar(dto, usuario);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  meuHistorico(@Usuario() usuario: UsuarioPayload) {
    return this.contatoService.meuHistorico(usuario);
  }
}
