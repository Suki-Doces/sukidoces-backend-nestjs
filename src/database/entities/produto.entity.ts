import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CategoriaEntity } from './categoria.entity';
import { ItemPedidoEntity } from './item-pedido.entity';
import { CarrinhoItemEntity } from './carrinho-item.entity';
import { DecimalTransformer } from '../decimal.transformer';

@Entity('produtos')
export class ProdutoEntity {
  @PrimaryGeneratedColumn()
  id_produto: number;

  @Column()
  nome: string;

  @Column({ nullable: true })
  descricao: string | null;

  @Column('decimal', { precision: 10, scale: 2, transformer: DecimalTransformer })
  preco: number;

  @Column({ default: 0 })
  quantidade: number;

  @Column({ nullable: true })
  imagem: string | null;

  @Index()
  @Column({ default: true })
  ativo: boolean;

  @Index()
  @Column({ nullable: true })
  id_categoria: number | null;

  @Index()
  @CreateDateColumn()
  data_criacao: Date;

  @ManyToOne(() => CategoriaEntity, (categoria) => categoria.produtos, { nullable: true })
  @JoinColumn({ name: 'id_categoria' })
  categorias: CategoriaEntity | null;

  @OneToMany(() => ItemPedidoEntity, (item) => item.produtos)
  itens_pedido: ItemPedidoEntity[];

  @OneToMany(() => CarrinhoItemEntity, (item) => item.produto)
  carrinho_itens: CarrinhoItemEntity[];
}
