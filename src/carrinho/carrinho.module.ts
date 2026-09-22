import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarrinhoItemEntity } from '../database/entities/carrinho-item.entity';
import { ProdutoEntity } from '../database/entities/produto.entity';
import { JwtConfigModule } from '../common/jwt/jwt-config.module';
import { CarrinhoController } from './carrinho.controller';
import { CarrinhoService } from './carrinho.service';

@Module({
  imports: [JwtConfigModule, TypeOrmModule.forFeature([CarrinhoItemEntity, ProdutoEntity])],
  controllers: [CarrinhoController],
  providers: [CarrinhoService],
})
export class CarrinhoModule {}
