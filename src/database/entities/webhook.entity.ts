import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('webhooks')
export class WebhookEntity {
  @PrimaryGeneratedColumn()
  id_webhook: number;

  @Column()
  url: string;

  @Column('text')
  eventos: string;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn()
  criado_em: Date;
}
