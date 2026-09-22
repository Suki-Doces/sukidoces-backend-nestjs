import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseModule } from '../src/database/database.module';
import { TestDatabaseModule } from './test-database.module';
import { CloudinaryService } from '../src/cloudinary/cloudinary.service';

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
});
