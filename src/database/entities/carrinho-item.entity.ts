import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsuarioEntity } from './usuario.entity';
import { ProdutoEntity } from './produto.entity';

@Entity('carrinho_itens')
export class CarrinhoItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  usuario_id: number;

  @Column()
  id_produto: number;

  @Column()
  quantidade: number;

  @CreateDateColumn()
  data_adicionado: Date;

  @ManyToOne(() => UsuarioEntity, (usuario) => usuario.carrinho_itens)
  @JoinColumn({ name: 'usuario_id' })
  usuario: UsuarioEntity;

  @ManyToOne(() => ProdutoEntity, (produto) => produto.carrinho_itens)
  @JoinColumn({ name: 'id_produto' })
  produto: ProdutoEntity;
}
