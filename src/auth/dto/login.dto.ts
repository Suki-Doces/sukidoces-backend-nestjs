import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'email deve ser válido' })
  email: string;

  @IsString({ message: 'senha é obrigatória' })
  @MinLength(6, { message: 'senha deve ter pelo menos 6 caracteres' })
  senha: string;
}
