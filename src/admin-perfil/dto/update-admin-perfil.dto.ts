import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';

export class UpdateAdminPerfilDto {
  @IsOptional()
  @Sanitize()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  nome?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'email deve ser válido' })
  email?: string;

  @IsOptional()
  @IsString()
  senhaAtual?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'novaSenha deve ter pelo menos 6 caracteres' })
  novaSenha?: string;
}
