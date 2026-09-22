import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContatoMensagemEntity } from '../database/entities/contato-mensagem.entity';
import { JwtConfigModule } from '../common/jwt/jwt-config.module';
import { ContatoController } from './contato.controller';
import { ContatoAdminController } from './contato-admin.controller';
import { ContatoService } from './contato.service';

@Module({
  imports: [JwtConfigModule, TypeOrmModule.forFeature([ContatoMensagemEntity])],
  controllers: [ContatoController, ContatoAdminController],
  providers: [ContatoService],
})
export class ContatoModule {}
