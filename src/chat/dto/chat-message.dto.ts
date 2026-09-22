import { IsArray, IsOptional, IsString } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  history?: any[];
}
