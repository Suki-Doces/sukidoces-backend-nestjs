import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseModule } from '../src/database/database.module';
import { TestDatabaseModule } from './test-database.module';
import { CloudinaryService } from '../src/cloudinary/cloudinary.service';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdministradorEntity } from '../src/database/entities/administrador.entity';

describe('AppModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DatabaseModule)
      .useModule(TestDatabaseModule)
      .overrideProvider(CloudinaryService)
      .useValue({ onModuleInit: jest.fn(), uploadProductImage: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('suki-doces', { exclude: ['/', '/health', '/metrics'] });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('infraestrutura', () => {
    it('GET / deve retornar a mensagem de boas-vindas (fora do prefixo global)', async () => {
      const res = await request(app.getHttpServer()).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Suki Doces');
    });

    it('GET /health deve retornar status ok, com o banco de dados respondendo de verdade', async () => {
      const res = await request(app.getHttpServer()).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.details.database.status).toBe('up');
    });

    it('GET /metrics deve retornar métricas no formato Prometheus', async () => {
      const res = await request(app.getHttpServer()).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.text).toContain('http_requests_total');
    });
  });

  describe('validação e autenticação', () => {
    it('POST /usuario/registro com body inválido deve retornar 400 (ValidationPipe)', async () => {
      const res = await request(app.getHttpServer())
        .post('/suki-doces/usuario/registro')
        .send({ nome: 'A', email: 'nao-e-email', senha: '123', telefone: '1' });

      expect(res.status).toBe(400);
    });

    it('GET /produtos/:id com id não numérico deve retornar 400', async () => {
      const res = await request(app.getHttpServer()).get('/suki-doces/produtos/abc');
      expect(res.status).toBe(400);
    });

    it('rota protegida sem token deve retornar 401', async () => {
      const res = await request(app.getHttpServer()).get('/suki-doces/usuario/perfil');
      expect(res.status).toBe(401);
    });

    it('rota protegida com token malformado deve retornar 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/suki-doces/usuario/perfil')
        .set('Authorization', 'Bearer token-invalido');
      expect(res.status).toBe(401);
    });

    it('GET /produtos/categorias (rota pública) deve retornar 200 mesmo sem categorias cadastradas', async () => {
      const res = await request(app.getHttpServer()).get('/suki-doces/produtos/categorias');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('fluxo completo de registro → login → rota protegida', () => {
    const usuario = {
      nome: 'Maria Teste',
      email: 'maria.e2e@teste.com',
      senha: 'senha123',
      telefone: '11999999999',
    };

    let accessToken: string;
    let refreshToken: string;

    it('deve registrar um novo usuário e devolver tokens', async () => {
      const res = await request(app.getHttpServer()).post('/suki-doces/usuario/registro').send(usuario);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe(usuario.email);

      accessToken = res.body.data.token;
      refreshToken = res.body.data.refreshToken;
    });

    it('deve rejeitar um segundo registro com o mesmo e-mail (violação de unicidade real no banco)', async () => {
      const res = await request(app.getHttpServer()).post('/suki-doces/usuario/registro').send(usuario);
      expect(res.status).toBe(400);
    });

    it('deve acessar o perfil usando o access token recebido no registro', async () => {
      const res = await request(app.getHttpServer())
        .get('/suki-doces/usuario/perfil')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(usuario.email);
      expect(res.body.data.user).not.toHaveProperty('senha');
    });

    it('deve fazer login com a senha correta e receber um novo par de tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/suki-doces/usuario/login')
        .send({ email: usuario.email, senha: usuario.senha });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('deve rejeitar login com senha errada', async () => {
      const res = await request(app.getHttpServer())
        .post('/suki-doces/usuario/login')
        .send({ email: usuario.email, senha: 'senhaErrada' });

      expect(res.status).toBe(401);
    });

    it('deve renovar o access token usando o refresh token', async () => {
      const res = await request(app.getHttpServer()).post('/suki-doces/usuario/refresh').send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('deve rejeitar o access token sendo usado no endpoint de refresh', async () => {
      const res = await request(app.getHttpServer())
        .post('/suki-doces/usuario/refresh')
        .send({ refreshToken: accessToken });

      expect(res.status).toBe(401);
    });
  });
  // Exercita a arquitetura nova de ponta a ponta contra o banco de verdade:
  // DTO multipart (strings → number), Use Cases, objetos de domínio
  // (Produto/Pedido) e a atomicidade do estoque nas transações.
  describe('fluxo de loja: admin cadastra produto (multipart) → cliente compra → cancela', () => {
    let adminToken: string;
    let clienteToken: string;
    let idProduto: number;
    let idPedido: number;

    const estoqueAtual = async () => {
      const res = await request(app.getHttpServer()).get(`/suki-doces/produtos/${idProduto}`);
      return res.body.data.quantidade;
    };

    beforeAll(async () => {
      const dataSource = app.get(DataSource);
      const adminRepo = dataSource.getRepository(AdministradorEntity);
      await adminRepo.save(
        adminRepo.create({
          nome: 'Admin E2E',
          email: 'admin.e2e@teste.com',
          senha: await bcrypt.hash('admin123', 4),
        }),
      );

      const loginAdmin = await request(app.getHttpServer())
        .post('/suki-doces/admin/login')
        .send({ email: 'admin.e2e@teste.com', senha: 'admin123' });
      adminToken = loginAdmin.body.data.token;

      const registro = await request(app.getHttpServer()).post('/suki-doces/usuario/registro').send({
        nome: 'Joao Loja',
        email: 'joao.loja@teste.com',
        senha: 'senha123',
        telefone: '11988887777',
      });
      clienteToken = registro.body.data.token;
    });

    it('cliente comum NÃO pode cadastrar produto (403)', async () => {
      const res = await request(app.getHttpServer())
        .post('/suki-doces/produtos')
        .set('Authorization', `Bearer ${clienteToken}`)
        .field('nome', 'Bolo Proibido')
        .field('preco', '10');

      expect(res.status).toBe(403);
    });

    it('rejeita produto com preço inválido (DTO) com 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/suki-doces/produtos')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('nome', 'Bolo Quebrado')
        .field('preco', 'abc');

      expect(res.status).toBe(400);
    });

    it('admin cadastra produto via multipart: o DTO converte as strings em números', async () => {
      const res = await request(app.getHttpServer())
        .post('/suki-doces/produtos')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('nome', 'Bolo E2E')
        .field('preco', '45.90')
        .field('quantidade', '10');

      expect(res.status).toBe(201);
      expect(res.body.data.produto.preco).toBe(45.9);
      expect(res.body.data.produto.quantidade).toBe(10);
      idProduto = res.body.data.produto.id_produto;
    });

    it('o produto cadastrado aparece no catálogo com preço numérico', async () => {
      const res = await request(app.getHttpServer()).get(`/suki-doces/produtos/${idProduto}`);
      expect(res.status).toBe(200);
      expect(res.body.data.nome).toBe('Bolo E2E');
      expect(res.body.data.preco).toBe(45.9);
    });

    it('checkout com quantidade acima do estoque é recusado pelo domínio (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/suki-doces/pedidos')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ produtos: [{ id_produto: idProduto, quantidade: 999 }], metodo_pagamento: 'pix' });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('Estoque insuficiente');
      expect(await estoqueAtual()).toBe(10); // nada foi baixado
    });

    it('checkout válido cria o pedido e baixa o estoque no banco', async () => {
      const res = await request(app.getHttpServer())
        .post('/suki-doces/pedidos')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ produtos: [{ id_produto: idProduto, quantidade: 2 }], metodo_pagamento: 'pix' });

      expect(res.status).toBe(201);
      expect(res.body.data.pedido.valor_total).toBeCloseTo(91.8);
      expect(res.body.data.pedido.status).toBe('pago');
      idPedido = res.body.data.pedido.id_pedido;

      expect(await estoqueAtual()).toBe(8);
    });

    it('outro usuário NÃO pode cancelar o pedido (403)', async () => {
      // reaproveita a Maria registrada no bloco anterior
      const login = await request(app.getHttpServer())
        .post('/suki-doces/usuario/login')
        .send({ email: 'maria.e2e@teste.com', senha: 'senha123' });

      const res = await request(app.getHttpServer())
        .patch(`/suki-doces/usuario/pedidos/${idPedido}/cancelar`)
        .set('Authorization', `Bearer ${login.body.data.token}`);

      expect(res.status).toBe(403);
      expect(await estoqueAtual()).toBe(8);
    });

    it('o dono cancela o pedido dentro da janela de 2h e o estoque é devolvido', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/suki-doces/usuario/pedidos/${idPedido}/cancelar`)
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pedido.status).toBe('cancelado');
      expect(await estoqueAtual()).toBe(10);
    });

    it('cancelar de novo é recusado (400) e o estoque não é devolvido duas vezes', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/suki-doces/usuario/pedidos/${idPedido}/cancelar`)
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('Este pedido já foi cancelado');
      expect(await estoqueAtual()).toBe(10);
    });
  });
});
