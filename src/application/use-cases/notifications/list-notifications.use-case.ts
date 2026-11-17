import { Injectable } from '@nestjs/common';
import { Notification } from '../../../domain/entities';
import { NotificationOwner, NotificationRepository } from '../../../domain/repositories';
import { buildPagination, clampPagination, Pagination } from '../../common/pagination';
import { InternalError } from '../../errors/application-errors';

@Injectable()
export class ListNotificationsUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(input: {
    owner: NotificationOwner;
    page?: string;
    limit?: string;
  }): Promise<{ notifications: Notification[]; unreadCount: number; pagination: Pagination }> {
    try {
      const { page, limit, skip } = clampPagination(input.page, input.limit, 4);

      const notifications = await this.notifications.findByOwner(input.owner, { take: limit, skip });
      const total = await this.notifications.countByOwner(input.owner);
      const unreadCount = await this.notifications.countByOwner(input.owner, true);

      return { notifications, unreadCount, pagination: buildPagination(total, page, limit) };
    } catch {
      throw new InternalError('Error fetching notifications');
    }
  }
}
