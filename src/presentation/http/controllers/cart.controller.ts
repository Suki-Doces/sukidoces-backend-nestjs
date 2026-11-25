import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  AddToCartUseCase,
  ClearCartUseCase,
  ListCartUseCase,
  RemoveCartItemUseCase,
  UpdateCartItemQuantityUseCase,
} from '@application/use-cases/cart';

import { CurrentUser } from '@presentation/http/decorators';
import { AddCartItemDto, UpdateCartItemDto } from '@presentation/http/dto';
import { JwtAuthGuard } from '@presentation/http/guards';
import { successResponse, presentCart } from '@presentation/http/support';

@ApiTags('cart')
@Controller('carrinho')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(
    private readonly listCart: ListCartUseCase,
    private readonly addToCart: AddToCartUseCase,
    private readonly updateQuantity: UpdateCartItemQuantityUseCase,
    private readonly removeItem: RemoveCartItemUseCase,
    private readonly clearCart: ClearCartUseCase,
  ) {}

  @Get()
  @ApiQuery({ name: 'estado', required: false, description: 'Destination state (UF)' })
  @ApiQuery({ name: 'cidade', required: false, description: 'Destination city' })
  async list(
    @CurrentUser('id') userId: number,
    @Query('estado') state?: string,
    @Query('cidade') city?: string,
  ) {
    return successResponse(
      'Cart loaded successfully',
      presentCart(await this.listCart.execute(userId, { state, city })),
    );
  }

  @Post('add')
  async add(@CurrentUser('id') userId: number, @Body() dto: AddCartItemDto) {
    await this.addToCart.execute({
      userId,
      productId: dto.productId || dto.legacyProductId,
      quantity: dto.quantity,
    });
    return successResponse('Product added to the cart');
  }

  @Put(':itemId')
  async update(
    @CurrentUser('id') userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    await this.updateQuantity.execute({ userId, itemId, quantity: dto.quantity });
    return successResponse('Quantity updated');
  }

  @Delete(':itemId')
  async remove(@CurrentUser('id') userId: number, @Param('itemId', ParseIntPipe) itemId: number) {
    await this.removeItem.execute(userId, itemId);
    return successResponse('Item removed from the cart');
  }

  @Delete()
  async clear(@CurrentUser('id') userId: number) {
    await this.clearCart.execute(userId);
    return successResponse('Cart emptied successfully');
  }
}
