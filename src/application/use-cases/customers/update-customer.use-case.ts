import { Injectable } from '@nestjs/common';
import { User, UserProfile } from '../../../domain/entities';
import { UserRepository } from '../../../domain/repositories';
import { InternalError } from '../../errors/application-errors';
import { PasswordHasher } from '../../ports';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(id: number, input: { name?: string; active?: boolean; password?: string }): Promise<UserProfile | null> {
    try {
      const changes: Partial<User> = {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.active !== undefined && { active: input.active }),
      };

      if (input.password && input.password.trim() !== '') {
        changes.password = await this.hasher.hash(input.password);
      }

      const updated = await this.users.updateProfile(id, changes);
      return updated ? updated.toProfile() : null;
    } catch {
      throw new InternalError('Error updating customer');
    }
  }
}
