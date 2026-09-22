import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Usuario } from '../common/decorators/usuario.decorator';
import { multerOptions } from '../common/upload/multer.config';
import { AuthService } from '../auth/auth.service';
import { UsuarioService } from './usuario.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { LoginDto } from '../auth/dto/login.dto';
import { ChangeSenhaDto } from './dto/change-senha.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { RefreshTokenDto } from '../auth/dto/refresh-token.dto';

@ApiTags('usuario')
@Controller('usuario')
export class UsuarioController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuarioService: UsuarioService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('registro')
  @HttpCode(201)
  @ApiOperation({ summary: 'Cria uma nova conta de cliente' })
  registro(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login unificado (cliente ou admin)' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Troca um refresh token válido por um novo par access+refresh' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Get('verificar-email')
  @ApiOperation({ summary: 'Confirma o e-mail a partir do token enviado por link' })
  verificarEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  logout() {
    return { success: true, message: 'Logout realizado com sucesso' };
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o perfil do usuário autenticado' })
  getPerfil(@Usuario('id') usuarioId: number) {
    return this.usuarioService.getPerfil(usuarioId);
  }

  @Put('perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('foto_perfil', multerOptions))
  @ApiOperation({ summary: 'Atualiza dados do perfil (multipart, aceita foto_perfil)' })
  updatePerfil(
    @Usuario('id') usuarioId: number,
    @Body() dto: UpdatePerfilDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usuarioService.updatePerfil(usuarioId, dto, file);
  }

  @Put('senha')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Altera a senha do usuário autenticado' })
  changeSenha(@Usuario('id') usuarioId: number, @Body() dto: ChangeSenhaDto) {
    return this.usuarioService.changeSenha(usuarioId, dto);
  }

  @Get('pedidos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista os pedidos do usuário autenticado' })
  getMeusPedidos(@Usuario('id') usuarioId: number) {
    return this.usuarioService.getMeusPedidos(usuarioId);
  }

  @Patch('pedidos/:id/cancelar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancela um pedido dentro da janela de 2 horas' })
  cancelarPedido(@Usuario('id') usuarioId: number, @Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.cancelarPedido(usuarioId, id);
  }
}
