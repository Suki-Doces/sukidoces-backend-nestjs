import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateWebhookUseCase } from '../../../application/use-cases/webhooks/create-webhook.use-case';
import { DeleteWebhookUseCase } from '../../../application/use-cases/webhooks/delete-webhook.use-case';
import { ListWebhooksUseCase } from '../../../application/use-cases/webhooks/list-webhooks.use-case';
import { CreateWebhookDto } from '../dto/webhook.dto';
import { AdminGuard } from '../guards/admin.guard';
import { FeatureFlagGuard } from '../guards/feature-flag.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { successResponse } from '../support/api-response';
import { presentWebhook } from '../support/presenters';

@ApiTags('webhooks')
@Controller('admin/webhooks')
@UseGuards(JwtAuthGuard, AdminGuard, FeatureFlagGuard('webhooks'))
export class WebhooksController {
  constructor(
    private readonly listWebhooks: ListWebhooksUseCase,
    private readonly createWebhook: CreateWebhookUseCase,
    private readonly deleteWebhook: DeleteWebhookUseCase,
  ) {}

  @Get()
  async list() {
    return successResponse('Webhooks loaded successfully', (await this.listWebhooks.execute()).map(presentWebhook));
  }

  @Post()
  async create(@Body() dto: CreateWebhookDto) {
    return successResponse('Webhook registered successfully', presentWebhook(await this.createWebhook.execute(dto)));
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deleteWebhook.execute(id);
    return successResponse('Webhook removed successfully');
  }
}
