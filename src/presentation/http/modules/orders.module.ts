import { Module } from '@nestjs/common';
import {
  CheckoutUseCase,
  ListAllOrdersUseCase,
  PayOrderUseCase,
  UpdateOrderStatusUseCase,
} from '@application/use-cases/orders';

import { OrdersController } from '@presentation/http/controllers';

@Module({
  controllers: [OrdersController],
  providers: [ListAllOrdersUseCase, CheckoutUseCase, PayOrderUseCase, UpdateOrderStatusUseCase],
})
export class OrdersModule {}
