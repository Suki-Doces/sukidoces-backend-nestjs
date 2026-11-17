import { Module } from '@nestjs/common';
import { DeleteNotificationUseCase } from '../../../application/use-cases/notifications/delete-notification.use-case';
import { ListNotificationsUseCase } from '../../../application/use-cases/notifications/list-notifications.use-case';
import { MarkAllNotificationsReadUseCase } from '../../../application/use-cases/notifications/mark-all-notifications-read.use-case';
import { MarkNotificationReadUseCase } from '../../../application/use-cases/notifications/mark-notification-read.use-case';
import { NotificationsController } from '../controllers/notifications.controller';

@Module({
  controllers: [NotificationsController],
  providers: [ListNotificationsUseCase, MarkNotificationReadUseCase, MarkAllNotificationsReadUseCase, DeleteNotificationUseCase],
})
export class NotificationsModule {}
