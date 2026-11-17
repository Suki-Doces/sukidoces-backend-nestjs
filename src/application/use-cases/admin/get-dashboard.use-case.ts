import { Injectable } from '@nestjs/common';
import { OrderStatus, SALE_STATUSES } from '../../../domain/enums';
import { OrderRepository, ProductRepository } from '../../../domain/repositories';

export interface DashboardView {
  summary: {
    weekSales: number;
    salesGrowth: number;
    previousWeekSales: number;
    weekOrders: number;
    ordersGrowth: number;
    previousWeekOrders: number;
    pending: number;
    cancelled: number;
    totalSales: number;
    totalOrders: number;
  };
  topProducts: { productId: number; name: string; sales: number; price: number; image: string | null; inStock: boolean }[];
  transactions: { orderId: number; customerName: string; createdAt: Date; status: string; totalAmount: number }[];
}

const growth = (current: number, previous: number): number =>
  previous > 0 ? Number((((current - previous) / previous) * 100).toFixed(1)) : 0;

@Injectable()
export class GetDashboardUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(): Promise<DashboardView> {
    const totalOrders = await this.orders.countByStatus();
    const pending = await this.orders.countByStatus(OrderStatus.PENDING);
    const cancelled = await this.orders.countByStatus(OrderStatus.CANCELLED);

    const totalSales = await this.orders.aggregate({ statuses: SALE_STATUSES });

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const previousWeekStart = new Date(now);
    previousWeekStart.setDate(now.getDate() - 14);

    const week = await this.orders.aggregate({ statuses: SALE_STATUSES, from: weekStart });
    const previousWeek = await this.orders.aggregate({ statuses: SALE_STATUSES, from: previousWeekStart, to: weekStart });

    const best = await this.orders.bestSellingProducts(5);
    const details = await this.products.findBasicInfoByIds(best.map((item) => item.productId));

    const topProducts = best.map((item) => {
      const product = details.find((candidate) => candidate.id === item.productId);
      return {
        productId: item.productId,
        name: product?.name || 'Product',
        sales: item.totalQuantity || 0,
        price: Number(product?.price || 0),
        image: product?.image ?? null,
        inStock: (product?.quantity ?? 0) > 0,
      };
    });

    const recent = await this.orders.findRecent(10);

    return {
      summary: {
        weekSales: week.totalAmount,
        salesGrowth: growth(week.totalAmount, previousWeek.totalAmount),
        previousWeekSales: previousWeek.totalAmount,
        weekOrders: week.count,
        ordersGrowth: growth(week.count, previousWeek.count),
        previousWeekOrders: previousWeek.count,
        pending,
        cancelled,
        totalSales: totalSales.totalAmount,
        totalOrders,
      },
      topProducts,
      transactions: recent.map((order) => ({
        orderId: order.id,
        customerName: order.user?.name || `#${order.id}`,
        createdAt: order.createdAt,
        status: order.status,
        totalAmount: Number(order.totalAmount),
      })),
    };
  }
}
