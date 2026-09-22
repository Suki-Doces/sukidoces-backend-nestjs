import { Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MinLength } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';
import { IsCPF } from '../../common/validators/is-cpf.validator';

export class UpdatePerfilDto {
  @IsOptional()
  @Sanitize()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  nome?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsCPF()
  cpf?: string;

  @IsOptional()
  enderecos?: any;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'data_nascimento inválida' })
  data_nascimento?: Date;
}
