import { Injectable } from '@nestjs/common';
import { User, UserProfile } from '../../../domain/entities';
import { UserRepository } from '../../../domain/repositories';
import { ImageStorage } from '../../ports';

export interface UpdateUserProfileInput {
  userId: number;
  name?: string;
  phone?: string;
  cpf?: string;
  /** Multipart bodies deliver this as a JSON string. */
  addresses?: unknown;
  birthDate?: Date | string | null;
  photo?: Buffer;
}

@Injectable()
export class UpdateUserProfileUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly images: ImageStorage,
  ) {}

  async execute(input: UpdateUserProfileInput): Promise<UserProfile | null> {
    let addresses = input.addresses;
    if (typeof addresses === 'string') {
      addresses = JSON.parse(addresses);
    }

    const changes: Partial<User> = {
      ...(input.name && { name: input.name.trim() }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.cpf !== undefined && { cpf: input.cpf }),
      ...(addresses !== undefined && { addresses }),
      ...(input.birthDate !== undefined && { birthDate: input.birthDate ? new Date(input.birthDate) : null }),
    };

    if (input.photo) {
      const photoUrl = await this.images.upload(input.photo);
      if (photoUrl) {
        changes.profilePhoto = photoUrl;
      }
    }

    const updated = await this.users.updateProfile(input.userId, changes);
    return updated ? updated.toProfile() : null;
  }
}
