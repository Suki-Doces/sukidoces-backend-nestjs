import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive, IsString, Min, MinLength } from 'class-validator';
import { Sanitize } from '@presentation/http/decorators';

// Multipart bodies deliver every value as a string, so numeric fields are
// converted with @Type before they are validated.
export class CreateProductDto {
  @ApiProperty({ name: 'nome', minLength: 2 })
  @Expose({ name: 'nome' })
  @Sanitize()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2, { message: 'name must be at least 2 characters long' })
  name: string;

  @ApiPropertyOptional({ name: 'descricao' })
  @Expose({ name: 'descricao' })
  @IsOptional()
  @Sanitize()
  @IsString()
  description?: string;

  @ApiProperty({ name: 'preco', type: Number, minimum: 0 })
  @Expose({ name: 'preco' })
  @Type(() => Number)
  @IsNumber({}, { message: 'price must be a number' })
  @IsPositive({ message: 'price must be greater than zero' })
  price: number;

  @ApiPropertyOptional({ name: 'quantidade', type: Number, minimum: 0 })
  @Expose({ name: 'quantidade' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'quantity must be an integer' })
  @Min(0, { message: 'quantity cannot be negative' })
  quantity?: number;

  @ApiPropertyOptional({ name: 'id_categoria', type: Number, minimum: 1 })
  @Expose({ name: 'id_categoria' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoryId must be an integer' })
  categoryId?: number;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
