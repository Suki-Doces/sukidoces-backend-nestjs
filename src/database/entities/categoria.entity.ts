import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProdutoEntity } from './produto.entity';

@Entity('categorias')
export class CategoriaEntity {
  @PrimaryGeneratedColumn()
  id_categoria: number;

  @Column()
  nome: string;

  @Column({ nullable: true })
  descricao: string | null;

  @OneToMany(() => ProdutoEntity, (produto) => produto.categorias)
  produtos: ProdutoEntity[];
}
