import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarrinhoItemEntity } from '../database/entities/carrinho-item.entity';
import { JwtConfigModule } from '../common/jwt/jwt-config.module';
import { CarrinhoController } from './carrinho.controller';
import { CarrinhoService } from './carrinho.service';
import { AdicionarAoCarrinhoUseCase } from './use-cases/adicionar-ao-carrinho.use-case';

@Module({
  imports: [JwtConfigModule, TypeOrmModule.forFeature([CarrinhoItemEntity])],
  controllers: [CarrinhoController],
  providers: [CarrinhoService, AdicionarAoCarrinhoUseCase],
})
export class CarrinhoModule {}
