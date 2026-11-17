import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../domain/repositories';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../errors/application-errors';
import { PasswordHasher } from '../../ports';

export interface ChangePasswordInput {
  userId: number;
  currentPassword?: string;
  newPassword?: string;
}

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const { currentPassword, newPassword } = input;

    if (!currentPassword || !newPassword) {
      throw new BadRequestError('Current and new password are required');
    }
    if (newPassword.length < 6) {
      throw new BadRequestError('The new password must be at least 6 characters long');
    }

    const user = await this.users.findById(input.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!(await this.hasher.compare(currentPassword, user.password))) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    await this.users.updatePassword(user.id, await this.hasher.hash(newPassword));
  }
}
