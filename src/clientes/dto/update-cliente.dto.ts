import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';

export class UpdateClienteDto {
  @IsOptional()
  @Sanitize()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  nome?: string;

  @IsOptional()
  @IsIn(['ativo', 'inativo'], { message: 'status deve ser "ativo" ou "inativo"' })
  status?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'senha deve ter pelo menos 6 caracteres' })
  senha?: string;
}
