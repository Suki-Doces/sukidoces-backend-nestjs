import { Injectable } from '@nestjs/common';
import { AdminProfile } from '../../../domain/entities';
import { AdminRepository } from '../../../domain/repositories';
import { NotFoundError } from '../../errors/application-errors';

@Injectable()
export class GetAdminProfileUseCase {
  constructor(private readonly admins: AdminRepository) {}

  async execute(adminId: number): Promise<AdminProfile> {
    const admin = await this.admins.findById(adminId);
    if (!admin) {
      throw new NotFoundError('Admin not found');
    }
    return admin.toProfile();
  }
}
