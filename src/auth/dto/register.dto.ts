import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';

export class RegisterDto {
  @Sanitize()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'nome é obrigatório' })
  @MinLength(2, { message: 'nome deve ter pelo menos 2 caracteres' })
  nome: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'email deve ser válido' })
  email: string;

  @IsString({ message: 'senha é obrigatória' })
  @MinLength(6, { message: 'senha deve ter pelo menos 6 caracteres' })
  senha: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'telefone é obrigatório' })
  @MinLength(10, { message: 'telefone deve ter pelo menos 10 caracteres' })
  telefone: string;
}
