import { Injectable } from '@nestjs/common';
import { NotificationOwner, NotificationRepository } from '@domain/repositories';
import { ForbiddenError, InternalError } from '@application/errors';

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(owner: NotificationOwner, notificationId: number): Promise<void> {
    let updated: boolean;
    try {
      updated = await this.notifications.markAsRead(notificationId, owner);
    } catch {
      throw new InternalError('Error updating notification');
    }

    if (!updated) {
      throw new ForbiddenError('Not authorized or notification not found');
    }
  }
}
