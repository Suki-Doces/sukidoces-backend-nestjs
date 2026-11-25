import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { QuoteShippingUseCase } from '@application/use-cases/orders';
import { QuoteShippingDto } from '@presentation/http/dto';
import { successResponse } from '@presentation/http/support';

@ApiTags('shipping')
@Controller('frete')
export class ShippingController {
  constructor(private readonly quoteShipping: QuoteShippingUseCase) {}

  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('calcular')
  @HttpCode(200)
  @ApiOperation({ summary: 'Quotes shipping for a products subtotal and a destination' })
  calculate(@Body() dto: QuoteShippingDto) {
    const quote = this.quoteShipping.execute({
      subtotal: dto.subtotal,
      state: dto.state,
      city: dto.city,
    });
    return successResponse('Shipping calculated', {
      frete: quote.amount,
      frete_gratis: quote.freeShipping,
      frete_padrao: quote.standardFee,
      frete_gratis_a_partir_de: quote.freeShippingThreshold,
      zona: quote.zone,
    });
  }
}
