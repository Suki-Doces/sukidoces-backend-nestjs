import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebhooksService } from './webhooks.service';
import { ADMIN_NOTIFICATION_EVENTS } from '../notifications/admin-notification.events';

@Injectable()
export class WebhookDispatcherListener {
  constructor(private readonly webhooksService: WebhooksService) {}

  private async dispatchPara(evento: string, payload: unknown) {
    const webhooks = await this.webhooksService.findAtivosParaEvento(evento);
    if (webhooks.length === 0) return;

    await Promise.all(
      webhooks.map((webhook) =>
        this.webhooksService.dispatch(webhook.url, { evento, payload, disparadoEm: new Date() }),
      ),
    );
  }

  @OnEvent(ADMIN_NOTIFICATION_EVENTS.USUARIO_REGISTRADO)
  onUsuarioRegistrado(payload: unknown) {
    return this.dispatchPara(ADMIN_NOTIFICATION_EVENTS.USUARIO_REGISTRADO, payload);
  }

  @OnEvent(ADMIN_NOTIFICATION_EVENTS.PEDIDO_CRIADO)
  onPedidoCriado(payload: unknown) {
    return this.dispatchPara(ADMIN_NOTIFICATION_EVENTS.PEDIDO_CRIADO, payload);
  }

  @OnEvent(ADMIN_NOTIFICATION_EVENTS.PEDIDO_PAGO)
  onPedidoPago(payload: unknown) {
    return this.dispatchPara(ADMIN_NOTIFICATION_EVENTS.PEDIDO_PAGO, payload);
  }

  @OnEvent(ADMIN_NOTIFICATION_EVENTS.PEDIDO_STATUS_ATUALIZADO)
  onPedidoStatusAtualizado(payload: unknown) {
    return this.dispatchPara(ADMIN_NOTIFICATION_EVENTS.PEDIDO_STATUS_ATUALIZADO, payload);
  }

  @OnEvent(ADMIN_NOTIFICATION_EVENTS.PEDIDO_CANCELADO)
  onPedidoCancelado(payload: unknown) {
    return this.dispatchPara(ADMIN_NOTIFICATION_EVENTS.PEDIDO_CANCELADO, payload);
  }
}
