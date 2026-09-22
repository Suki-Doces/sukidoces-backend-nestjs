import { Module } from '@nestjs/common';
import { JwtConfigModule } from '../common/jwt/jwt-config.module';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';

@Module({
  imports: [JwtConfigModule],
  controllers: [ClientesController],
  providers: [ClientesService],
})
export class ClientesModule {}
