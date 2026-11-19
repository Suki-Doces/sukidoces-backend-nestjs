import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateWebhookUseCase,
  DeleteWebhookUseCase,
  ListWebhooksUseCase,
} from '@application/use-cases/webhooks';

import { CreateWebhookDto } from '@presentation/http/dto';
import { AdminGuard, FeatureFlagGuard, JwtAuthGuard } from '@presentation/http/guards';

import { successResponse, presentWebhook } from '@presentation/http/support';

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
    return successResponse(
      'Webhooks loaded successfully',
      (await this.listWebhooks.execute()).map(presentWebhook),
    );
  }

  @Post()
  async create(@Body() dto: CreateWebhookDto) {
    return successResponse(
      'Webhook registered successfully',
      presentWebhook(await this.createWebhook.execute(dto)),
    );
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deleteWebhook.execute(id);
    return successResponse('Webhook removed successfully');
  }
}
