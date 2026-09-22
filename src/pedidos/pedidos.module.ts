import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CupomEntity } from '../database/entities/cupom.entity';
import { JwtConfigModule } from '../common/jwt/jwt-config.module';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';

@Module({
  imports: [JwtConfigModule, TypeOrmModule.forFeature([CupomEntity])],
  controllers: [PedidosController],
  providers: [PedidosService],
})
export class PedidosModule {}
