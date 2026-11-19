import { Notification } from '@domain/entities';

export type NotificationOwner =
  { userId: number; adminId?: never } | { userId?: never; adminId: number };

export abstract class NotificationRepository {
  abstract findByOwner(
    owner: NotificationOwner,
    params: { take: number; skip: number },
  ): Promise<Notification[]>;
  abstract countByOwner(owner: NotificationOwner, unreadOnly?: boolean): Promise<number>;
  /** Returns true when a notification for this recipient was updated. */
  abstract markAsRead(id: number, owner: NotificationOwner): Promise<boolean>;
  abstract markAllAsRead(owner: NotificationOwner): Promise<void>;
  /** Returns true when a notification for this recipient was deleted. */
  abstract deleteOwned(id: number, owner: NotificationOwner): Promise<boolean>;
  abstract create(data: {
    userId: number;
    title: string;
    message: string;
    type: string;
  }): Promise<Notification>;
  abstract createForAdmin(data: {
    adminId: number;
    title: string;
    message: string;
    type: string;
  }): Promise<Notification>;
}
