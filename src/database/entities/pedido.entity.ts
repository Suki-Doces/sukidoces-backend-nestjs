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
import { UsuarioEntity } from './usuario.entity';
import { CupomEntity } from './cupom.entity';
import { ItemPedidoEntity } from './item-pedido.entity';
import { DecimalTransformer } from '../decimal.transformer';

@Entity('pedidos')
export class PedidoEntity {
  @PrimaryGeneratedColumn()
  id_pedido: number;

  @Index()
  @Column()
  id_usuario: number;

  @Column('decimal', { precision: 10, scale: 2, transformer: DecimalTransformer })
  valor_total: number;

  @Index()
  @Column()
  status: string;

  @Column({ nullable: true })
  metodo_pagamento: string | null;

  @Column({ nullable: true })
  id_cupom: number | null;

  @Index()
  @CreateDateColumn()
  data_pedido: Date;

  @ManyToOne(() => UsuarioEntity, (usuario) => usuario.pedidos)
  @JoinColumn({ name: 'id_usuario' })
  usuario: UsuarioEntity;

  @ManyToOne(() => CupomEntity, (cupom) => cupom.pedidos, { nullable: true })
  @JoinColumn({ name: 'id_cupom' })
  cupom: CupomEntity | null;

  @OneToMany(() => ItemPedidoEntity, (item) => item.pedido)
  itens_pedido: ItemPedidoEntity[];
}
