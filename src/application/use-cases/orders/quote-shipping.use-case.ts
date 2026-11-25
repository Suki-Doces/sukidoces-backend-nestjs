import { Injectable } from '@nestjs/common';
import { ShippingQuote, toShippingDestination, quoteShipping } from '@domain/shipping';
import { BadRequestError } from '@application/errors';

@Injectable()
export class QuoteShippingUseCase {
  execute(input: { subtotal: number; state?: string; city?: string }): ShippingQuote {
    const destination = toShippingDestination(input.state, input.city);
    if (!destination) {
      throw new BadRequestError('A valid state (UF) and, for SP, the city are required');
    }
    return quoteShipping(input.subtotal, destination);
  }
}
