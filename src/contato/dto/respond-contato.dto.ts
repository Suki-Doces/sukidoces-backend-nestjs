import { IsString, MinLength } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';

export class RespondContatoDto {
  @Sanitize()
  @IsString()
  @MinLength(5, { message: 'resposta deve ter pelo menos 5 caracteres' })
  resposta: string;
}
