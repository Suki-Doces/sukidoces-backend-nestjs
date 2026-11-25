import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { applyCors, applyHttpConventions } from '../src/app.setup';
import { HEALTH_PROBES, HealthProbe, ImageStorage, TokenService } from '@application/ports';
import { CheckHealthUseCase } from '@application/use-cases/health';
import { AdminSchema, NotificationSchema } from '@infrastructure/persistence/schemas';
import { DatabaseModule } from '@infrastructure/persistence';
import { HealthController } from '@presentation/http/controllers';
import { TestDatabaseModule } from './test-database.module';

/*
 * Integration tests: the whole application runs (modules, guards, pipes, filter)
 * against an in-memory database. Requests use the public HTTP contract, which is
 * unchanged by the refactoring, so these tests double as a regression harness.
 */
describe('Suki Doces API (integration)', () => {
  let app: INestApplication;
  const server = () => app.getHttpServer();

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideModule(DatabaseModule)
      .useModule(TestDatabaseModule)
      .overrideProvider(ImageStorage)
      .useValue({ upload: jest.fn().mockResolvedValue('https://img.example/photo.png') })
      .compile();

    app = moduleRef.createNestApplication();
    applyCors(app, 'http://localhost:3000');
    applyHttpConventions(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('health check', () => {
    it('GET /health returns a report whose status reflects all dependency probes', async () => {
      const res = await request(server()).get('/health');
      expect(res.body.checks.database.status).toBe('up');
      expect(['up', 'down']).toContain(res.body.checks.memory.status);
      const healthy = Object.values(res.body.checks).every(
        (check: { status: string }) => check.status === 'up',
      );
      expect(res.status).toBe(healthy ? 200 : 503);
      expect(res.body.status).toBe(healthy ? 'ok' : 'error');
      expect(typeof res.body.uptimeSeconds).toBe('number');
      expect(typeof res.body.timestamp).toBe('string');
    });

    it('GET /health/ready reflects probe status and /health/live answers 200 without the API prefix', async () => {
      const ready = await request(server()).get('/health/ready');
      expect(ready.body.checks.database.status).toBe('up');
      const healthy = Object.values(ready.body.checks).every(
        (check: { status: string }) => check.status === 'up',
      );
      expect(ready.status).toBe(healthy ? 200 : 503);
      const live = await request(server()).get('/health/live');
      expect(live.status).toBe(200);
      expect(live.body.status).toBe('ok');
    });

    it('is not rate limited (orchestrators probe constantly)', async () => {
      for (let i = 0; i < 12; i++) {
        expect((await request(server()).get('/health/live')).status).toBe(200);
      }
    });

    it('generates the OpenAPI document with the public routes', () => {
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setTitle('test').build(),
      );
      expect(Object.keys(document.paths)).toEqual(
        expect.arrayContaining(['/suki-doces/usuario/registro', '/suki-doces/produtos', '/health']),
      );
      expect(document).toHaveProperty('components.schemas.RegisterDto.properties.nome');
      expect(document).toHaveProperty('components.schemas.RegisterDto.properties.senha');
      expect(document).not.toHaveProperty('components.schemas.RegisterDto.properties.name');
      expect(document).toHaveProperty('components.schemas.UpdateProfileDto.properties.cpf');
      expect(document).toHaveProperty('components.schemas.UpdateProfileDto.properties.telefone');
      expect(document).toHaveProperty('components.schemas.UpdateAdminSettingsDto.properties.email');
      expect(document).toHaveProperty('components.schemas.UpdateAdminSettingsDto.properties.nome');
      expect(document).toHaveProperty('components.schemas.UpdateCustomerDto.properties.status');
      expect(document).toHaveProperty(
        'components.schemas.UpdateCustomerDto.properties.status.enum',
        ['ativo', 'inativo'],
      );
      expect(document).toHaveProperty(
        'components.schemas.CheckoutDto.required',
        expect.arrayContaining(['produtos', 'metodo_pagamento']),
      );
      const checkoutHeaders = document.paths['/suki-doces/pedidos'].post?.parameters ?? [];
      expect(checkoutHeaders).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Idempotency-Key', in: 'header', required: true }),
        ]),
      );
    });

    it('allows the checkout idempotency header in browser preflight requests', async () => {
      const res = await request(server())
        .options('/suki-doces/pedidos')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'authorization,content-type,idempotency-key');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-headers'].toLowerCase()).toContain(
        'idempotency-key',
      );
    });

    it('GET / and GET /metrics are reachable outside the prefix', async () => {
      expect((await request(server()).get('/')).text).toContain('Suki Doces');
      const metrics = await request(server()).get('/metrics');
      expect(metrics.status).toBe(200);
      expect(metrics.text).toContain('http_requests_total');
    });
  });

  describe('validation and authentication', () => {
    it('rejects an invalid registration with 400', async () => {
      const res = await request(server())
        .post('/suki-doces/usuario/registro')
        .send({ nome: 'A', email: 'not-an-email', senha: '123', telefone: '1' });
      expect(res.status).toBe(400);
    });

    it('rejects a non-numeric product id with 400', async () => {
      expect((await request(server()).get('/suki-doces/produtos/abc')).status).toBe(400);
    });

    it('protected routes answer 401 without a token and with a malformed one', async () => {
      const missing = await request(server()).get('/suki-doces/usuario/perfil');
      expect(missing.status).toBe(401);
      expect(missing.body.message).toBe('Missing or invalid token');

      const malformed = await request(server())
        .get('/suki-doces/usuario/perfil')
        .set('Authorization', 'Bearer nope');
      expect(malformed.status).toBe(401);
      expect(malformed.body.message).toBe('Invalid token');
    });

    it('public catalog routes work on an empty database', async () => {
      const res = await request(server()).get('/suki-doces/produtos/categorias');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true, data: [] });
    });
  });

  describe('registration -> login -> protected route -> refresh', () => {
    const user = {
      nome: 'Maria Teste',
      email: 'maria.e2e@teste.com',
      senha: 'senha123',
      telefone: '11999999999',
    };
    let accessToken: string;
    let refreshToken: string;
    let userId: number;

    it('registers a customer and returns tokens in the contract shape', async () => {
      const res = await request(server()).post('/suki-doces/usuario/registro').send(user);
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user).toMatchObject({
        nome: 'Maria Teste',
        email: user.email,
        nivel: 'cliente',
      });
      accessToken = res.body.token;
      refreshToken = res.body.refreshToken;
      userId = res.body.user.id;
    });

    it('rejects a second registration with the same e-mail', async () => {
      const res = await request(server()).post('/suki-doces/usuario/registro').send(user);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email already registered');
    });

    it('returns the profile without ever exposing the password hash', async () => {
      const pendingProfile = await request(server())
        .get('/suki-doces/usuario/perfil')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(pendingProfile.status).toBe(401);

      const pendingLogin = await request(server())
        .post('/suki-doces/usuario/login')
        .send({ email: user.email, senha: user.senha });
      expect(pendingLogin.status).toBe(401);

      const verificationToken = await app.get(TokenService).signEmailVerificationToken(userId);
      const verified = await request(server())
        .get('/suki-doces/usuario/verificar-email')
        .query({ token: verificationToken });
      expect(verified.status).toBe(200);

      const res = await request(server())
        .get('/suki-doces/usuario/perfil')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(user.email);
      expect(JSON.stringify(res.body)).not.toMatch(/senha|password/i);
    });

    it('logs in with the right password and rejects the wrong one', async () => {
      const ok = await request(server())
        .post('/suki-doces/usuario/login')
        .send({ email: user.email, senha: user.senha });
      expect(ok.status).toBe(200);
      const wrong = await request(server())
        .post('/suki-doces/usuario/login')
        .send({ email: user.email, senha: 'wrong-password' });
      expect(wrong.status).toBe(401);
    });

    it('refreshes the tokens and refuses an access token on the refresh endpoint', async () => {
      const ok = await request(server()).post('/suki-doces/usuario/refresh').send({ refreshToken });
      expect(ok.status).toBe(200);
      expect(ok.body.data.accessToken).toBeDefined();

      const wrong = await request(server())
        .post('/suki-doces/usuario/refresh')
        .send({ refreshToken: accessToken });
      expect(wrong.status).toBe(401);

      const replay = await request(server())
        .post('/suki-doces/usuario/refresh')
        .send({ refreshToken });
      expect(replay.status).toBe(401);
      refreshToken = ok.body.data.refreshToken;
    });

    it('revokes the active refresh token on logout', async () => {
      const logout = await request(server())
        .post('/suki-doces/usuario/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });
      expect(logout.status).toBe(201);
      expect(
        (await request(server()).post('/suki-doces/usuario/refresh').send({ refreshToken })).status,
      ).toBe(401);
    });

    it('refuses a refresh token used as an access token', async () => {
      const res = await request(server())
        .get('/suki-doces/usuario/perfil')
        .set('Authorization', `Bearer ${refreshToken}`);
      expect(res.status).toBe(401);
    });
  });

  describe('store flow: admin catalog -> customer purchase -> cancellation', () => {
    let adminToken: string;
    let customerToken: string;
    let productId: number;
    let orderId: number;

    const stock = async () =>
      (await request(server()).get(`/suki-doces/produtos/${productId}`)).body.data.quantidade;

    beforeAll(async () => {
      const admins = app.get(DataSource).getRepository(AdminSchema);
      await admins.save(
        admins.create({
          name: 'Admin E2E',
          email: 'admin.e2e@teste.com',
          password: await bcrypt.hash('admin123', 4),
        }),
      );

      const login = await request(server())
        .post('/suki-doces/admin/login')
        .send({ email: 'admin.e2e@teste.com', senha: 'admin123' });
      adminToken = login.body.token;

      const registration = await request(server()).post('/suki-doces/usuario/registro').send({
        nome: 'Joao Loja',
        email: 'joao.loja@teste.com',
        senha: 'senha123',
        telefone: '11988887777',
      });
      customerToken = registration.body.token;
      const verificationToken = await app
        .get(TokenService)
        .signEmailVerificationToken(registration.body.user.id);
      await request(server())
        .get('/suki-doces/usuario/verificar-email')
        .query({ token: verificationToken })
        .expect(200);
    });

    it('admin login reports the admin role', async () => {
      const res = await request(server())
        .post('/suki-doces/admin/login')
        .send({ email: 'admin.e2e@teste.com', senha: 'admin123' });
      expect(res.body.user.nivel).toBe('admin');
      expect(res.body.message).toBe('Admin login successful');
    });

    it('a regular customer cannot create products (403)', async () => {
      const res = await request(server())
        .post('/suki-doces/produtos')
        .set('Authorization', `Bearer ${customerToken}`)
        .field('nome', 'Forbidden Cake')
        .field('preco', '10');
      expect(res.status).toBe(403);
    });

    it('rejects an invalid price through the DTO (400)', async () => {
      const res = await request(server())
        .post('/suki-doces/produtos')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('nome', 'Broken Cake')
        .field('preco', 'abc');
      expect(res.status).toBe(400);
    });

    it('admin creates a product by multipart: strings become numbers and the image is stored', async () => {
      const res = await request(server())
        .post('/suki-doces/produtos')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('nome', 'Chocolate Cake')
        .field('preco', '45.90')
        .field('quantidade', '10')
        .attach('imagem', Buffer.from('fake-image'), {
          filename: 'cake.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.produto).toMatchObject({
        nome: 'Chocolate Cake',
        preco: 45.9,
        quantidade: 10,
        imagem: 'https://img.example/photo.png',
      });
      productId = res.body.data.produto.id_produto;
    });

    it('lists the product in the catalog with its numeric price', async () => {
      const list = await request(server()).get('/suki-doces/produtos?query=Choc');
      expect(list.body.data).toHaveLength(1);
      expect(list.body.data[0].preco).toBe(45.9);

      const sorted = await request(server()).get('/suki-doces/produtos?filtro=menor-preco');
      expect(sorted.status).toBe(200);
    });

    it('requires an idempotency key before creating a checkout', async () => {
      const res = await request(server())
        .post('/suki-doces/pedidos')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ produtos: [{ id_produto: productId, quantidade: 1 }], metodo_pagamento: 'pix' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('A valid Idempotency-Key header is required');
      expect(await stock()).toBe(10);
    });

    it('quotes shipping on a public endpoint, free above the threshold of the zone', async () => {
      const quote = (body: object) =>
        request(server()).post('/suki-doces/frete/calcular').send(body);

      const paid = await quote({ subtotal: 19.8, estado: 'SP', cidade: 'Santo André' });
      expect(paid.status).toBe(200);
      expect(paid.body.data).toMatchObject({
        frete: 9.9,
        frete_gratis: false,
        frete_gratis_a_partir_de: 100,
        zona: 'SP_METRO',
      });

      const free = await quote({ subtotal: 100, estado: 'SP', cidade: 'Santo André' });
      expect(free.body.data).toMatchObject({ frete: 0, frete_gratis: true });

      const far = await quote({ subtotal: 60, estado: 'AM' });
      expect(far.body.data).toMatchObject({ frete: 38.9, zona: 'NORTH_NORTHEAST_MIDWEST' });

      expect((await quote({ subtotal: 60, estado: 'SP' })).status).toBe(400);
      expect((await quote({ subtotal: 60, estado: 'XX', cidade: 'A' })).status).toBe(400);
      expect((await quote({ estado: 'RJ' })).status).toBe(400);
    });

    it('refuses a checkout without any delivery address (400) and leaves the stock alone', async () => {
      const res = await request(server())
        .post('/suki-doces/pedidos')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Idempotency-Key', 'checkout-no-address')
        .send({ produtos: [{ id_produto: productId, quantidade: 1 }], metodo_pagamento: 'pix' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Delivery address is required to calculate shipping');
      expect(await stock()).toBe(10);
    });

    it('refuses a checkout to an unknown state (400)', async () => {
      const res = await request(server())
        .post('/suki-doces/pedidos')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Idempotency-Key', 'checkout-bad-address')
        .send({
          produtos: [{ id_produto: productId, quantidade: 1 }],
          metodo_pagamento: 'pix',
          endereco_entrega: { estado: 'XX', cidade: 'Nowhere' },
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid delivery address');
      expect(await stock()).toBe(10);
    });

    it('supports the legacy cart payload and quotes shipping by destination', async () => {
      const add = await request(server())
        .post('/suki-doces/carrinho/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ produto_id: productId, quantidade: 1 });
      expect(add.status).toBe(201);

      const cart = await request(server())
        .get('/suki-doces/carrinho')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(cart.body.data.cartItems[0]).toMatchObject({
        id_produto: productId,
        quantidade: 1,
        total: 45.9,
      });
      // No destination yet (no saved address, none sent): shipping is decided later.
      expect(cart.body.data).toMatchObject({ frete: 0, freteCalculado: false, total: 45.9 });

      const diadema = await request(server())
        .get('/suki-doces/carrinho?estado=SP&cidade=Diadema')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(diadema.body.data).toMatchObject({ frete: 5.9, freteCalculado: true, total: 51.8 });

      const bahia = await request(server())
        .get('/suki-doces/carrinho?estado=BA&cidade=Salvador')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(bahia.body.data).toMatchObject({ frete: 38.9, freteCalculado: true });

      const unknownState = await request(server())
        .get('/suki-doces/carrinho?estado=XX&cidade=Nowhere')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(unknownState.body.data).toMatchObject({ frete: 0, freteCalculado: false });

      // The customer saves an address: it becomes the default destination for cart and checkout.
      const saved = await request(server())
        .put('/suki-doces/usuario/perfil')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ enderecos: [{ cep: '09010-000', cidade: 'Santo André', estado: 'SP' }] });
      expect(saved.status).toBe(200);

      const withAddress = await request(server())
        .get('/suki-doces/carrinho')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(withAddress.body.data).toMatchObject({
        frete: 9.9,
        freteGratis: false,
        freteCalculado: true,
        total: 55.8,
      });

      const itemId = cart.body.data.cartItems[0].id;
      const tooMany = await request(server())
        .put(`/suki-doces/carrinho/${itemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantidade: 999 });
      expect(tooMany.status).toBe(400);

      const clear = await request(server())
        .delete('/suki-doces/carrinho')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(clear.status).toBe(200);
    });

    it('refuses a checkout above the available stock (400) without touching the stock', async () => {
      const res = await request(server())
        .post('/suki-doces/pedidos')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Idempotency-Key', 'checkout-out-of-stock')
        .send({ produtos: [{ id_produto: productId, quantidade: 999 }], metodo_pagamento: 'pix' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient stock');
      expect(await stock()).toBe(10);
    });

    it('a valid checkout creates a paid order and decreases the stock', async () => {
      const res = await request(server())
        .post('/suki-doces/pedidos')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Idempotency-Key', 'checkout-valid')
        .send({ produtos: [{ id_produto: productId, quantidade: 2 }], metodo_pagamento: 'pix' });

      expect(res.status).toBe(201);
      // 2 x R$ 45,90 = R$ 91,80 (below R$ 100) + R$ 9,90 for Santo André (the saved address).
      expect(res.body.pedido.valor_total).toBeCloseTo(101.7);
      expect(res.body.pedido.valor_frete).toBeCloseTo(9.9);
      expect(res.body.pedido.status).toBe('pago');
      orderId = res.body.pedido.id_pedido;
      expect(await stock()).toBe(8);

      const userOrders = await request(server())
        .get('/suki-doces/usuario/pedidos')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(Array.isArray(userOrders.body)).toBe(true);
      expect(userOrders.body[0].id_pedido).toBe(orderId);

      const retry = await request(server())
        .post('/suki-doces/pedidos')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Idempotency-Key', 'checkout-valid')
        .send({ produtos: [{ id_produto: productId, quantidade: 2 }], metodo_pagamento: 'pix' });
      expect(retry.status).toBe(201);
      expect(retry.body.pedido.id_pedido).toBe(orderId);
      expect(await stock()).toBe(8);

      const keyConflict = await request(server())
        .post('/suki-doces/pedidos')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Idempotency-Key', 'checkout-valid')
        .send({ produtos: [{ id_produto: productId, quantidade: 1 }], metodo_pagamento: 'pix' });
      expect(keyConflict.status).toBe(400);
    });

    it('aggregates customer order totals without loading order details', async () => {
      const response = await request(server())
        .get('/suki-doces/admin/clientes')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      const customer = response.body.data.clientes.find(
        (item: { email: string }) => item.email === 'joao.loja@teste.com',
      );
      expect(customer).toMatchObject({ valor_total: 101.7, total_pedidos: 1 });
    });

    it("another user cannot cancel someone else's order (403)", async () => {
      const maria = await request(server())
        .post('/suki-doces/usuario/login')
        .send({ email: 'maria.e2e@teste.com', senha: 'senha123' });
      const res = await request(server())
        .patch(`/suki-doces/usuario/pedidos/${orderId}/cancelar`)
        .set('Authorization', `Bearer ${maria.body.token}`);
      expect(res.status).toBe(403);
      expect(await stock()).toBe(8);
    });

    it('the owner cancels within the window and the stock is given back', async () => {
      const res = await request(server())
        .patch(`/suki-doces/usuario/pedidos/${orderId}/cancelar`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.pedido.status).toBe('cancelado');
      expect(await stock()).toBe(10);
    });

    it('cancelling again is refused and the stock is not returned twice', async () => {
      const res = await request(server())
        .patch(`/suki-doces/usuario/pedidos/${orderId}/cancelar`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('This order has already been cancelled');
      expect(await stock()).toBe(10);
    });

    it('a bank-slip order starts pending and can be paid exactly once', async () => {
      const created = await request(server())
        .post('/suki-doces/pedidos')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Idempotency-Key', 'checkout-bank-slip')
        .send({ produtos: [{ id_produto: productId, quantidade: 1 }], metodo_pagamento: 'boleto' });
      expect(created.body.pedido.status).toBe('pendente');
      const id = created.body.pedido.id_pedido;

      const paid = await request(server())
        .post(`/suki-doces/pedidos/${id}/pagar`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(paid.status).toBe(200);
      expect(paid.body.pedido.status).toBe('pago');

      const again = await request(server())
        .post(`/suki-doces/pedidos/${id}/pagar`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(again.status).toBe(400);
      expect(again.body.message).toBe('Order already processed');
    });

    it('admin changes an order status', async () => {
      const res = await request(server())
        .patch(`/suki-doces/pedidos/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'enviado' });
      expect(res.status).toBe(200);
      expect(res.body.mensagem).toBe('Status atualizado para enviado');
      expect(res.body.pedido.status).toBe('enviado');
    });

    it('saves admin notifications under the admin foreign key', async () => {
      const notifications = await request(server())
        .get('/suki-doces/admin/notificacoes')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(notifications.status).toBe(200);
      expect(notifications.body.data.notifications.length).toBeGreaterThan(0);

      const stored = await app
        .get(DataSource)
        .getRepository(NotificationSchema)
        .findOne({ where: { adminId: 1 } });
      expect(stored).not.toBeNull();
      expect(stored?.userId).toBeNull();
    });

    it('admin panel: dashboard, orders and customers use the public contract shape', async () => {
      const dashboard = await request(server())
        .get('/suki-doces/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(dashboard.status).toBe(200);
      expect(dashboard.body.data.resumo.totalPedidos).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(dashboard.body.data.produtosDestaque)).toBe(true);
      expect(Array.isArray(dashboard.body.data.transacoes)).toBe(true);

      const orders = await request(server())
        .get('/suki-doces/admin/pedidos')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(orders.status).toBe(200);
      expect(Array.isArray(orders.body)).toBe(true);
      expect(orders.body[0]).toMatchObject({
        cliente_nome: 'Joao Loja',
        itens: expect.any(Array),
      });

      const panelOrders = await request(server())
        .get('/suki-doces/pedidos')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(panelOrders.status).toBe(200);
      expect(Array.isArray(panelOrders.body)).toBe(true);

      const customers = await request(server())
        .get('/suki-doces/admin/clientes')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(customers.status).toBe(200);
      const customerData = customers.body.data as {
        clientes: Array<{ email: string; status: string; total_pedidos: number }>;
      };
      const joao = customerData.clientes.find(
        (customer) => customer.email === 'joao.loja@teste.com',
      );
      expect(joao).toMatchObject({ status: 'ativo', total_pedidos: 2 });
      expect(JSON.stringify(customers.body)).not.toMatch(/senha|password/i);

      const customerOnly = await request(server())
        .get('/suki-doces/admin/clientes')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(customerOnly.status).toBe(403);
    });

    it('contact messages: anonymous create, history requires login, admin can answer', async () => {
      const message = {
        nome: 'Visitor',
        email: 'visitor@teste.com',
        telefone: '11977776666',
        assunto: 'Question',
        mensagem: 'Do you deliver on Sundays?',
      };

      const created = await request(server()).post('/suki-doces/contatos').send(message);
      expect(created.status).toBe(201);

      expect((await request(server()).get('/suki-doces/contatos/me')).status).toBe(401);

      const mine = await request(server())
        .get('/suki-doces/contatos/me')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(mine.body.data.messages).toEqual([]);

      const answered = await request(server())
        .put(`/suki-doces/admin/contatos/${created.body.data.id}/respond`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resposta: 'Yes, we deliver every day.' });
      expect(answered.status).toBe(200);
      expect(answered.body.data.contato).toMatchObject({
        respondido: true,
        resposta: 'Yes, we deliver every day.',
      });
    });

    it('webhooks stay locked behind their feature flag until an admin enables it', async () => {
      const locked = await request(server())
        .get('/suki-doces/admin/webhooks')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(locked.status).toBe(403);

      const enable = await request(server())
        .put('/suki-doces/admin/feature-flags/webhooks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ativo: true });
      expect(enable.status).toBe(200);

      const created = await request(server())
        .post('/suki-doces/admin/webhooks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'http://localhost:9999/hook', eventos: ['admin-notification.pedido-criado'] });
      expect(created.status).toBe(201);

      const invalid = await request(server())
        .post('/suki-doces/admin/webhooks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'http://localhost:9999/hook', eventos: ['nope'] });
      expect(invalid.status).toBe(400);

      const list = await request(server())
        .get('/suki-doces/admin/webhooks')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(list.body.data).toHaveLength(1);
    });

    it('admin notifications endpoint answers with the pagination contract', async () => {
      const res = await request(server())
        .get('/suki-doces/admin/notificacoes?limit=99999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(100); // page size is capped
    });
  });
});

describe('health check when a dependency is down', () => {
  it('answers 503 with status "error" and keeps reporting the other probes', async () => {
    const probes: HealthProbe[] = [
      {
        name: 'database',
        check: async () => ({
          status: 'down',
          responseTimeMs: 3,
          details: { error: 'connection refused' },
        }),
      },
      { name: 'memory', check: async () => ({ status: 'up', responseTimeMs: 0 }) },
    ];

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [CheckHealthUseCase, { provide: HEALTH_PROBES, useValue: probes }],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
    expect(res.body.checks.database).toMatchObject({
      status: 'down',
      details: { error: 'connection refused' },
    });
    expect(res.body.checks.memory.status).toBe('up');

    // liveness must not depend on the broken dependency
    expect((await request(app.getHttpServer()).get('/health/live')).status).toBe(200);

    await app.close();
  });

  it('treats a probe that throws as down instead of failing the whole report', async () => {
    const probes: HealthProbe[] = [
      {
        name: 'database',
        check: async () => {
          throw new Error('boom');
        },
      },
    ];
    const useCase = new CheckHealthUseCase(probes);
    const report = await useCase.execute();
    expect(report.status).toBe('error');
    expect(report.checks.database.status).toBe('down');
  });
});
