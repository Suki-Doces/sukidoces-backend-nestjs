import { User } from '@domain/entities';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
  active?: boolean;
}

export interface CustomerOrderStats {
  user: User;
  totalSpent: number;
  orderCount: number;
}

export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: number): Promise<User | null>;
  abstract create(data: CreateUserData): Promise<User>;
  abstract updatePassword(id: number, passwordHash: string): Promise<void>;
  abstract markEmailVerified(id: number): Promise<void>;
  abstract updateProfile(id: number, data: Partial<User>): Promise<User | null>;
  abstract deleteById(id: number): Promise<void>;
  abstract findCustomersWithOrderStats(params: {
    skip: number;
    take: number;
  }): Promise<CustomerOrderStats[]>;
  abstract countCustomers(since?: Date): Promise<number>;
}
