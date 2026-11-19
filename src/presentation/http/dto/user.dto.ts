import { Expose, Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Sanitize } from '@presentation/http/decorators';
import { IsCpf } from '@presentation/http/validators';

export class ChangePasswordDto {
  // Presence and length are validated by the use case, as before.
  @ApiPropertyOptional({ name: 'senhaAtual', writeOnly: true })
  @Expose({ name: 'senhaAtual' })
  @IsOptional()
  currentPassword?: string;

  @ApiPropertyOptional({ name: 'novaSenha', minLength: 6, writeOnly: true })
  @Expose({ name: 'novaSenha' })
  @IsOptional()
  newPassword?: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ name: 'nome', minLength: 2 })
  @Expose({ name: 'nome' })
  @IsOptional()
  @Sanitize()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ name: 'telefone' })
  @Expose({ name: 'telefone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ name: 'cpf', example: '52998224725' })
  @Expose({ name: 'cpf' })
  @IsOptional()
  @IsCpf()
  cpf?: string;

  @ApiPropertyOptional({ name: 'enderecos', type: 'object', additionalProperties: true })
  @Expose({ name: 'enderecos' })
  @IsOptional()
  addresses?: unknown;

  @ApiPropertyOptional({ name: 'data_nascimento', type: String, format: 'date' })
  @Expose({ name: 'data_nascimento' })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'birth date is invalid' })
  birthDate?: Date;
}
