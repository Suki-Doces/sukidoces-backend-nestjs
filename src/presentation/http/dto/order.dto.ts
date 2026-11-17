import { Expose, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsPositive, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Wire shape of one checkout line. */
export class CheckoutLineDto {
  @ApiProperty({ name: 'id_produto', type: Number, minimum: 1 })
  @Expose({ name: 'id_produto' })
  @IsInt()
  @IsPositive()
  id_produto: number;

  @ApiProperty({ name: 'quantidade', type: Number, minimum: 1 })
  @Expose({ name: 'quantidade' })
  @IsInt()
  @IsPositive()
  quantidade: number;
}

export class CheckoutDto {
  @ApiPropertyOptional({ name: 'produtos', type: [CheckoutLineDto] })
  @Expose({ name: 'produtos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutLineDto)
  products?: CheckoutLineDto[];

  @ApiPropertyOptional({ name: 'metodo_pagamento' })
  @Expose({ name: 'metodo_pagamento' })
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ name: 'codigo_cupom' })
  @Expose({ name: 'codigo_cupom' })
  @IsOptional()
  couponCode?: string;
}
