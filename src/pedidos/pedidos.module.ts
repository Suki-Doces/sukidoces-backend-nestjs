import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CupomEntity } from '../database/entities/cupom.entity';
import { JwtConfigModule } from '../common/jwt/jwt-config.module';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { CheckoutUseCase } from './use-cases/checkout.use-case';
import { PagarNovamenteUseCase } from './use-cases/pagar-novamente.use-case';
import { AtualizarStatusUseCase } from './use-cases/atualizar-status.use-case';

@Module({
  imports: [JwtConfigModule, TypeOrmModule.forFeature([CupomEntity])],
  controllers: [PedidosController],
  providers: [PedidosService, CheckoutUseCase, PagarNovamenteUseCase, AtualizarStatusUseCase],
})
export class PedidosModule {}
