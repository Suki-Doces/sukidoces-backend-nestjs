import { Admin } from '../entities';

export abstract class AdminRepository {
  abstract findByEmail(email: string): Promise<Admin | null>;
  abstract findById(id: number): Promise<Admin | null>;
  abstract findFirst(): Promise<Admin | null>;
  abstract updatePassword(id: number, passwordHash: string): Promise<void>;
  abstract update(id: number, data: Partial<Admin>): Promise<void>;
}
