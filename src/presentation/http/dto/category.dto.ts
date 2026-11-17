import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ name: 'nome' })
  @Expose({ name: 'nome' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ name: 'descricao' })
  @Expose({ name: 'descricao' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
