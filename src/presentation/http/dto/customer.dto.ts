import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sanitize } from '../decorators/sanitize.decorator';

/** Wire values for the customer status ("active" / "inactive"). */
export const CUSTOMER_STATUS = { ACTIVE: 'ativo', INACTIVE: 'inativo' } as const;
const STATUS_VALUES = Object.values(CUSTOMER_STATUS);

export class CreateCustomerDto {
  @ApiProperty({ name: 'nome', minLength: 2 })
  @Expose({ name: 'nome' })
  @Sanitize()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2, { message: 'name must be at least 2 characters long' })
  name: string;

  @ApiProperty({ example: 'cliente@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'email must be valid' })
  email: string;

  @ApiProperty({ name: 'senha', minLength: 6, writeOnly: true })
  @Expose({ name: 'senha' })
  @IsString()
  @MinLength(6, { message: 'password must be at least 6 characters long' })
  password: string;

  @ApiPropertyOptional({ enum: STATUS_VALUES })
  @IsOptional()
  @IsIn(STATUS_VALUES, { message: `status must be one of: ${STATUS_VALUES.join(', ')}` })
  status?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ name: 'nome', minLength: 2 })
  @Expose({ name: 'nome' })
  @ApiPropertyOptional({ enum: STATUS_VALUES })
  @IsOptional()
  @Sanitize()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(STATUS_VALUES, { message: `status must be one of: ${STATUS_VALUES.join(', ')}` })
  status?: string;

  @ApiPropertyOptional({ name: 'senha', minLength: 6, writeOnly: true })
  @Expose({ name: 'senha' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'password must be at least 6 characters long' })
  password?: string;
}
