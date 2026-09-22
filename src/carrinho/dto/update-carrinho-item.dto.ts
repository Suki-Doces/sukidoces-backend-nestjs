import { IsInt, IsPositive } from 'class-validator';

export class UpdateCarrinhoItemDto {
  @IsInt()
  @IsPositive({ message: 'quantidade deve ser maior que zero' })
  quantidade: number;
}
