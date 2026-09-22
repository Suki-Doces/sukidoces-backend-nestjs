import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'refreshToken é obrigatório' })
  refreshToken: string;
}
