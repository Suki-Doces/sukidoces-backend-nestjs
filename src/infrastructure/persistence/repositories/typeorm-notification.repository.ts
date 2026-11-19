import { Repository } from 'typeorm';
import { Notification } from '@domain/entities';
import { NotificationOwner, NotificationRepository } from '@domain/repositories';

export class TypeOrmNotificationRepository implements NotificationRepository {
  constructor(private readonly repo: Repository<Notification>) {}

  findByOwner(owner: NotificationOwner, params: { take: number; skip: number }) {
    return this.repo.find({
      where: owner,
      order: { createdAt: 'DESC' },
      take: params.take,
      skip: params.skip,
    });
  }

  countByOwner(owner: NotificationOwner, unreadOnly = false) {
    return this.repo.count({ where: unreadOnly ? { ...owner, isRead: false } : owner });
  }

  async markAsRead(id: number, owner: NotificationOwner) {
    const result = await this.repo.update({ id, ...owner }, { isRead: true });
    return !!result.affected;
  }

  async markAllAsRead(owner: NotificationOwner) {
    await this.repo.update(owner, { isRead: true });
  }

  async deleteOwned(id: number, owner: NotificationOwner) {
    const result = await this.repo.delete({ id, ...owner });
    return !!result.affected;
  }

  create(data: { userId: number; title: string; message: string; type: string }) {
    return this.repo.save(this.repo.create({ ...data, isRead: false }));
  }

  createForAdmin(data: { adminId: number; title: string; message: string; type: string }) {
    return this.repo.save(this.repo.create({ ...data, isRead: false }));
  }
}
