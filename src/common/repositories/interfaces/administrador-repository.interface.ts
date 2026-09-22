import { AdministradorEntity } from '../../../database/entities/administrador.entity';

export interface IAdministradorRepository {
  findByEmail(email: string): Promise<AdministradorEntity | null>;
  findById(id: number): Promise<AdministradorEntity | null>;
  findByIdSafe(id: number): Promise<Partial<AdministradorEntity> | null>;
  findFirst(): Promise<AdministradorEntity | null>;
  updateSenha(id: number, senhaHash: string): Promise<unknown>;
  update(id: number, data: Record<string, any>): Promise<unknown>;
}

export const ADMINISTRADOR_REPOSITORY = Symbol('ADMINISTRADOR_REPOSITORY');
