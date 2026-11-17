import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RefreshTokenStore, UnitOfWork } from '../../application/ports';
import {
  AdminRepository,
  CartRepository,
  CategoryRepository,
  ContactMessageRepository,
  CouponRepository,
  FeatureFlagRepository,
  NotificationRepository,
  OrderRepository,
  ProductRepository,
  UserRepository,
  WebhookRepository,
} from '../../domain/repositories';
import {
  AdminSchema,
  CartItemSchema,
  CategorySchema,
  ContactMessageSchema,
  CouponSchema,
  FeatureFlagSchema,
  NotificationSchema,
  OrderItemSchema,
  OrderSchema,
  ProductSchema,
  RefreshSessionSchema,
  UserSchema,
  WebhookSchema,
} from './schemas/schemas';
import { TypeOrmAdminRepository } from './repositories/typeorm-admin.repository';
import { TypeOrmCartRepository } from './repositories/typeorm-cart.repository';
import { TypeOrmCategoryRepository } from './repositories/typeorm-category.repository';
import { TypeOrmContactMessageRepository } from './repositories/typeorm-contact-message.repository';
import { TypeOrmCouponRepository } from './repositories/typeorm-coupon.repository';
import { TypeOrmFeatureFlagRepository } from './repositories/typeorm-feature-flag.repository';
import { TypeOrmNotificationRepository } from './repositories/typeorm-notification.repository';
import { TypeOrmOrderRepository } from './repositories/typeorm-order.repository';
import { TypeOrmProductRepository } from './repositories/typeorm-product.repository';
import { TypeOrmRefreshTokenStore } from './repositories/typeorm-refresh-token-store';
import { TypeOrmUserRepository } from './repositories/typeorm-user.repository';
import { TypeOrmWebhookRepository } from './repositories/typeorm-webhook.repository';
import { TypeOrmUnitOfWork } from './typeorm-unit-of-work';

/** Binds every domain repository contract to its TypeORM implementation. */
@Module({
  providers: [
    { provide: UserRepository, useFactory: (ds: DataSource) => new TypeOrmUserRepository(ds.getRepository(UserSchema)), inject: [DataSource] },
    { provide: AdminRepository, useFactory: (ds: DataSource) => new TypeOrmAdminRepository(ds.getRepository(AdminSchema)), inject: [DataSource] },
    { provide: CategoryRepository, useFactory: (ds: DataSource) => new TypeOrmCategoryRepository(ds.getRepository(CategorySchema)), inject: [DataSource] },
    { provide: ProductRepository, useFactory: (ds: DataSource) => new TypeOrmProductRepository(ds.getRepository(ProductSchema)), inject: [DataSource] },
    { provide: CouponRepository, useFactory: (ds: DataSource) => new TypeOrmCouponRepository(ds.getRepository(CouponSchema)), inject: [DataSource] },
    {
      provide: OrderRepository,
      useFactory: (ds: DataSource) => new TypeOrmOrderRepository(ds.getRepository(OrderSchema), ds.getRepository(OrderItemSchema)),
      inject: [DataSource],
    },
    { provide: CartRepository, useFactory: (ds: DataSource) => new TypeOrmCartRepository(ds.getRepository(CartItemSchema)), inject: [DataSource] },
    { provide: NotificationRepository, useFactory: (ds: DataSource) => new TypeOrmNotificationRepository(ds.getRepository(NotificationSchema)), inject: [DataSource] },
    { provide: RefreshTokenStore, useFactory: (ds: DataSource) => new TypeOrmRefreshTokenStore(ds.getRepository(RefreshSessionSchema)), inject: [DataSource] },
    { provide: ContactMessageRepository, useFactory: (ds: DataSource) => new TypeOrmContactMessageRepository(ds.getRepository(ContactMessageSchema)), inject: [DataSource] },
    { provide: WebhookRepository, useFactory: (ds: DataSource) => new TypeOrmWebhookRepository(ds.getRepository(WebhookSchema)), inject: [DataSource] },
    { provide: FeatureFlagRepository, useFactory: (ds: DataSource) => new TypeOrmFeatureFlagRepository(ds.getRepository(FeatureFlagSchema)), inject: [DataSource] },
    { provide: UnitOfWork, useClass: TypeOrmUnitOfWork },
  ],
  exports: [
    UserRepository, AdminRepository, CategoryRepository, ProductRepository, CouponRepository, OrderRepository,
    CartRepository, NotificationRepository, RefreshTokenStore, ContactMessageRepository, WebhookRepository, FeatureFlagRepository, UnitOfWork,
  ],
})
export class PersistenceModule {}
