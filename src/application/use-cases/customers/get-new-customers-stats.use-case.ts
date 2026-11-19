import { Injectable } from '@nestjs/common';
import { UserRepository } from '@domain/repositories';
import { InternalError } from '@application/errors';

@Injectable()
export class GetNewCustomersStatsUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(): Promise<{ totalNew: number }> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return { totalNew: await this.users.countCustomers(sevenDaysAgo) };
    } catch {
      throw new InternalError('Error fetching statistics');
    }
  }
}
