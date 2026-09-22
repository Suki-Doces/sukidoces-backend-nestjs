import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioEntity } from '../../database/entities/usuario.entity';
import { UserRole } from '../enums/user-role.enum';
import { IUsuarioRepository } from './interfaces/usuario-repository.interface';

@Injectable()
export class UsuarioRepository implements IUsuarioRepository {
  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly repo: Repository<UsuarioEntity>,
  ) {}

  private readonly SAFE_SELECT: (keyof UsuarioEntity)[] = [
    'id_usuario',
    'nome',
    'email',
    'telefone',
    'cpf',
    'enderecos',
    'data_nascimento',
    'foto_perfil',
    'role',
    'data_criacao',
    'status_id',
    'email_verificado',
  ];

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id_usuario: id } });
  }

  findByIdSafe(id: number) {
    return this.repo.findOne({ where: { id_usuario: id }, select: this.SAFE_SELECT });
  }

  findFirstAdmin() {
    return this.repo.findOne({ where: { role: UserRole.ADMIN } });
  }

  create(data: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
    role?: string;
    status_id?: boolean;
  }) {
    return this.repo.save(this.repo.create(data));
  }

  async updateSenha(id: number, senhaHash: string) {
    await this.repo.update({ id_usuario: id }, { senha: senhaHash });
    return this.findById(id);
  }

  marcarEmailVerificado(id: number) {
    return this.repo.update({ id_usuario: id }, { email_verificado: true });
  }

  async updatePerfil(id: number, data: Record<string, any>) {
    await this.repo.update({ id_usuario: id }, data);
    return this.findByIdSafe(id);
  }

  createCliente(data: { nome: string; email: string; senha: string; status_id: boolean }) {
    const usuario = this.repo.create({ ...data, role: UserRole.CLIENTE });
    return this.repo.save(usuario).then((saved) => this.findByIdSafe(saved.id_usuario));
  }

  async updateCliente(id: number, data: Record<string, any>) {
    await this.repo.update({ id_usuario: id }, data);
    return this.findByIdSafe(id);
  }

  async deleteById(id: number) {
    await this.repo.delete({ id_usuario: id });
  }

  findClientes(params: { skip: number; take: number }) {
    return this.repo.find({
      where: { role: UserRole.CLIENTE },
      relations: ['pedidos'],
      order: { data_criacao: 'DESC' },
      take: params.take,
      skip: params.skip,
    });
  }

  countClientes(sinceDate?: Date) {
    return this.repo
      .createQueryBuilder('usuario')
      .where('usuario.role = :role', { role: UserRole.CLIENTE })
      .andWhere(sinceDate ? 'usuario.data_criacao >= :sinceDate' : '1=1', { sinceDate })
      .getCount();
  }
}
