import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificacaoEntity } from '../database/entities/notificacao.entity';
import { AdminNotificationListener } from './admin-notification.listener';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([NotificacaoEntity])],
  providers: [AdminNotificationListener],
})
export class NotificationsModule {}
