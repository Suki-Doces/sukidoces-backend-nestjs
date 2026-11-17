export enum PaymentMethod {
  PIX = 'pix',
  CARD = 'cartao',
  BANK_SLIP = 'boleto',
}

/** Payment methods that are confirmed immediately (the order starts as PAID). */
export const INSTANT_PAYMENT_METHODS: string[] = [PaymentMethod.PIX, PaymentMethod.CARD];
