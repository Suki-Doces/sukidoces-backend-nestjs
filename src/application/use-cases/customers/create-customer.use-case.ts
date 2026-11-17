import { Injectable } from '@nestjs/common';
import { UserProfile } from '../../../domain/entities';
import { UserRole } from '../../../domain/enums';
import { UserRepository } from '../../../domain/repositories';
import { InternalError } from '../../errors/application-errors';
import { PasswordHasher } from '../../ports';

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: { name: string; email: string; password: string; active: boolean }): Promise<UserProfile> {
    try {
      const customer = await this.users.create({
        name: input.name,
        email: input.email,
        password: await this.hasher.hash(input.password),
        role: UserRole.CUSTOMER,
        active: input.active,
      });
      return customer.toProfile();
    } catch {
      throw new InternalError('Error creating customer');
    }
  }
}
