import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ValidateCouponUseCase } from '@application/use-cases/orders';
import { ValidateCouponDto } from '@presentation/http/dto';
import { successResponse } from '@presentation/http/support';

@ApiTags('coupons')
@Controller('cupons')
export class CouponsController {
  constructor(private readonly validateCoupon: ValidateCouponUseCase) {}

  // Low limit: a public endpoint that confirms whether a code exists must not be brute-forced.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('validar')
  @HttpCode(200)
  @ApiOperation({ summary: 'Checks a coupon and previews its discount for a subtotal' })
  async validate(@Body() dto: ValidateCouponDto) {
    const { coupon, discount } = await this.validateCoupon.execute(dto.code, dto.subtotal ?? 0);
    return successResponse('Coupon applied', {
      codigo: coupon.code,
      tipo: coupon.type,
      valor: Number(coupon.value),
      valor_desconto: discount,
    });
  }
}
