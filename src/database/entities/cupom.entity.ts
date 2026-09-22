import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PedidoEntity } from './pedido.entity';
import { DecimalTransformer } from '../decimal.transformer';

@Entity('cupons')
export class CupomEntity {
  @PrimaryGeneratedColumn()
  id_cupom: number;

  @Column({ unique: true })
  codigo: string;

  @Column()
  tipo: string;

  @Column('decimal', { precision: 10, scale: 2, transformer: DecimalTransformer })
  valor: number;

  @Column({ type: 'datetime', nullable: true })
  validade: Date | null;

  @Column({ default: true })
  ativo: boolean;

  @OneToMany(() => PedidoEntity, (pedido) => pedido.cupom)
  pedidos: PedidoEntity[];
}
