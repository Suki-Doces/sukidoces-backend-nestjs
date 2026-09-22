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

@Entity('notificacoes')
@Index(['id_usuario', 'lido'])
export class NotificacaoEntity {
  @PrimaryGeneratedColumn()
  id_notificacao: number;

  @Column()
  id_usuario: number;

  @Column()
  titulo: string;

  @Column()
  mensagem: string;

  @Column()
  tipo: string;

  @Column({ default: false })
  lido: boolean;

  @CreateDateColumn()
  data_criacao: Date;

  @ManyToOne(() => UsuarioEntity, (usuario) => usuario.notificacoes)
  @JoinColumn({ name: 'id_usuario' })
  usuario: UsuarioEntity;
}
