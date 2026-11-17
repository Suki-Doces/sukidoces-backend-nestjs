import { Injectable } from '@nestjs/common';
import { NotificationOwner, NotificationRepository } from '../../../domain/repositories';
import { InternalError } from '../../errors/application-errors';

@Injectable()
export class MarkAllNotificationsReadUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(owner: NotificationOwner): Promise<void> {
    try {
      await this.notifications.markAllAsRead(owner);
    } catch {
      throw new InternalError('Error clearing notifications');
    }
  }
}
