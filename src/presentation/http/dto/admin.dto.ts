import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Sanitize } from '../decorators/sanitize.decorator';

export class UpdateAdminSettingsDto {
  @ApiPropertyOptional({ name: 'nome' })
  @Expose({ name: 'nome' })
  @IsOptional()
  @Sanitize()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'admin@example.com' })
  @Expose({ name: 'email' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'email must be valid' })
  email?: string;

  @ApiPropertyOptional({ name: 'senhaAtual', writeOnly: true })
  @Expose({ name: 'senhaAtual' })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiPropertyOptional({ name: 'novaSenha', minLength: 6, writeOnly: true })
  @Expose({ name: 'novaSenha' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'newPassword must be at least 6 characters long' })
  newPassword?: string;
}
