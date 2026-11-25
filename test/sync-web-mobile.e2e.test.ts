import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { applyCors, applyHttpConventions } from '../src/app.setup';
import { AuthSettings, ImageStorage } from '@application/ports';
import { AdminSchema, CouponSchema } from '@infrastructure/persistence/schemas';
import { DatabaseModule } from '@infrastructure/persistence';
import { TestDatabaseModule } from './test-database.module';

/*
 * Web <-> mobile synchronization through the single NestJS backend.
 *
 * The Angular website and the Expo app are two HTTP clients of the same API and the same
 * database, so "sync" means: whatever one client writes, the other client (and the admin
 * panel on the website) reads back on its next request. These tests drive both clients the
 * way the real apps do:
 *   - website: browser requests with an Origin header and `X-Client-Platform: web`
 *   - mobile:  native requests with no Origin header and `X-Client-Platform: mobile`
 *
 * E-mail verification is disabled here (EMAIL_VERIFICATION_REQUIRED=false), as in local
 * development without SMTP, so a customer created in the app can buy immediately.
 */
const WEB_ORIGIN = 'http://localhost:4200';
const EXPO_WEB_ORIGIN = 'http://localhost:8081';

describe('Web <-> mobile sync (integration)', () => {
  let app: INestApplication;
  const server = () => app.getHttpServer();

  /** Requests exactly as the Expo app sends them (native fetch: no Origin, JSON). */
  const mobile = {
    get: (url: string, token?: string) =>
      withAuth(request(server()).get(url), token).set(mobileHeaders),
    post: (url: string, token?: string) =>
      withAuth(request(server()).post(url), token).set(mobileHeaders),
    put: (url: string, token?: string) =>
      withAuth(request(server()).put(url), token).set(mobileHeaders),
    patch: (url: string, token?: string) =>
      withAuth(request(server()).patch(url), token).set(mobileHeaders),
    delete: (url: string, token?: string) =>
      withAuth(request(server()).delete(url), token).set(mobileHeaders),
  };

  /** Requests exactly as the Angular site sends them (browser: Origin header). */
  const web = {
    get: (url: string, token?: string) =>
      withAuth(request(server()).get(url), token).set(webHeaders),
    post: (url: string, token?: string) =>
      withAuth(request(server()).post(url), token).set(webHeaders),
    put: (url: string, token?: string) =>
      withAuth(request(server()).put(url), token).set(webHeaders),
    patch: (url: string, token?: string) =>
      withAuth(request(server()).patch(url), token).set(webHeaders),
    delete: (url: string, token?: string) =>
      withAuth(request(server()).delete(url), token).set(webHeaders),
  };

  const mobileHeaders = { 'X-Client-Platform': 'mobile', 'User-Agent': 'okhttp/4.12.0' };
  const webHeaders = { 'X-Client-Platform': 'web', Origin: WEB_ORIGIN };

  function withAuth(req: request.Test, token?: string) {
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  }

  /** Admin notifications are written by an async event handler: wait until it lands. */
  async function eventually<T>(read: () => Promise<T>, accept: (value: T) => boolean): Promise<T> {
    let last = await read();
    for (let attempt = 0; attempt < 40 && !accept(last); attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      last = await read();
    }
    return last;
  }

  let adminToken: string;
  let customerMobileToken: string;
  let customerWebToken: string;
  let productId: number;
  let mobileOrderId: number;
  let webOrderId: number;

  const customer = {
    nome: 'Cliente Sync',
    email: 'cliente.sync@teste.com',
    senha: 'senha123',
    telefone: '11977776666',
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideModule(DatabaseModule)
      .useModule(TestDatabaseModule)
      .overrideProvider(ImageStorage)
      .useValue({ upload: jest.fn().mockResolvedValue('https://img.example/brigadeiro.png') })
      .overrideProvider(AuthSettings)
      .useValue({ emailVerificationRequired: false })
      .compile();

    app = moduleRef.createNestApplication();
    applyCors(app, `${WEB_ORIGIN},${EXPO_WEB_ORIGIN}`);
    applyHttpConventions(app);
    await app.init();

    const dataSource = app.get(DataSource);
    const admins = dataSource.getRepository(AdminSchema);
    await admins.save(
      admins.create({
        name: 'Admin Sync',
        email: 'admin.sync@teste.com',
        password: await bcrypt.hash('admin123', 4),
      }),
    );
    const coupons = dataSource.getRepository(CouponSchema);
    await coupons.save([
      coupons.create({ code: 'SUKI10', type: 'percentual', value: 10, active: true }),
      coupons.create({
        code: 'VENCIDO',
        type: 'fixo',
        value: 5,
        active: true,
        expiresAt: new Date('2020-01-01'),
      }),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('accounts are shared between the app and the website', () => {
    it('a customer registers in the mobile app and can use the API right away', async () => {
      const res = await mobile.post('/suki-doces/usuario/registro').send(customer);
      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user).toMatchObject({
        nome: customer.nome,
        nivel: 'cliente',
        email_verificado: true,
      });
      customerMobileToken = res.body.accessToken;

      const profile = await mobile.get('/suki-doces/usuario/perfil', customerMobileToken);
      expect(profile.status).toBe(200);
      expect(profile.body.data.user.email).toBe(customer.email);
    });

    it('the same customer logs in on the website with the account created in the app', async () => {
      const res = await web.post('/suki-doces/usuario/login').send({
        email: customer.email,
        senha: customer.senha,
      });
      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ email: customer.email, nivel: 'cliente' });
      customerWebToken = res.body.accessToken;
    });

    it('the admin logs in on the website panel', async () => {
      const res = await web
        .post('/suki-doces/admin/login')
        .send({ email: 'admin.sync@teste.com', senha: 'admin123' });
      expect(res.status).toBe(200);
      expect(res.body.user.nivel).toBe('admin');
      adminToken = res.body.accessToken;
    });

    it('the admin sees the customer registered from the app in the website customer list', async () => {
      const res = await web.get('/suki-doces/admin/clientes', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.data.clientes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: customer.email, status: 'ativo' }),
        ]),
      );
    });
  });

  describe('catalog changes made in the panel reach the app', () => {
    it('admin creates a product on the website', async () => {
      const res = await web
        .post('/suki-doces/produtos', adminToken)
        .field('nome', 'Brigadeiro Gourmet')
        .field('preco', '4.50')
        .field('quantidade', '50');
      expect(res.status).toBe(201);
      productId = res.body.data.produto.id_produto;
    });

    it('the app lists it in the catalog with the same price and stock', async () => {
      const res = await mobile.get('/suki-doces/produtos');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id_produto: productId, preco: 4.5, quantidade: 50 }),
        ]),
      );
    });
  });

  describe('purchase in the mobile app -> website admin panel', () => {
    it('the cart is stored on the server, so an item added in the app shows on the website', async () => {
      const add = await mobile
        .post('/suki-doces/carrinho/add', customerMobileToken)
        .send({ id_produto: productId, quantidade: 4 });
      expect(add.status).toBe(201);

      const webCart = await web.get('/suki-doces/carrinho', customerWebToken);
      expect(webCart.status).toBe(200);
      expect(webCart.body.data.cartItems).toHaveLength(1);
      expect(webCart.body.data.cartItems[0]).toMatchObject({
        id_produto: productId,
        quantidade: 4,
      });
      expect(webCart.body.data.subtotal).toBe(18);
    });

    it('previews a coupon before paying', async () => {
      const ok = await mobile
        .post('/suki-doces/cupons/validar')
        .send({ codigo: 'suki10', subtotal: 18 });
      expect(ok.status).toBe(200);
      expect(ok.body.data).toMatchObject({ codigo: 'SUKI10', valor_desconto: 1.8 });

      const expired = await mobile.post('/suki-doces/cupons/validar').send({ codigo: 'VENCIDO' });
      expect(expired.status).toBe(400);

      const unknown = await mobile.post('/suki-doces/cupons/validar').send({ codigo: 'NAOEXISTE' });
      expect(unknown.status).toBe(400);
    });

    it('checkout from the app creates the order tagged with origin "mobile"', async () => {
      const res = await mobile
        .post('/suki-doces/pedidos', customerMobileToken)
        .set('Idempotency-Key', 'mobile-checkout-1')
        .send({
          produtos: [{ id_produto: productId, quantidade: 4 }],
          metodo_pagamento: 'pix',
          codigo_cupom: 'SUKI10',
          endereco_entrega: { estado: 'SP', cidade: 'Santo André' },
        });
      expect(res.status).toBe(201);
      expect(res.body.pedido).toMatchObject({
        status: 'pago',
        origem: 'mobile',
        // R$ 18,00 - R$ 1,80 (SUKI10) + R$ 9,90 shipping to Santo André (free only from R$ 100).
        valor_total: 26.1,
        valor_frete: 9.9,
      });
      mobileOrderId = res.body.pedido.id_pedido;
    });

    it('a network retry of the same app checkout does not create a second order', async () => {
      const retry = await mobile
        .post('/suki-doces/pedidos', customerMobileToken)
        .set('Idempotency-Key', 'mobile-checkout-1')
        .send({
          produtos: [{ id_produto: productId, quantidade: 4 }],
          metodo_pagamento: 'pix',
          codigo_cupom: 'SUKI10',
          endereco_entrega: { estado: 'SP', cidade: 'Santo André' },
        });
      expect(retry.status).toBe(201);
      expect(retry.body.pedido.id_pedido).toBe(mobileOrderId);
    });

    it('the website order list shows the app order with customer, items and origin', async () => {
      const res = await web.get('/suki-doces/admin/pedidos', adminToken);
      expect(res.status).toBe(200);
      const order = res.body.find((o: { id_pedido: number }) => o.id_pedido === mobileOrderId);
      expect(order).toMatchObject({
        cliente_nome: customer.nome,
        cliente_email: customer.email,
        status: 'pago',
        metodo_pagamento: 'pix',
        origem: 'mobile',
        valor_total: 26.1,
        valor_frete: 9.9,
        itens: [expect.objectContaining({ nome: 'Brigadeiro Gourmet', quantidade: 4 })],
      });
    });

    it('the website dashboard counts the sale and lists it among recent transactions', async () => {
      const res = await web.get('/suki-doces/admin/dashboard', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.data.resumo.totalPedidos).toBe(1);
      expect(res.body.data.transacoes[0]).toMatchObject({
        id_pedido: mobileOrderId,
        cliente_nome: customer.nome,
        origem: 'mobile',
      });
    });

    it('the website admin receives a notification for the app order', async () => {
      const res = await eventually(
        () => web.get('/suki-doces/admin/notificacoes', adminToken),
        (r) =>
          r.body.data?.notifications?.some((n: { mensagem: string }) =>
            n.mensagem.includes(`#${mobileOrderId}`),
          ),
      );
      const notification = res.body.data.notifications.find((n: { mensagem: string }) =>
        n.mensagem.includes(`#${mobileOrderId}`),
      );
      expect(notification.mensagem).toContain('(mobile app)');
      expect(res.body.data.unreadCount).toBeGreaterThan(0);
    });

    it('the stock shown on the website already reflects the app purchase', async () => {
      const res = await web.get(`/suki-doces/produtos/${productId}`);
      expect(res.body.data.quantidade).toBe(46);
    });

    it('the app clears its cart after buying and the website sees it empty, with no shipping fee', async () => {
      await mobile.delete('/suki-doces/carrinho', customerMobileToken).expect(200);
      const webCart = await web.get('/suki-doces/carrinho', customerWebToken);
      expect(webCart.body.data.cartItems).toHaveLength(0);
      expect(webCart.body.data).toMatchObject({ subtotal: 0, frete: 0, total: 0, itemCount: 0 });
    });
  });

  describe('purchase on the website -> mobile app (vice-versa)', () => {
    it('the customer buys on the website: the order is tagged with origin "web"', async () => {
      const res = await web
        .post('/suki-doces/pedidos', customerWebToken)
        .set('Idempotency-Key', 'web-checkout-1')
        .send({
          produtos: [{ id_produto: productId, quantidade: 2 }],
          metodo_pagamento: 'boleto',
          endereco_entrega: { estado: 'SP', cidade: 'Diadema' },
        });
      expect(res.status).toBe(201);
      // R$ 9,00 of products + R$ 5,90 for Diadema (the website's own destination, not the app's).
      expect(res.body.pedido).toMatchObject({
        status: 'pendente',
        origem: 'web',
        valor_total: 14.9,
        valor_frete: 5.9,
      });
      webOrderId = res.body.pedido.id_pedido;
    });

    it('"Meus pedidos" in the app lists both orders, whatever channel placed them', async () => {
      const res = await mobile.get('/suki-doces/usuario/pedidos', customerMobileToken);
      expect(res.status).toBe(200);
      const byId = Object.fromEntries(
        res.body.map((o: { id_pedido: number; origem: string }) => [o.id_pedido, o.origem]),
      );
      expect(byId).toEqual({ [mobileOrderId]: 'mobile', [webOrderId]: 'web' });
    });

    it('the app pays the pending website order and the panel sees it as paid', async () => {
      const pay = await mobile.post(`/suki-doces/pedidos/${webOrderId}/pagar`, customerMobileToken);
      expect(pay.status).toBe(200);
      expect(pay.body.pedido.status).toBe('pago');

      const panel = await web.get('/suki-doces/admin/pedidos', adminToken);
      const order = panel.body.find((o: { id_pedido: number }) => o.id_pedido === webOrderId);
      expect(order).toMatchObject({ status: 'pago', origem: 'web' });
    });

    it('a status change made in the website panel shows up in the app', async () => {
      const update = await web
        .patch(`/suki-doces/pedidos/${mobileOrderId}/status`, adminToken)
        .send({ status: 'enviado' });
      expect(update.status).toBe(200);

      const res = await mobile.get('/suki-doces/usuario/pedidos', customerMobileToken);
      const order = res.body.find((o: { id_pedido: number }) => o.id_pedido === mobileOrderId);
      expect(order.status).toBe('enviado');
    });

    it('cancelling in the app returns the stock and the panel sees the cancellation', async () => {
      const cancel = await mobile.patch(
        `/suki-doces/usuario/pedidos/${webOrderId}/cancelar`,
        customerMobileToken,
      );
      expect(cancel.status).toBe(200);

      const panel = await web.get('/suki-doces/admin/pedidos', adminToken);
      expect(panel.body.find((o: { id_pedido: number }) => o.id_pedido === webOrderId).status).toBe(
        'cancelado',
      );
      const product = await web.get(`/suki-doces/produtos/${productId}`);
      expect(product.body.data.quantidade).toBe(46);
    });
  });

  describe('profile and contact data written by one client are read by the other', () => {
    it('the address saved by the website checkout (legacy Prisma payload) is read by the app', async () => {
      const create = await web.put('/suki-doces/usuario/perfil', customerWebToken).send({
        enderecos: {
          create: {
            cep: '01001-000',
            logradouro: 'Praça da Sé',
            numero: '10',
            cidade: 'São Paulo',
            estado: 'SP',
          },
        },
      });
      expect(create.status).toBe(200);
      expect(create.body.data.user.enderecos).toEqual([
        expect.objectContaining({ id_endereco: 1, logradouro: 'Praça da Sé', numero: '10' }),
      ]);

      const update = await web.put('/suki-doces/usuario/perfil', customerWebToken).send({
        enderecos: { update: { where: { id_endereco: 1 }, data: { numero: '20' } } },
      });
      expect(update.body.data.user.enderecos).toEqual([
        expect.objectContaining({ id_endereco: 1, logradouro: 'Praça da Sé', numero: '20' }),
      ]);

      const appProfile = await mobile.get('/suki-doces/usuario/perfil', customerMobileToken);
      expect(appProfile.body.data.user.enderecos[0]).toMatchObject({
        cep: '01001-000',
        numero: '20',
      });
    });

    it('a contact message sent from the app reaches the website panel, which can close and delete it', async () => {
      const sent = await mobile.post('/suki-doces/contatos', customerMobileToken).send({
        nome: 'Cliente Sync',
        email: customer.email,
        telefone: '11977776666',
        assunto: 'Dúvida',
        mensagem: 'Vocês entregam no sábado de manhã?',
      });
      expect(sent.status).toBe(201);

      const inbox = await web.get('/suki-doces/admin/contatos', adminToken);
      const message = inbox.body.data.messages.find(
        (m: { mensagem: string }) => m.mensagem === 'Vocês entregam no sábado de manhã?',
      );
      expect(message).toMatchObject({ respondido: false, id_usuario: expect.any(Number) });

      const handled = await web.put(
        `/suki-doces/admin/contatos/${message.id_contato}/mark-read`,
        adminToken,
      );
      expect(handled.status).toBe(200);
      expect(handled.body.data.contato.respondido).toBe(true);

      const appHistory = await mobile.get('/suki-doces/contatos/me', customerMobileToken);
      expect(appHistory.body.data.messages[0]).toMatchObject({ respondido: true });

      const removed = await web.delete(
        `/suki-doces/admin/contatos/${message.id_contato}`,
        adminToken,
      );
      expect(removed.status).toBe(200);
      const missing = await web.delete(
        `/suki-doces/admin/contatos/${message.id_contato}`,
        adminToken,
      );
      expect(missing.status).toBe(404);
    });

    it('a customer cannot use the admin contact routes', async () => {
      const res = await mobile.delete('/suki-doces/admin/contatos/1', customerMobileToken);
      expect(res.status).toBe(403);
    });
  });

  describe('transport', () => {
    it('browsers (website and Expo web) may send the X-Client-Platform header', async () => {
      for (const origin of [WEB_ORIGIN, EXPO_WEB_ORIGIN]) {
        const res = await request(server())
          .options('/suki-doces/pedidos')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'POST')
          .set(
            'Access-Control-Request-Headers',
            'authorization,content-type,idempotency-key,x-client-platform',
          );
        expect(res.status).toBe(204);
        expect(res.headers['access-control-allow-origin']).toBe(origin);
        expect(res.headers['access-control-allow-headers'].toLowerCase()).toContain(
          'x-client-platform',
        );
      }
    });

    it('an order without a known platform header is still accepted, with no origin', async () => {
      const res = await request(server())
        .post('/suki-doces/pedidos')
        .set('Authorization', `Bearer ${customerMobileToken}`)
        .set('Idempotency-Key', 'no-platform-1')
        .set('X-Client-Platform', 'smart-fridge')
        .send({ produtos: [{ id_produto: productId, quantidade: 1 }], metodo_pagamento: 'pix' });
      expect(res.status).toBe(201);
      expect(res.body.pedido.origem).toBeNull();
    });
  });
});
