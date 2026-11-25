import { Expose, Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({ name: 'codigo', example: 'SUKI10' })
  @Expose({ name: 'codigo' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString({ message: 'coupon code is required' })
  @MinLength(1, { message: 'coupon code is required' })
  code: string;

  @ApiPropertyOptional({ name: 'subtotal', type: Number, example: 59.9 })
  @Expose({ name: 'subtotal' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'subtotal must be a number' })
  @Min(0)
  subtotal?: number;
}
