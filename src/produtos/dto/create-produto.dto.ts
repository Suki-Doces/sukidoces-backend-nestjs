import { Transform, Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsPositive, IsString, Min, MinLength } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';

// Multipart/form-data manda TUDO como string — todo campo numérico usa
// `@Type(() => Number)` para converter antes da validação rodar.
export class CreateProdutoDto {
  @Sanitize()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2, { message: 'nome deve ter pelo menos 2 caracteres' })
  nome: string;

  @IsOptional()
  @Sanitize()
  @IsString()
  descricao?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'preco deve ser numérico' })
  @IsPositive({ message: 'preco deve ser maior que zero' })
  preco: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'quantidade deve ser um número inteiro' })
  @Min(0, { message: 'quantidade não pode ser negativa' })
  quantidade?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'id_categoria deve ser um número inteiro' })
  id_categoria?: number;
}
