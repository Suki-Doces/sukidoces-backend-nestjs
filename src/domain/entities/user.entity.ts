import type { Order } from './order.entity';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  addresses: unknown | null;
  birthDate: Date | null;
  profilePhoto: string | null;
  role: string | null;
  createdAt: Date;
  active: boolean | null;
  emailVerified: boolean;
}

export class User {
  id!: number;
  name!: string;
  email!: string;
  /** Password hash — never exposed (see toJSON). */
  password!: string;
  phone!: string | null;
  cpf!: string | null;
  addresses: unknown | null;
  birthDate!: Date | null;
  profilePhoto!: string | null;
  role!: string | null;
  active!: boolean | null;
  emailVerified!: boolean;
  createdAt!: Date;
  orders?: Order[];

  constructor(props?: Partial<User>) {
    if (props) Object.assign(this, props);
  }

  /** Public projection of the user, without the password hash. */
  toProfile(): UserProfile {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      cpf: this.cpf,
      addresses: this.addresses,
      birthDate: this.birthDate,
      profilePhoto: this.profilePhoto,
      role: this.role,
      createdAt: this.createdAt,
      active: this.active,
      emailVerified: this.emailVerified,
    };
  }

  /** Safety net: serializing a User can never leak the password hash. */
  toJSON(): UserProfile {
    return this.toProfile();
  }
}
