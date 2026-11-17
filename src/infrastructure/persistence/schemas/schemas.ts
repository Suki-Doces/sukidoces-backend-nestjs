import { EntitySchema } from 'typeorm';
import {
  Admin,
  CartItem,
  Category,
  ContactMessage,
  Coupon,
  FeatureFlag,
  Notification,
  Order,
  OrderItem,
  Product,
  RefreshSession,
  User,
  Webhook,
} from '../../../domain/entities';
import { decimalTransformer } from '../decimal.transformer';

/*
 * The domain entities are plain classes. These schemas are the ONLY place that
 * knows how they map to the database; schema changes are applied through migrations.
 */

const decimal = { type: 'decimal' as const, precision: 10, scale: 2, transformer: decimalTransformer };

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  target: User,
  tableName: 'usuario',
  columns: {
    id: { type: Number, name: 'id_usuario', primary: true, generated: 'increment' },
    name: { type: String, name: 'nome' },
    email: { type: String, unique: true },
    password: { type: String, name: 'senha' },
    phone: { type: String, name: 'telefone', nullable: true },
    cpf: { type: String, nullable: true },
    addresses: { type: 'json', name: 'enderecos', nullable: true },
    birthDate: { type: 'date', name: 'data_nascimento', nullable: true },
    profilePhoto: { type: String, name: 'foto_perfil', nullable: true },
    role: { type: String, nullable: true },
    active: { type: Boolean, name: 'status_id', nullable: true },
    emailVerified: { type: Boolean, name: 'email_verificado', default: false },
    createdAt: { type: Date, name: 'data_criacao', createDate: true },
  },
  relations: {
    orders: { type: 'one-to-many', target: 'Order', inverseSide: 'user' },
  },
});

export const AdminSchema = new EntitySchema<Admin>({
  name: 'Admin',
  target: Admin,
  tableName: 'administradores',
  columns: {
    id: { type: Number, name: 'id_admin', primary: true, generated: 'increment' },
    name: { type: String, name: 'nome' },
    email: { type: String, unique: true },
    password: { type: String, name: 'senha' },
    profilePhoto: { type: String, name: 'foto_perfil', nullable: true },
  },
});

export const CategorySchema = new EntitySchema<Category>({
  name: 'Category',
  target: Category,
  tableName: 'categorias',
  columns: {
    id: { type: Number, name: 'id_categoria', primary: true, generated: 'increment' },
    name: { type: String, name: 'nome' },
    description: { type: String, name: 'descricao', nullable: true },
  },
});

export const ProductSchema = new EntitySchema<Product>({
  name: 'Product',
  target: Product,
  tableName: 'produtos',
  columns: {
    id: { type: Number, name: 'id_produto', primary: true, generated: 'increment' },
    name: { type: String, name: 'nome' },
    description: { type: String, name: 'descricao', nullable: true },
    price: { ...decimal, name: 'preco' },
    quantity: { type: Number, name: 'quantidade', default: 0 },
    image: { type: String, name: 'imagem', nullable: true },
    active: { type: Boolean, name: 'ativo', default: true },
    categoryId: { type: Number, name: 'id_categoria', nullable: true },
    createdAt: { type: Date, name: 'data_criacao', createDate: true },
  },
  indices: [{ columns: ['active'] }, { columns: ['categoryId'] }, { columns: ['createdAt'] }],
  relations: {
    category: {
      type: 'many-to-one',
      target: 'Category',
      joinColumn: { name: 'id_categoria' },
      nullable: true,
    },
  },
});

export const CouponSchema = new EntitySchema<Coupon>({
  name: 'Coupon',
  target: Coupon,
  tableName: 'cupons',
  columns: {
    id: { type: Number, name: 'id_cupom', primary: true, generated: 'increment' },
    code: { type: String, name: 'codigo', unique: true },
    type: { type: String, name: 'tipo' },
    value: { ...decimal, name: 'valor' },
    expiresAt: { type: 'datetime', name: 'validade', nullable: true },
    active: { type: Boolean, name: 'ativo', default: true },
  },
});

export const OrderSchema = new EntitySchema<Order>({
  name: 'Order',
  target: Order,
  tableName: 'pedidos',
  columns: {
    id: { type: Number, name: 'id_pedido', primary: true, generated: 'increment' },
    userId: { type: Number, name: 'id_usuario' },
    totalAmount: { ...decimal, name: 'valor_total' },
    status: { type: String },
    paymentMethod: { type: String, name: 'metodo_pagamento', nullable: true },
    couponId: { type: Number, name: 'id_cupom', nullable: true },
    idempotencyKey: { type: String, name: 'idempotency_key', length: 255, nullable: true },
    requestHash: { type: String, name: 'request_hash', length: 64, nullable: true },
    createdAt: { type: Date, name: 'data_pedido', createDate: true },
  },
  indices: [
    { columns: ['userId'] },
    { columns: ['status'] },
    { columns: ['createdAt'] },
    { columns: ['userId', 'idempotencyKey'], unique: true },
  ],
  relations: {
    user: { type: 'many-to-one', target: 'User', joinColumn: { name: 'id_usuario' }, inverseSide: 'orders' },
    coupon: { type: 'many-to-one', target: 'Coupon', joinColumn: { name: 'id_cupom' }, nullable: true },
    items: { type: 'one-to-many', target: 'OrderItem', inverseSide: 'order' },
  },
});

export const OrderItemSchema = new EntitySchema<OrderItem>({
  name: 'OrderItem',
  target: OrderItem,
  tableName: 'itens_pedido',
  columns: {
    id: { type: Number, name: 'id_item', primary: true, generated: 'increment' },
    orderId: { type: Number, name: 'id_pedido' },
    productId: { type: Number, name: 'id_produto' },
    quantity: { type: Number, name: 'quantidade' },
    unitPrice: { ...decimal, name: 'preco_unitario' },
  },
  indices: [{ columns: ['productId'] }],
  relations: {
    order: { type: 'many-to-one', target: 'Order', joinColumn: { name: 'id_pedido' }, inverseSide: 'items' },
    product: { type: 'many-to-one', target: 'Product', joinColumn: { name: 'id_produto' } },
  },
});

export const CartItemSchema = new EntitySchema<CartItem>({
  name: 'CartItem',
  target: CartItem,
  tableName: 'carrinho_itens',
  columns: {
    id: { type: Number, name: 'id', primary: true, generated: 'increment' },
    userId: { type: Number, name: 'usuario_id' },
    productId: { type: Number, name: 'id_produto' },
    quantity: { type: Number, name: 'quantidade' },
    addedAt: { type: Date, name: 'data_adicionado', createDate: true },
  },
  indices: [{ columns: ['userId'] }],
  relations: {
    user: { type: 'many-to-one', target: 'User', joinColumn: { name: 'usuario_id' } },
    product: { type: 'many-to-one', target: 'Product', joinColumn: { name: 'id_produto' } },
  },
});

export const NotificationSchema = new EntitySchema<Notification>({
  name: 'Notification',
  target: Notification,
  tableName: 'notificacoes',
  columns: {
    id: { type: Number, name: 'id_notificacao', primary: true, generated: 'increment' },
    userId: { type: Number, name: 'id_usuario', nullable: true },
    adminId: { type: Number, name: 'id_admin', nullable: true },
    title: { type: String, name: 'titulo' },
    message: { type: String, name: 'mensagem' },
    type: { type: String, name: 'tipo' },
    isRead: { type: Boolean, name: 'lido', default: false },
    createdAt: { type: Date, name: 'data_criacao', createDate: true },
  },
  indices: [{ columns: ['userId', 'isRead'] }, { columns: ['adminId', 'isRead'] }],
  relations: {
    user: { type: 'many-to-one', target: 'User', joinColumn: { name: 'id_usuario' }, nullable: true },
    admin: { type: 'many-to-one', target: 'Admin', joinColumn: { name: 'id_admin' }, nullable: true },
  },
});

export const RefreshSessionSchema = new EntitySchema<RefreshSession>({
  name: 'RefreshSession',
  target: RefreshSession,
  tableName: 'refresh_sessions',
  columns: {
    tokenHash: { type: String, name: 'token_hash', length: 64, primary: true },
    userId: { type: Number, name: 'user_id' },
    role: { type: String, nullable: true },
    expiresAt: { type: 'datetime', name: 'expires_at' },
  },
  indices: [{ columns: ['expiresAt'] }],
});

export const ContactMessageSchema = new EntitySchema<ContactMessage>({
  name: 'ContactMessage',
  target: ContactMessage,
  tableName: 'contatoMensagens',
  columns: {
    id: { type: Number, name: 'id_contato', primary: true, generated: 'increment' },
    name: { type: String, name: 'nome' },
    email: { type: String },
    phone: { type: String, name: 'telefone' },
    subject: { type: String, name: 'assunto' },
    message: { type: String, name: 'mensagem' },
    userId: { type: Number, name: 'id_usuario', nullable: true },
    answered: { type: Boolean, name: 'respondido', default: false },
    answer: { type: String, name: 'resposta', nullable: true },
    answeredAt: { type: 'datetime', name: 'data_resposta', nullable: true },
    createdAt: { type: Date, name: 'data_criacao', createDate: true },
  },
  indices: [{ columns: ['userId'] }],
  relations: {
    user: { type: 'many-to-one', target: 'User', joinColumn: { name: 'id_usuario' }, nullable: true },
  },
});

export const WebhookSchema = new EntitySchema<Webhook>({
  name: 'Webhook',
  target: Webhook,
  tableName: 'webhooks',
  columns: {
    id: { type: Number, name: 'id_webhook', primary: true, generated: 'increment' },
    url: { type: String },
    events: { type: 'text', name: 'eventos' },
    active: { type: Boolean, name: 'ativo', default: true },
    createdAt: { type: Date, name: 'criado_em', createDate: true },
  },
});

export const FeatureFlagSchema = new EntitySchema<FeatureFlag>({
  name: 'FeatureFlag',
  target: FeatureFlag,
  tableName: 'featureFlags',
  columns: {
    key: { type: String, name: 'chave', primary: true },
    enabled: { type: Boolean, name: 'ativo', default: false },
    updatedAt: { type: Date, name: 'atualizado', updateDate: true },
  },
});

export const allSchemas = [
  UserSchema,
  AdminSchema,
  CategorySchema,
  ProductSchema,
  CouponSchema,
  OrderSchema,
  OrderItemSchema,
  CartItemSchema,
  NotificationSchema,
  RefreshSessionSchema,
  ContactMessageSchema,
  WebhookSchema,
  FeatureFlagSchema,
];
