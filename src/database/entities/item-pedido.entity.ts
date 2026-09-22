import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PedidoEntity } from './pedido.entity';
import { ProdutoEntity } from './produto.entity';
import { DecimalTransformer } from '../decimal.transformer';

@Entity('itens_pedido')
export class ItemPedidoEntity {
  @PrimaryGeneratedColumn()
  id_item: number;

  @Column()
  id_pedido: number;

  @Index()
  @Column()
  id_produto: number;

  @Column()
  quantidade: number;

  @Column('decimal', { precision: 10, scale: 2, transformer: DecimalTransformer })
  preco_unitario: number;

  @ManyToOne(() => PedidoEntity, (pedido) => pedido.itens_pedido)
  @JoinColumn({ name: 'id_pedido' })
  pedido: PedidoEntity;

  @ManyToOne(() => ProdutoEntity, (produto) => produto.itens_pedido)
  @JoinColumn({ name: 'id_produto' })
  produtos: ProdutoEntity;
}
