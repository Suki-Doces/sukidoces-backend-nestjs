import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { FeatureFlagGuard } from '../feature-flags/feature-flag.guard';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@ApiTags('admin-webhooks')
@Controller('admin/webhooks')
@UseGuards(JwtAuthGuard, AdminGuard, FeatureFlagGuard('webhooks'))
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  listar() {
    return this.webhooksService.listar();
  }

  @Post()
  criar(@Body() dto: CreateWebhookDto) {
    return this.webhooksService.criar(dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.webhooksService.remover(id);
  }
}
