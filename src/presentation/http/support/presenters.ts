import {
  AdminProfile,
  Category,
  ContactMessage,
  FeatureFlag,
  Notification,
  Order,
  OrderItem,
  Product,
  UserProfile,
  Webhook,
} from '@domain/entities';
import { DashboardView } from '@application/use-cases/admin';
import { AdminOrderView } from '@application/use-cases/orders';
import { CartSummary } from '@application/use-cases/cart';
import { ListCustomersResult } from '@application/use-cases/customers';
import { LoginResult, RegisterUserResult } from '@application/use-cases/auth';

export const presentCategory = (category: Category) => ({
  id_categoria: category.id,
  nome: category.name,
  descricao: category.description,
});

export const presentProduct = (product: Product) => ({
  id_produto: product.id,
  nome: product.name,
  descricao: product.description,
  preco: product.price,
  quantidade: product.quantity,
  imagem: product.image,
  ativo: product.active,
  id_categoria: product.categoryId,
  data_criacao: product.createdAt,
  ...(product.category !== undefined && {
    categorias: product.category ? presentCategory(product.category) : null,
  }),
});

export const presentOrderItem = (item: OrderItem) => ({
  id_item: item.id,
  id_pedido: item.orderId,
  id_produto: item.productId,
  quantidade: item.quantity,
  preco_unitario: item.unitPrice,
  ...(item.product !== undefined && {
    produtos: item.product ? presentProduct(item.product) : null,
  }),
});

export const presentOrder = (order: Order) => ({
  id_pedido: order.id,
  id_usuario: order.userId,
  valor_total: Number(order.totalAmount),
  valor_frete: Number(order.shippingAmount ?? 0),
  status: order.status,
  metodo_pagamento: order.paymentMethod,
  id_cupom: order.couponId,
  origem: order.origin ?? null,
  data_pedido: order.createdAt,
  ...(order.items && { itens_pedido: order.items.map(presentOrderItem) }),
});

export const presentUserProfile = (profile: UserProfile) => ({
  id_usuario: profile.id,
  nome: profile.name,
  email: profile.email,
  telefone: profile.phone,
  cpf: profile.cpf,
  enderecos: profile.addresses,
  data_nascimento: profile.birthDate,
  foto_perfil: profile.profilePhoto,
  role: profile.role,
  data_criacao: profile.createdAt,
  status_id: profile.active,
  email_verificado: profile.emailVerified,
});

export const presentAdminProfile = (admin: AdminProfile) => ({
  id_admin: admin.id,
  nome: admin.name,
  email: admin.email,
  foto_perfil: admin.profilePhoto,
});

/** Login / registration response: tokens plus a short user summary. */
export const presentSession = (result: LoginResult | RegisterUserResult) => {
  const { user, ...tokens } = result;
  return {
    ...tokens,
    user: {
      id: user.id,
      nome: user.name,
      email: user.email,
      nivel: user.role,
      ...('createdAt' in user && { data_criacao: user.createdAt }),
      ...(user.profilePhoto !== undefined && { foto_perfil: user.profilePhoto }),
      ...('emailVerified' in user && { email_verificado: user.emailVerified }),
    },
  };
};

export const presentCart = (cart: CartSummary) => ({
  cartItems: cart.cartItems.map((line) => ({
    id: line.id,
    usuario_id: line.userId,
    id_produto: line.productId,
    quantidade: line.quantity,
    data_adicionado: line.addedAt,
    produto: presentProduct(line.product),
    total: line.total,
  })),
  subtotal: cart.subtotal,
  frete: cart.shipping,
  total: cart.total,
  freteGratis: cart.freeShipping,
  freteCalculado: cart.shippingCalculated,
  itemCount: cart.itemCount,
});

export const presentAdminOrder = (order: AdminOrderView) => ({
  id_pedido: order.id,
  cliente_nome: order.customerName,
  cliente_email: order.customerEmail,
  data_pedido: order.createdAt,
  status: order.status,
  valor_total: order.totalAmount,
  valor_frete: order.shippingAmount,
  metodo_pagamento: order.paymentMethod,
  origem: order.origin,
  itens: order.items.map((item) => ({
    nome: item.name,
    quantidade: item.quantity,
    imagem: item.image,
  })),
});

export const presentCustomers = (result: ListCustomersResult) => ({
  clientes: result.customers.map((customer) => ({
    id_cliente: customer.id,
    nome: customer.name,
    telefone: customer.phone,
    email: customer.email,
    data_cadastro: customer.registeredAt,
    status: customer.active ? 'ativo' : 'inativo',
    valor_total: customer.totalSpent,
    total_pedidos: customer.orderCount,
  })),
  pagination: result.pagination,
  estatisticas: { novosClientesUltimos7Dias: result.newCustomersLast7Days },
});

export const presentDashboard = (dashboard: DashboardView) => ({
  resumo: {
    vendasSemana: dashboard.summary.weekSales,
    aumentoVendas: dashboard.summary.salesGrowth,
    vendasPassada: dashboard.summary.previousWeekSales,
    pedidosSemana: dashboard.summary.weekOrders,
    aumentoPedidos: dashboard.summary.ordersGrowth,
    pedidosPassada: dashboard.summary.previousWeekOrders,
    pendentes: dashboard.summary.pending,
    cancelados: dashboard.summary.cancelled,
    totalVendas: dashboard.summary.totalSales,
    totalPedidos: dashboard.summary.totalOrders,
  },
  produtosDestaque: dashboard.topProducts.map((product) => ({
    id_produto: product.productId,
    nome: product.name,
    vendas: product.sales,
    preco: product.price,
    imagem: product.image,
    status: product.inStock ? 'Em Estoque' : 'Sem Estoque',
    corStatus: product.inStock ? '#21c45d' : '#ef4343',
  })),
  transacoes: dashboard.transactions.map((transaction) => ({
    id_pedido: transaction.orderId,
    cliente_nome: transaction.customerName,
    data_pedido: transaction.createdAt,
    status: transaction.status,
    valor_total: transaction.totalAmount,
    origem: transaction.origin,
  })),
});

export const presentNotification = (notification: Notification) => ({
  id_notificacao: notification.id,
  id_usuario: notification.userId,
  id_admin: notification.adminId,
  titulo: notification.title,
  mensagem: notification.message,
  tipo: notification.type,
  lido: notification.isRead,
  data_criacao: notification.createdAt,
});

export const presentContactMessage = (message: ContactMessage) => ({
  id_contato: message.id,
  nome: message.name,
  email: message.email,
  telefone: message.phone,
  assunto: message.subject,
  mensagem: message.message,
  id_usuario: message.userId,
  respondido: message.answered,
  resposta: message.answer,
  data_resposta: message.answeredAt,
  data_criacao: message.createdAt,
});

export const presentWebhook = (webhook: Webhook) => ({
  id_webhook: webhook.id,
  url: webhook.url,
  eventos: webhook.events,
  ativo: webhook.active,
  criado_em: webhook.createdAt,
});

export const presentFeatureFlag = (flag: FeatureFlag) => ({
  chave: flag.key,
  ativo: flag.enabled,
  atualizado: flag.updatedAt,
});
