import { Module } from '@nestjs/common';
import { JwtConfigModule } from '../common/jwt/jwt-config.module';
import { ProdutosController } from './produtos.controller';
import { ProdutosService } from './produtos.service';
import { CriarProdutoUseCase } from './use-cases/criar-produto.use-case';
import { AtualizarProdutoUseCase } from './use-cases/atualizar-produto.use-case';

@Module({
  imports: [JwtConfigModule],
  controllers: [ProdutosController],
  providers: [ProdutosService, CriarProdutoUseCase, AtualizarProdutoUseCase],
})
export class ProdutosModule {}
