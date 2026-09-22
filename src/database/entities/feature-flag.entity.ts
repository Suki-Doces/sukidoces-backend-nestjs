import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('featureFlags')
export class FeatureFlagEntity {
  @PrimaryColumn()
  chave: string;

  @Column({ default: false })
  ativo: boolean;

  @UpdateDateColumn()
  atualizado: Date;
}
