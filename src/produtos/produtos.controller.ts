import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { multerOptions } from '../common/upload/multer.config';
import { ProdutosService } from './produtos.service';

@ApiTags('produtos')
@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Get('categorias')
  listarCategorias() {
    return this.produtosService.listarCategorias();
  }

  @Get('mais-vendidos')
  maisVendidos() {
    return this.produtosService.maisVendidos();
  }

  @Get('novos')
  novos() {
    return this.produtosService.novos();
  }

  @Get()
  listar(@Query() query: Record<string, any>) {
    return this.produtosService.listar(query);
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.buscarPorId(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('imagem', multerOptions))
  criar(@Body() body: any, @UploadedFile() file?: Express.Multer.File) {
    return this.produtosService.criar(body, file);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('imagem', multerOptions))
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.produtosService.atualizar(id, body, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.remover(id);
  }
}
