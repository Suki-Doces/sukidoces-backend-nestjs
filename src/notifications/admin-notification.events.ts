export const ADMIN_NOTIFICATION_EVENTS = {
  USUARIO_REGISTRADO: 'admin-notification.usuario-registrado',
  PEDIDO_CRIADO: 'admin-notification.pedido-criado',
  PEDIDO_PAGO: 'admin-notification.pedido-pago',
  PEDIDO_STATUS_ATUALIZADO: 'admin-notification.pedido-status-atualizado',
  PEDIDO_CANCELADO: 'admin-notification.pedido-cancelado',
} as const;

export class UsuarioRegistradoEvent {
  constructor(public readonly nomeUsuario: string) {}
}

export class PedidoCriadoEvent {
  constructor(
    public readonly idPedido: number,
    public readonly valorTotal: number,
  ) {}
}

export class PedidoPagoEvent {
  constructor(public readonly idPedido: number) {}
}

export class PedidoStatusAtualizadoEvent {
  constructor(
    public readonly idPedido: number,
    public readonly novoStatus: string,
  ) {}
}

export class PedidoCanceladoEvent {
  constructor(public readonly idPedido: number) {}
}
