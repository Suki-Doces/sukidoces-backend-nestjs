import { Injectable } from '@nestjs/common';
import { NotificationOwner, NotificationRepository } from '../../../domain/repositories';
import { ForbiddenError, InternalError } from '../../errors/application-errors';

@Injectable()
export class DeleteNotificationUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(owner: NotificationOwner, notificationId: number): Promise<void> {
    let deleted: boolean;
    try {
      deleted = await this.notifications.deleteOwned(notificationId, owner);
    } catch {
      throw new InternalError('Error deleting notification');
    }

    if (!deleted) {
      throw new ForbiddenError('Not authorized or notification not found');
    }
  }
}
