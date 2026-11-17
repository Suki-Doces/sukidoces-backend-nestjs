import { Injectable } from '@nestjs/common';
import { UserProfile } from '../../../domain/entities';
import { UserRepository } from '../../../domain/repositories';
import { NotFoundError } from '../../errors/application-errors';

@Injectable()
export class GetUserProfileUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: number): Promise<UserProfile> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user.toProfile();
  }
}
