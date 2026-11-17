import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetFeatureFlagDto {
  @ApiProperty({ name: 'ativo', type: Boolean })
  @Expose({ name: 'ativo' })
  @IsBoolean()
  enabled: boolean;
}
