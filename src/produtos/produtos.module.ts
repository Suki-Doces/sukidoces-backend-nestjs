import { Module } from '@nestjs/common';
import { JwtConfigModule } from '../common/jwt/jwt-config.module';
import { ProdutosController } from './produtos.controller';
import { ProdutosService } from './produtos.service';

@Module({
  imports: [JwtConfigModule],
  controllers: [ProdutosController],
  providers: [ProdutosService],
})
export class ProdutosModule {}
