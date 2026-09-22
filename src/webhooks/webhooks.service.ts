import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEntity } from '../database/entities/webhook.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { buildSuccessResponse } from '../common/responses/api-response';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(WebhookEntity)
    private readonly repo: Repository<WebhookEntity>,
  ) {}

  async listar() {
    const webhooks = await this.repo.find({ order: { id_webhook: 'DESC' } });
    return buildSuccessResponse('Webhooks carregados com sucesso', webhooks);
  }

  async criar(dto: CreateWebhookDto) {
    const webhook = await this.repo.save(
      this.repo.create({ url: dto.url, eventos: dto.eventos.join(','), ativo: true }),
    );
    return buildSuccessResponse('Webhook registrado com sucesso', webhook);
  }

  async remover(id: number) {
    const webhook = await this.repo.findOne({ where: { id_webhook: id } });
    if (!webhook) throw new NotFoundException('Webhook não encontrado');

    await this.repo.delete({ id_webhook: id });
    return buildSuccessResponse('Webhook removido com sucesso');
  }

  async findAtivosParaEvento(evento: string) {
    const todos = await this.repo.find({ where: { ativo: true } });
    return todos.filter((w) => w.eventos.split(',').includes(evento));
  }

  async dispatch(url: string, payload: Record<string, any>) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        this.logger.warn(`Webhook ${url} respondeu com status ${res.status}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao chamar webhook ${url}: ${error.message}`);
    }
  }
}
