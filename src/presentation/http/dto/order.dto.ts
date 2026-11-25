import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
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

/** Delivery destination; only state and city matter for shipping. Other address fields are ignored. */
export class DeliveryAddressDto {
  @ApiProperty({ name: 'estado', example: 'SP', description: 'State code (UF)' })
  @Expose({ name: 'estado' })
  @IsString()
  state: string;

  @ApiProperty({ name: 'cidade', example: 'Santo André' })
  @Expose({ name: 'cidade' })
  @IsString()
  city: string;
}

export class QuoteShippingDto {
  @ApiProperty({ name: 'subtotal', type: Number, example: 59.9 })
  @Expose({ name: 'subtotal' })
  @Type(() => Number)
  @IsNumber({}, { message: 'subtotal must be a number' })
  @Min(0)
  subtotal: number;

  @ApiProperty({ name: 'estado', example: 'SP' })
  @Expose({ name: 'estado' })
  @IsString()
  state: string;

  @ApiPropertyOptional({ name: 'cidade', example: 'Diadema' })
  @Expose({ name: 'cidade' })
  @IsOptional()
  @IsString()
  city?: string;
}

export class CheckoutDto {
  @ApiProperty({ name: 'produtos', type: [CheckoutLineDto] })
  @Expose({ name: 'produtos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutLineDto)
  products?: CheckoutLineDto[];

  @ApiProperty({ name: 'metodo_pagamento' })
  @Expose({ name: 'metodo_pagamento' })
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ name: 'codigo_cupom' })
  @Expose({ name: 'codigo_cupom' })
  @IsOptional()
  couponCode?: string;

  @ApiPropertyOptional({
    name: 'endereco_entrega',
    type: DeliveryAddressDto,
    description: 'Destination used to calculate shipping. Defaults to the main saved address.',
  })
  @Expose({ name: 'endereco_entrega' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;
}
