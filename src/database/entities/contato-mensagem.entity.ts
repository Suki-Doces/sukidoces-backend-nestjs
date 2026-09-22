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

@Entity('contatoMensagens')
export class ContatoMensagemEntity {
  @PrimaryGeneratedColumn()
  id_contato: number;

  @Column()
  nome: string;

  @Column()
  email: string;

  @Column()
  telefone: string;

  @Column()
  assunto: string;

  @Column()
  mensagem: string;

  @Index()
  @Column({ nullable: true })
  id_usuario: number | null;

  @Column({ default: false })
  respondido: boolean;

  @Column({ nullable: true })
  resposta: string | null;

  @Column({ type: 'datetime', nullable: true })
  data_resposta: Date | null;

  @CreateDateColumn()
  data_criacao: Date;

  @ManyToOne(() => UsuarioEntity, (usuario) => usuario.contatoMensagens, { nullable: true })
  @JoinColumn({ name: 'id_usuario' })
  usuario: UsuarioEntity | null;
}
