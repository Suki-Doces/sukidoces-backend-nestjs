export enum PedidoStatus {
  PENDENTE = 'pendente',
  PAGO = 'pago',
  ENVIADO = 'enviado',
  ENTREGUE = 'entregue',
  CANCELADO = 'cancelado',
}

export const STATUS_QUE_CONTAM_COMO_VENDA = [
  PedidoStatus.PAGO,
  PedidoStatus.ENVIADO,
  PedidoStatus.ENTREGUE,
];
