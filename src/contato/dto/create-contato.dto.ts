import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';

export class CreateContatoDto {
  @Sanitize()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3, { message: 'nome deve ter pelo menos 3 caracteres' })
  nome: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'email deve ser válido' })
  email: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(8, { message: 'telefone é obrigatório' })
  telefone: string;

  @Sanitize()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  assunto: string;

  @Sanitize()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(10, { message: 'mensagem deve ter pelo menos 10 caracteres' })
  mensagem: string;
}
