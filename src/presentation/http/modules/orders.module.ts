import { Module } from '@nestjs/common';
import { CheckoutUseCase } from '../../../application/use-cases/orders/checkout.use-case';
import { ListAllOrdersUseCase } from '../../../application/use-cases/orders/list-all-orders.use-case';
import { PayOrderUseCase } from '../../../application/use-cases/orders/pay-order.use-case';
import { UpdateOrderStatusUseCase } from '../../../application/use-cases/orders/update-order-status.use-case';
import { OrdersController } from '../controllers/orders.controller';

@Module({
  controllers: [OrdersController],
  providers: [ListAllOrdersUseCase, CheckoutUseCase, PayOrderUseCase, UpdateOrderStatusUseCase],
})
export class OrdersModule {}
