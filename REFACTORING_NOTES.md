# Refactoring notes

This version reorganizes the project into Clean Architecture, standardizes the code in English, removes the old `*.spec.ts` unit specs and adds a layered health check.

## Where things moved

| Before | Now |
|---|---|
| `database/entities/*.entity.ts` (ORM classes) | `domain/entities/*` (plain classes) + `infrastructure/persistence/schemas/schemas.ts` (mapping) |
| `common/repositories/*` (+ interfaces) | `domain/repositories/*` (contracts) + `infrastructure/persistence/repositories/*` |
| `*/use-cases/*`, `*.service.ts` | `application/use-cases/<area>/*` |
| `*/domain/*` (Order, Product) | `domain/entities/order.entity.ts`, `product.entity.ts` |
| `common/domain-errors` | `domain/errors` |
| `*.controller.ts`, `dto/`, guards, filters | `presentation/http/*` |
| `cloudinary/`, `email/`, `notifications/`, `webhooks/` listeners, `metrics/`, `health/`, `config/` | `infrastructure/*` |
| `@nestjs/terminus` health route | custom health check (domain + use case + probes + controller) |

## Database

**No migration is needed.** Table and column names, types, indexes and foreign keys are unchanged. This was checked by building the old decorated entities and the new schemas on the same engine and comparing tables, columns, nullability, defaults, foreign keys and indexes: 12 tables, 0 differences (and the comparison was confirmed to detect a deliberately renamed column).

## Naming

All identifiers, comments, log lines and response messages are in English. What intentionally stays in Portuguese:

- **Public HTTP contract:** routes, request fields, response fields (kept so existing clients keep working). Confined to `presentation`.
- **Database names and persisted values:** table/column names (`infrastructure/persistence/schemas`) and enum values such as `'pago'`, `'cliente'`, `'cartao'`, plus the webhook event names and webhook payload fields that third parties may already depend on.
- **Brand and product content:** "Suki Doces", the `suki-doces` URL prefix, the Cloudinary folder, and the `/produtos/ID` link format the chat assistant emits for the front-end.

## Behaviour that changed (everything else is intended to be identical)

1. **Message and log texts are now English** (e.g. `Pedido realizado com sucesso` -> `Order placed successfully`). If a client shows `message` to end users, they will now see English.
2. **Error bodies** from use cases and guards are uniform: `{ statusCode, message, error }`. Before, the shape depended on which exception class was used. Validation errors keep their native format (with English messages).
3. **`/health` response format** is new (`status`, `timestamp`, `uptimeSeconds`, `checks`) and `@nestjs/terminus` was removed. Added `/health/live` and `/health/ready`; health and metrics are no longer rate limited.
4. **Registration sets `role = 'cliente'` and `active = true` explicitly.** Before it relied on database defaults; without them a self-registered customer would not appear in the admin customer list.
5. **Checkout listing the same product twice** now checks the stock cumulatively (before, each line was checked alone and could oversell).
6. **Chat assistant prompt** is in English and tells the model to answer in the customer's language (Brazilian Portuguese by default), so customers still get Portuguese replies.
7. **Verification e-mail text** is in English.
8. **Categories cache:** the "(cache)" suffix on the response message is gone.
9. `POST /carrinho/add` still accepts both `id_produto` and the older `produto_id`.

## Tests

- All `*.spec.ts` unit specs were deleted (not renamed), as requested.
- One integration suite was kept, because the original request said not to remove integration tests: `test/app.e2e.test.ts` (34 tests). It boots the whole application on an in-memory SQLite database and talks to it through the public HTTP contract, covering authentication, catalog, cart, checkout, cancellation rules, admin panel, contacts, feature-flagged webhooks and the health check (including `503` when a dependency is down). Delete the file (and `scripts/check-architecture.js` if you want) if you do not want it.
- `npm run check:architecture` verifies the dependency rule between layers.

## Not verified here

Everything ran against SQLite and mocks. Not exercised against real services: MySQL (run `npm run start:dev` on a copy of the database first), Cloudinary uploads, SMTP, the Gemini API, Docker builds, and the production CORS/Helmet setup.
