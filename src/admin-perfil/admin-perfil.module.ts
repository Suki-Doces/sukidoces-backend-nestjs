import { Module } from '@nestjs/common';
import { JwtConfigModule } from '../common/jwt/jwt-config.module';
import { AdminPerfilController } from './admin-perfil.controller';
import { AdminPerfilService } from './admin-perfil.service';

@Module({
  imports: [JwtConfigModule],
  controllers: [AdminPerfilController],
  providers: [AdminPerfilService],
})
export class AdminPerfilModule {}
