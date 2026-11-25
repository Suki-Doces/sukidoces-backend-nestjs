import { Module } from '@nestjs/common';
import {
  CheckoutUseCase,
  ListAllOrdersUseCase,
  PayOrderUseCase,
  QuoteShippingUseCase,
  UpdateOrderStatusUseCase,
  ValidateCouponUseCase,
} from '@application/use-cases/orders';
import { ShippingDestinationResolver } from '@application/shipping';

import {
  CouponsController,
  OrdersController,
  ShippingController,
} from '@presentation/http/controllers';

@Module({
  controllers: [OrdersController, CouponsController, ShippingController],
  providers: [
    ListAllOrdersUseCase,
    CheckoutUseCase,
    PayOrderUseCase,
    UpdateOrderStatusUseCase,
    ValidateCouponUseCase,
    QuoteShippingUseCase,
    ShippingDestinationResolver,
  ],
})
export class OrdersModule {}
