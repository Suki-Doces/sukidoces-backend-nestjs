import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../domain/repositories';
import { buildPagination, clampPagination, Pagination } from '../../common/pagination';
import { InternalError } from '../../errors/application-errors';

export interface CustomerView {
  id: number;
  name: string;
  phone: string | null;
  email: string;
  registeredAt: Date;
  active: boolean;
  totalSpent: number;
  orderCount: number;
}

export interface ListCustomersResult {
  customers: CustomerView[];
  pagination: Pagination;
  newCustomersLast7Days: number;
}

@Injectable()
export class ListCustomersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: { page?: string; limit?: string }): Promise<ListCustomersResult> {
    try {
      const { page, limit, skip } = clampPagination(input.page, input.limit, 10);

      const customers = await this.users.findCustomersWithOrderStats({ skip, take: limit });
      const views: CustomerView[] = customers.map(({ user: customer, totalSpent, orderCount }) => {
        return {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          registeredAt: customer.createdAt,
          active: !!customer.active,
          totalSpent,
          orderCount,
        };
      });

      const total = await this.users.countCustomers();

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const newCustomersLast7Days = await this.users.countCustomers(sevenDaysAgo);

      return { customers: views, pagination: buildPagination(total, page, limit), newCustomersLast7Days };
    } catch {
      throw new InternalError('Error fetching customers');
    }
  }
}
