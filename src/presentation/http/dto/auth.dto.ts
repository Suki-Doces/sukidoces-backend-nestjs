import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Sanitize } from '@presentation/http/decorators';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @ApiProperty({ name: 'nome', minLength: 2, example: 'Maria Silva' })
  @Expose({ name: 'nome' })
  @Sanitize()
  @Transform(trim)
  @IsString({ message: 'name is required' })
  @MinLength(2, { message: 'name must be at least 2 characters long' })
  name: string;

  @ApiProperty({ example: 'maria@example.com' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'email must be valid' })
  email: string;

  @ApiProperty({ name: 'senha', minLength: 6, writeOnly: true })
  @Expose({ name: 'senha' })
  @IsString({ message: 'password is required' })
  @MinLength(6, { message: 'password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ name: 'telefone', minLength: 10, example: '11999999999' })
  @Expose({ name: 'telefone' })
  @Transform(trim)
  @IsString({ message: 'phone is required' })
  @MinLength(10, { message: 'phone must be at least 10 characters long' })
  phone: string;
}

export class LoginDto {
  @ApiProperty({ example: 'maria@example.com' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'email must be valid' })
  email: string;

  @ApiProperty({ name: 'senha', minLength: 6, writeOnly: true })
  @Expose({ name: 'senha' })
  @IsString({ message: 'password is required' })
  @MinLength(6, { message: 'password must be at least 6 characters long' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ writeOnly: true })
  @IsString({ message: 'refreshToken is required' })
  refreshToken: string;
}

export class LogoutDto extends RefreshTokenDto {}
