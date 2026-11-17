import { Repository } from 'typeorm';
import { User } from '../../../domain/entities';
import { UserRole } from '../../../domain/enums';
import { CreateUserData, UserRepository } from '../../../domain/repositories';
import { OrderSchema } from '../schemas/schemas';

export class TypeOrmUserRepository implements UserRepository {
  constructor(private readonly repo: Repository<User>) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: CreateUserData) {
    return this.repo.save(this.repo.create(data));
  }

  async updatePassword(id: number, passwordHash: string) {
    await this.repo.update({ id }, { password: passwordHash });
  }

  async markEmailVerified(id: number) {
    await this.repo.update({ id }, { emailVerified: true });
  }

  async updateProfile(id: number, data: Partial<User>) {
    await this.repo.update({ id }, data as any);
    return this.findById(id);
  }

  async deleteById(id: number) {
    await this.repo.delete({ id });
  }

  async findCustomersWithOrderStats(params: { skip: number; take: number }) {
    const { entities, raw } = await this.repo
      .createQueryBuilder('user')
      .leftJoin(
        (query) =>
          query
            .select('orders.userId', 'userId')
            .addSelect('SUM(orders.totalAmount)', 'totalSpent')
            .addSelect('COUNT(orders.id)', 'orderCount')
            .from(OrderSchema, 'orders')
            .groupBy('orders.userId'),
        'orderStats',
        'orderStats.userId = user.id',
      )
      .where('user.role = :role', { role: UserRole.CUSTOMER })
      .select('user')
      .addSelect('COALESCE(orderStats.totalSpent, 0)', 'totalSpent')
      .addSelect('COALESCE(orderStats.orderCount, 0)', 'orderCount')
      .orderBy('user.createdAt', 'DESC')
      .take(params.take)
      .skip(params.skip)
      .getRawAndEntities();

    return entities.map((user, index) => ({
      user,
      totalSpent: Number(raw[index].totalSpent),
      orderCount: Number(raw[index].orderCount),
    }));
  }

  countCustomers(since?: Date) {
    const query = this.repo.createQueryBuilder('user').where('user.role = :role', { role: UserRole.CUSTOMER });
    if (since) query.andWhere('user.createdAt >= :since', { since });
    return query.getCount();
  }
}
