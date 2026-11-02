import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
import { CancelarPedidoUseCase } from './use-cases/cancelar-pedido.use-case';

@Module({
  imports: [AuthModule],
  controllers: [UsuarioController],
  providers: [UsuarioService, CancelarPedidoUseCase],
})
export class UsuarioModule {}
