import { Repository } from 'typeorm';
import { Order, OrderItem } from '@domain/entities';
import { NewOrderItem, OrderAggregateCriteria, OrderRepository } from '@domain/repositories';

export class TypeOrmOrderRepository implements OrderRepository {
  constructor(
    private readonly orders: Repository<Order>,
    private readonly items: Repository<OrderItem>,
  ) {}

  findById(id: number) {
    return this.orders.findOne({ where: { id } });
  }

  findByIdempotencyKey(userId: number, key: string) {
    return this.orders.findOne({ where: { userId, idempotencyKey: key } });
  }

  findByIdWithItems(id: number) {
    return this.orders.findOne({ where: { id }, relations: { items: true } });
  }

  findAllWithDetails() {
    return this.orders.find({
      order: { createdAt: 'DESC' },
      relations: { user: true, items: { product: true } },
    });
  }

  findByUser(userId: number) {
    return this.orders.find({
      where: { userId },
      relations: { items: { product: true } },
      order: { createdAt: 'DESC' },
    });
  }

  countByStatus(status?: string) {
    return this.orders.count({ where: status ? { status } : {} });
  }

  async aggregate(criteria: OrderAggregateCriteria) {
    const query = this.orders.createQueryBuilder('order').where('1 = 1');

    if (criteria.statuses)
      query.andWhere('order.status IN (:...statuses)', { statuses: criteria.statuses });
    if (criteria.status) query.andWhere('order.status = :status', { status: criteria.status });
    if (criteria.from) query.andWhere('order.createdAt >= :from', { from: criteria.from });
    if (criteria.to) query.andWhere('order.createdAt < :to', { to: criteria.to });

    const row = await query
      .select('COALESCE(SUM(order.totalAmount), 0)', 'sum')
      .addSelect('COUNT(order.id)', 'count')
      .getRawOne();

    return { totalAmount: parseFloat(row.sum) || 0, count: parseInt(row.count, 10) || 0 };
  }

  findRecent(take: number) {
    return this.orders.find({ take, order: { createdAt: 'DESC' }, relations: { user: true } });
  }

  async bestSellingProducts(take: number) {
    const rows = await this.items
      .createQueryBuilder('item')
      .select('item.productId', 'productId')
      .addSelect('SUM(item.quantity)', 'total')
      .groupBy('item.productId')
      .orderBy('total', 'DESC')
      .limit(take)
      .getRawMany();

    return rows.map((row) => ({
      productId: Number(row.productId),
      totalQuantity: Number(row.total),
    }));
  }

  async createWithItems(order: Order, items: NewOrderItem[]) {
    const saved = await this.orders.save(order);
    if (items.length > 0) {
      await this.items.save(items.map((item) => this.items.create({ orderId: saved.id, ...item })));
    }
    return saved;
  }

  async updateStatus(id: number, status: string) {
    await this.orders.update({ id }, { status });
    return this.findById(id);
  }
}
