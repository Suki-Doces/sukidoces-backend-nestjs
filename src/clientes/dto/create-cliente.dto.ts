import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';

export class CreateClienteDto {
  @Sanitize()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2, { message: 'nome deve ter pelo menos 2 caracteres' })
  nome: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'email deve ser válido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'senha deve ter pelo menos 6 caracteres' })
  senha: string;

  @IsOptional()
  @IsIn(['ativo', 'inativo'], { message: 'status deve ser "ativo" ou "inativo"' })
  status?: string;
}
