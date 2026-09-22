import { UsuarioEntity } from '../../../database/entities/usuario.entity';

// Porta (no sentido de Clean Architecture / Ports & Adapters): define O
// QUE um repositório de usuário precisa fazer, sem dizer COMO. Quem
// consome isso (services) depende só desta interface — nunca da classe
// concreta `UsuarioRepository`, que é só UM adapter possível (o que usa
// TypeORM). Trocar de TypeORM para outra coisa no futuro significaria
// escrever uma nova classe implementando esta mesma interface, sem tocar
// em nenhum service.
export interface IUsuarioRepository {
  findByEmail(email: string): Promise<UsuarioEntity | null>;
  findById(id: number): Promise<UsuarioEntity | null>;
  findByIdSafe(id: number): Promise<Partial<UsuarioEntity> | null>;
  findFirstAdmin(): Promise<UsuarioEntity | null>;
  create(data: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
    role?: string;
    status_id?: boolean;
  }): Promise<UsuarioEntity>;
  updateSenha(id: number, senhaHash: string): Promise<UsuarioEntity | null>;
  marcarEmailVerificado(id: number): Promise<unknown>;
  updatePerfil(id: number, data: Record<string, any>): Promise<Partial<UsuarioEntity> | null>;
  createCliente(data: {
    nome: string;
    email: string;
    senha: string;
    status_id: boolean;
  }): Promise<Partial<UsuarioEntity> | null>;
  updateCliente(id: number, data: Record<string, any>): Promise<Partial<UsuarioEntity> | null>;
  deleteById(id: number): Promise<void>;
  findClientes(params: { skip: number; take: number }): Promise<UsuarioEntity[]>;
  countClientes(sinceDate?: Date): Promise<number>;
}

// Símbolo usado como token de DI — interfaces TypeScript não existem em
// runtime, então o Nest não tem como resolver `@Inject(IUsuarioRepository)`
// diretamente. O token é o que liga "quem pede a interface" a "qual
// implementação concreta o módulo registrou para ela" (ver
// repositories.module.ts).
export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');
