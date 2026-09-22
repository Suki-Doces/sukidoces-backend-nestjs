# Suki Doces — API REST (NestJS + TypeORM)

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0803?style=for-the-badge)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)

Back-end da Suki Doces: Express → NestJS → (revisão de arquitetura) →
**Prisma → TypeORM** (requisito do professor: front-end em React Native,
back-end em NestJS + TypeORM).

📄 **Leia primeiro**: [`MIGRATION_NOTES.md`](./MIGRATION_NOTES.md) tem o
histórico completo de mudanças, incluindo a migração de ORM.
[`ARCHITECTURE.md`](./ARCHITECTURE.md) explica as decisões de design.

## Configuração

```bash
npm install
cp .env.example .env   # preencha com suas credenciais reais

npm run migration:run   # roda as migrations contra o MySQL configurado em DATABASE_URL
npm run seed             # opcional — popula dados de exemplo

npm run start:dev
```

A API sobe em `http://localhost:3000`. Documentação interativa (Swagger)
em `/docs`. Health check em `/health`, métricas Prometheus em `/metrics`.

## Testes

```bash
npm test              # unitários (mocks de repositório/TypeORM)
npm run test:e2e       # end-to-end — sobe a app inteira contra SQLite EM MEMÓRIA de verdade
npm run lint           # type-check (tsc --noEmit)
```

O TypeORM não precisa de nenhum binário externo para funcionar — por isso
os testes E2E rodam contra um banco SQLite real (`better-sqlite3`,
`:memory:`), não apenas mocks. Isso valida relações, chaves estrangeiras e
constraints de verdade, não só "compila".

## Com Docker

```bash
docker compose up --build
```

## Estrutura

```
src/
  database/
    entities/     — as 12 entidades TypeORM (@Entity)
    data-source.ts — usado pela CLI de migrations
    database.module.ts — TypeOrmModule.forRootAsync (conexão real)
    seed.ts
  common/repositories/ — Repository Pattern para as 5 entidades usadas
                          por 3+ módulos (Usuario, Administrador,
                          Produto, Categoria, Pedido)
  auth/, usuario/, produtos/, carrinho/, pedidos/, categorias/,
  clientes/, admin/, admin-perfil/, notificacoes/, contato/, chat/
  notifications/  — barramento de eventos (Observer) p/ notificar admin
  webhooks/       — dispara eventos p/ URLs de terceiros (feature flag)
  feature-flags/, email/, health/, metrics/, cloudinary/
  common/         — guards, filtros, decorators, enums, validators
```

## Variáveis de ambiente obrigatórias

A aplicação recusa iniciar sem elas (validação via Joi):
`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Veja `.env.example`.
