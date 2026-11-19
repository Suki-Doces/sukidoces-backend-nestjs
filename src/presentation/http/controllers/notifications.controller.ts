import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  DeleteNotificationUseCase,
  ListNotificationsUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
} from '@application/use-cases/notifications';

import { CurrentUser } from '@presentation/http/decorators';
import { AdminGuard, JwtAuthGuard } from '@presentation/http/guards';

import { successResponse, presentNotification } from '@presentation/http/support';

@ApiTags('notifications')
@Controller('admin/notificacoes')
@UseGuards(JwtAuthGuard, AdminGuard)
export class NotificationsController {
  constructor(
    private readonly listNotifications: ListNotificationsUseCase,
    private readonly markRead: MarkNotificationReadUseCase,
    private readonly markAllRead: MarkAllNotificationsReadUseCase,
    private readonly deleteNotification: DeleteNotificationUseCase,
  ) {}

  @Get()
  async list(@CurrentUser('id') userId: number, @Query() query: Record<string, string>) {
    const owner = { adminId: userId };
    const result = await this.listNotifications.execute({
      owner,
      page: query.page,
      limit: query.limit,
    });
    return successResponse('Notifications loaded successfully', {
      notifications: result.notifications.map(presentNotification),
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    });
  }

  @Put('read-all')
  async readAll(@CurrentUser('id') userId: number) {
    await this.markAllRead.execute({ adminId: userId });
    return successResponse('All notifications marked as read');
  }

  @Put(':id/read')
  async read(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    await this.markRead.execute({ adminId: userId }, id);
    return successResponse('Notification marked as read');
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    await this.deleteNotification.execute({ adminId: userId }, id);
    return successResponse('Notification deleted');
  }
}
