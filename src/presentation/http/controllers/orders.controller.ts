import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CheckoutUseCase,
  ListAllOrdersUseCase,
  PayOrderUseCase,
  UpdateOrderStatusUseCase,
} from '@application/use-cases/orders';

import { CurrentUser } from '@presentation/http/decorators';
import { CheckoutDto } from '@presentation/http/dto';
import { AdminGuard, JwtAuthGuard } from '@presentation/http/guards';

import { successResponse, presentAdminOrder, presentOrder } from '@presentation/http/support';

@ApiTags('orders')
@Controller(['pedidos', 'admin/pedidos'])
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly listAllOrders: ListAllOrdersUseCase,
    private readonly checkoutUseCase: CheckoutUseCase,
    private readonly payOrder: PayOrderUseCase,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
  ) {}

  @Get()
  @UseGuards(AdminGuard)
  async list() {
    return successResponse(
      'Orders loaded successfully',
      (await this.listAllOrders.execute()).map(presentAdminOrder),
    );
  }

  @Post()
  @HttpCode(201)
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Unique key for this checkout attempt',
  })
  @ApiOperation({ summary: 'Creates one order for each unique idempotency key' })
  async checkout(
    @CurrentUser('id') userId: number,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() dto: CheckoutDto,
  ) {
    const order = await this.checkoutUseCase.execute({
      userId,
      idempotencyKey,
      items: dto.products?.map((line) => ({
        productId: line.id_produto,
        quantity: line.quantidade,
      })),
      paymentMethod: dto.paymentMethod,
      couponCode: dto.couponCode,
    });
    return successResponse('Order placed successfully', { pedido: presentOrder(order) });
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':id/pagar')
  async pay(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    const order = await this.payOrder.execute(userId, id);
    return successResponse('Order paid successfully', {
      pedido: order ? presentOrder(order) : null,
    });
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    const order = await this.updateOrderStatus.execute(id, status);
    return successResponse(`Status updated to ${status}`, {
      pedido: order ? presentOrder(order) : null,
    });
  }
}
