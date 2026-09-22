import { IsOptional, IsString } from 'class-validator';

export class CreateCategoriaDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}
