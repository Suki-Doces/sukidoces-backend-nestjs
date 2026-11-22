# Suki Doces API

REST API of the Suki Doces store: catalog, cart, orders, admin panel, e-mail verification, webhooks and an AI sales assistant.
Built with **NestJS + TypeORM (MySQL)** and organized with **Clean Architecture**.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the design and [`REFACTORING_NOTES.md`](./REFACTORING_NOTES.md) for what changed in this version.

## Getting started

Use Node.js 20.19 or newer within the 20.x release line (the version used by Docker and integration tests):

```bash
npm install
cp .env.example .env        # fill in your real credentials

npm run migration:run       # create/update the schema before starting the API
npm run seed                # optional: sample admin, categories and products
npm run start:dev
```

The initial migration creates the schema on an empty MySQL database. For the existing Express/Prisma database, first make a verified backup, then run `npm run migration:adopt:legacy` followed by `npm run migration:run`. The adoption command only records the existing initial schema after checking its core tables; the following additive migration adds NestJS fields, marks existing accounts as verified (the Express version had no email-verification flow), copies existing address rows into the profile JSON field, and creates missing NestJS support tables. Do not run `migration:run` against a populated Express database before adopting it.

- API: `http://localhost:3000/suki-doces/...`
- Swagger UI: `http://localhost:3000/docs`
- Health: `GET /health`, `GET /health/ready`, `GET /health/live`
- Metrics (Prometheus): `GET /metrics`

With Docker: `docker compose up --build` (the API container applies migrations before starting).

## Scripts

| Script | What it does |
|---|---|
| `npm run start:dev` | Runs the API in watch mode |
| `npm run build` | Compiles to `dist/` |
| `npm run lint` | Lints source and tests with ESLint |
| `npm run typecheck` | Type-checks the whole project (`tsc --noEmit`) |
| `npm run format` / `npm run format:check` | Formats source and checks formatting |
| `npm test` | Runs tests with coverage thresholds for core domain entities |
| `npm run test:e2e` | Runs the integration and unit test suites |
| `npm run check:architecture` | Fails if any layer imports something it must not (dependency rule) |
| `npm run migration:generate -- src/infrastructure/persistence/migrations/Name` | Generates a migration against `DATABASE_URL` |
| `npm run migration:run` | Applies pending TypeORM migrations (`synchronize` is always off) |
| `npm run migration:revert` | Reverts the last applied migration |
| `npm run migration:adopt:legacy` | Baselines the existing Express/Prisma schema so only additive migrations are applied |
| `npm run seed` | Inserts sample data |

## Health check

Meant for load balancers, Kubernetes and uptime monitors. All three routes live outside the API prefix and are exempt from rate limiting.

| Route | Purpose | Success | Failure |
|---|---|---|---|
| `GET /health` | Full report: every dependency probe | `200` | `503` |
| `GET /health/ready` | Readiness: can this instance receive traffic? | `200` | `503` |
| `GET /health/live` | Liveness: is the process running? (no dependency checked) | `200` | - |

```json
{
  "status": "ok",
  "timestamp": "2026-11-12T10:00:00.000Z",
  "uptimeSeconds": 1234.5,
  "checks": {
    "database": { "status": "up", "responseTimeMs": 3 },
    "memory": { "status": "up", "responseTimeMs": 0, "details": { "heapUsedMb": 80.2, "heapLimitMb": 500 } }
  }
}
```

A new probe is one class implementing `HealthProbe` and one line in `InfrastructureModule`.

## Environment variables

Required (the app refuses to start without them): `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
Optional: `GEMINI_API_KEY`, `ALLOWED_ORIGINS`, `TRUST_PROXY`, `SENTRY_DSN`, `SMTP_*`, `FRONTEND_URL`, `THROTTLE_*`, `BCRYPT_SALT_ROUNDS`. Set `TRUST_PROXY` to the trusted proxy hop count or a comma-separated list of trusted IPs/CIDRs when deployed behind a proxy. See `.env.example`.

Customer accounts must verify their e-mail before they can log in or use authenticated routes. Refresh tokens rotate on every refresh and are single-use; logout accepts the current refresh token in its JSON body and revokes it. Checkout requires a unique `Idempotency-Key` header for each new purchase; retries with the same key and payload return the original order.

## Project layout

```
src/
  domain/           entities, business rules, enums, domain events, repository contracts
  application/      use cases, ports (contracts for external things), application errors
  infrastructure/   TypeORM persistence, bcrypt, JWT, Cloudinary, SMTP, Gemini, events, cache, Sentry, metrics, health probes
  presentation/http controllers, DTOs, presenters, guards, exception filter, middleware, feature modules
  app.module.ts     composition root
test/               integration tests
scripts/            check-architecture.js
```
