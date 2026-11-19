import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Sanitize } from '@presentation/http/decorators';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateContactMessageDto {
  @ApiProperty({ name: 'nome', minLength: 3 })
  @Expose({ name: 'nome' })
  @Sanitize()
  @Transform(trim)
  @IsString()
  @MinLength(3, { message: 'name must be at least 3 characters long' })
  name: string;

  @ApiProperty({ example: 'contato@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'email must be valid' })
  email: string;

  @ApiProperty({ name: 'telefone', minLength: 8 })
  @Expose({ name: 'telefone' })
  @Transform(trim)
  @IsString()
  @MinLength(8, { message: 'phone is required' })
  phone: string;

  @ApiProperty({ name: 'assunto' })
  @Expose({ name: 'assunto' })
  @Sanitize()
  @Transform(trim)
  @IsString()
  subject: string;

  @ApiProperty({ name: 'mensagem', minLength: 10 })
  @Expose({ name: 'mensagem' })
  @Sanitize()
  @Transform(trim)
  @IsString()
  @MinLength(10, { message: 'message must be at least 10 characters long' })
  message: string;
}

export class AnswerContactMessageDto {
  @ApiProperty({ name: 'resposta', minLength: 5 })
  @Expose({ name: 'resposta' })
  @Sanitize()
  @IsString()
  @MinLength(5, { message: 'answer must be at least 5 characters long' })
  answer: string;
}
