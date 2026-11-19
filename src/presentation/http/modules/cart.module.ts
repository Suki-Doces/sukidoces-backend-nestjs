import { Module } from '@nestjs/common';
import {
  AddToCartUseCase,
  ClearCartUseCase,
  ListCartUseCase,
  RemoveCartItemUseCase,
  UpdateCartItemQuantityUseCase,
} from '@application/use-cases/cart';

import { CartController } from '@presentation/http/controllers';

@Module({
  controllers: [CartController],
  providers: [
    ListCartUseCase,
    AddToCartUseCase,
    UpdateCartItemQuantityUseCase,
    RemoveCartItemUseCase,
    ClearCartUseCase,
  ],
})
export class CartModule {}
