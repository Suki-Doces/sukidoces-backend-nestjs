/** Identifiers are English; the values are what is already stored in the database. */
export enum OrderStatus {
  PENDING = 'pendente',
  PAID = 'pago',
  SHIPPED = 'enviado',
  DELIVERED = 'entregue',
  CANCELLED = 'cancelado',
}

/** Statuses that count as a completed sale for revenue metrics. */
export const SALE_STATUSES: OrderStatus[] = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED];
