import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('administradores')
export class AdministradorEntity {
  @PrimaryGeneratedColumn()
  id_admin: number;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column()
  senha: string;

  @Column({ nullable: true })
  foto_perfil: string | null;
}
