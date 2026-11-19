import { Injectable } from '@nestjs/common';
import { AdminRepository, NotificationRepository } from '@domain/repositories';
import { AppLogger } from '@application/ports';

/** Best effort: a failed notification must never break the business operation that triggered it. */
@Injectable()
export class NotifyAdminUseCase {
  constructor(
    private readonly admins: AdminRepository,
    private readonly notifications: NotificationRepository,
    private readonly logger: AppLogger,
  ) {}

  async execute(input: { title: string; message: string; type: string }): Promise<void> {
    try {
      const admin = await this.admins.findFirst();
      if (!admin) return;

      await this.notifications.createForAdmin({ adminId: admin.id, ...input });
    } catch (error) {
      this.logger.error('Failed to create admin notification', error);
    }
  }
}
