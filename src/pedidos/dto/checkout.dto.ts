export interface CheckoutItemInput {
  id_produto: number;
  quantidade: number;
}

export interface CheckoutDto {
  produtos: CheckoutItemInput[];
  metodo_pagamento: string;
  codigo_cupom?: string;
}
