import { ProdutoEntity } from '../../database/entities/produto.entity';
import { Produto } from './produto.domain';

export class ProdutoMapper {
  static toDomain(entity: ProdutoEntity): Produto {
    return new Produto(entity.id_produto, entity.nome, Number(entity.preco), entity.quantidade, entity.ativo);
  }
}
