import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class AddCarrinhoItemDto {
  @IsOptional()
  @IsInt()
  id_produto?: number;

  @IsOptional()
  @IsInt()
  produto_id?: number;

  @IsInt()
  @IsPositive({ message: 'quantidade deve ser maior que zero' })
  quantidade: number;
}
