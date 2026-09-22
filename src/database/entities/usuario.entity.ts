import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PedidoEntity } from './pedido.entity';
import { CarrinhoItemEntity } from './carrinho-item.entity';
import { NotificacaoEntity } from './notificacao.entity';
import { ContatoMensagemEntity } from './contato-mensagem.entity';

@Entity('usuario')
export class UsuarioEntity {
  @PrimaryGeneratedColumn()
  id_usuario: number;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column()
  senha: string;

  @Column({ nullable: true })
  telefone: string | null;

  @Column({ nullable: true })
  cpf: string | null;

  @Column({ type: 'json', nullable: true })
  enderecos: any | null;

  @Column({ type: 'date', nullable: true })
  data_nascimento: Date | null;

  @Column({ nullable: true })
  foto_perfil: string | null;

  @Column({ nullable: true })
  role: string | null;

  @Column({ nullable: true })
  status_id: boolean | null;

  @Column({ default: false })
  email_verificado: boolean;

  @CreateDateColumn()
  data_criacao: Date;

  @OneToMany(() => PedidoEntity, (pedido) => pedido.usuario)
  pedidos: PedidoEntity[];

  @OneToMany(() => CarrinhoItemEntity, (item) => item.usuario)
  carrinho_itens: CarrinhoItemEntity[];

  @OneToMany(() => NotificacaoEntity, (notificacao) => notificacao.usuario)
  notificacoes: NotificacaoEntity[];

  @OneToMany(() => ContatoMensagemEntity, (contato) => contato.usuario)
  contatoMensagens: ContatoMensagemEntity[];
}
