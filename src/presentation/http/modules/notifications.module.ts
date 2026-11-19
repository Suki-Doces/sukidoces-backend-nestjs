import { Module } from '@nestjs/common';
import {
  DeleteNotificationUseCase,
  ListNotificationsUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
} from '@application/use-cases/notifications';

import { NotificationsController } from '@presentation/http/controllers';

@Module({
  controllers: [NotificationsController],
  providers: [
    ListNotificationsUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
    DeleteNotificationUseCase,
  ],
})
export class NotificationsModule {}
