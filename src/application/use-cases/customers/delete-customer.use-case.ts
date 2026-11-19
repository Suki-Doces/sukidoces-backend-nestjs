import { Injectable } from '@nestjs/common';
import { UserRepository } from '@domain/repositories';
import { InternalError } from '@application/errors';

@Injectable()
export class DeleteCustomerUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(id: number): Promise<void> {
    try {
      await this.users.deleteById(id);
    } catch {
      throw new InternalError('Error deleting customer');
    }
  }
}
