import { Module } from '@nestjs/common';
import { AddToCartUseCase } from '../../../application/use-cases/cart/add-to-cart.use-case';
import { ClearCartUseCase } from '../../../application/use-cases/cart/clear-cart.use-case';
import { ListCartUseCase } from '../../../application/use-cases/cart/list-cart.use-case';
import { RemoveCartItemUseCase } from '../../../application/use-cases/cart/remove-cart-item.use-case';
import { UpdateCartItemQuantityUseCase } from '../../../application/use-cases/cart/update-cart-item-quantity.use-case';
import { CartController } from '../controllers/cart.controller';

@Module({
  controllers: [CartController],
  providers: [ListCartUseCase, AddToCartUseCase, UpdateCartItemQuantityUseCase, RemoveCartItemUseCase, ClearCartUseCase],
})
export class CartModule {}
