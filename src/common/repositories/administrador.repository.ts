import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdministradorEntity } from '../../database/entities/administrador.entity';
import { IAdministradorRepository } from './interfaces/administrador-repository.interface';

@Injectable()
export class AdministradorRepository implements IAdministradorRepository {
  constructor(
    @InjectRepository(AdministradorEntity)
    private readonly repo: Repository<AdministradorEntity>,
  ) {}

  private readonly SAFE_SELECT: (keyof AdministradorEntity)[] = [
    'id_admin',
    'nome',
    'email',
    'foto_perfil',
  ];

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id_admin: id } });
  }

  findByIdSafe(id: number) {
    return this.repo.findOne({ where: { id_admin: id }, select: this.SAFE_SELECT });
  }

  async findFirst() {
    const [admin] = await this.repo.find({ take: 1 });
    return admin ?? null;
  }

  updateSenha(id: number, senhaHash: string) {
    return this.repo.update({ id_admin: id }, { senha: senhaHash });
  }

  update(id: number, data: Record<string, any>) {
    return this.repo.update({ id_admin: id }, data);
  }
}
