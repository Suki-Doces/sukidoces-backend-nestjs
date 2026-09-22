import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificacaoEntity } from '../database/entities/notificacao.entity';
import { JwtConfigModule } from '../common/jwt/jwt-config.module';
import { NotificacoesController } from './notificacoes.controller';
import { NotificacoesService } from './notificacoes.service';

@Module({
  imports: [JwtConfigModule, TypeOrmModule.forFeature([NotificacaoEntity])],
  controllers: [NotificacoesController],
  providers: [NotificacoesService],
})
export class NotificacoesModule {}
