import { Injectable } from '@nestjs/common';
import { Admin } from '../../../domain/entities';
import { AdminRepository } from '../../../domain/repositories';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../errors/application-errors';
import { ImageStorage, PasswordHasher } from '../../ports';

export interface UpdateAdminProfileInput {
  adminId: number;
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  photo?: Buffer;
}

@Injectable()
export class UpdateAdminProfileUseCase {
  constructor(
    private readonly admins: AdminRepository,
    private readonly hasher: PasswordHasher,
    private readonly images: ImageStorage,
  ) {}

  async execute(input: UpdateAdminProfileInput): Promise<void> {
    const admin = await this.admins.findById(input.adminId);
    if (!admin) {
      throw new NotFoundError('Admin not found');
    }

    const changes: Partial<Admin> = {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.email !== undefined && { email: input.email }),
    };

    if (input.photo) {
      const photoUrl = await this.images.upload(input.photo);
      if (photoUrl) changes.profilePhoto = photoUrl;
    }

    if (input.newPassword && input.newPassword.trim() !== '') {
      if (!input.currentPassword) {
        throw new BadRequestError('Enter the current password to change the password.');
      }
      if (!(await this.hasher.compare(input.currentPassword, admin.password))) {
        throw new UnauthorizedError('The current password is incorrect.');
      }
      changes.password = await this.hasher.hash(input.newPassword);
    }

    await this.admins.update(input.adminId, changes);
  }
}
