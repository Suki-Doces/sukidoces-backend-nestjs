import { Module } from '@nestjs/common';
import { JwtConfigModule } from '../common/jwt/jwt-config.module';
import { CategoriasController } from './categorias.controller';
import { CategoriasService } from './categorias.service';

@Module({
  imports: [JwtConfigModule],
  controllers: [CategoriasController],
  providers: [CategoriasService],
})
export class CategoriasModule {}
