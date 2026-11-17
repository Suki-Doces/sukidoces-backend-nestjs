import { Expose } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiPropertyOptional({ name: 'id_produto', type: Number })
  @Expose({ name: 'id_produto' })
  @IsOptional()
  @IsInt()
  productId?: number;

  /** Older clients send "produto_id" instead of "id_produto". */
  @ApiPropertyOptional({ name: 'produto_id', type: Number, description: 'Legacy product id field' })
  @Expose({ name: 'produto_id' })
  @IsOptional()
  @IsInt()
  legacyProductId?: number;

  @ApiProperty({ name: 'quantidade', type: Number, minimum: 1 })
  @Expose({ name: 'quantidade' })
  @IsInt()
  @IsPositive({ message: 'quantity must be greater than zero' })
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ name: 'quantidade', type: Number, minimum: 1 })
  @Expose({ name: 'quantidade' })
  @IsInt()
  @IsPositive({ message: 'quantity must be greater than zero' })
  quantity: number;
}
