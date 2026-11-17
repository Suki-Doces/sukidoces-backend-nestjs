# Architecture

The API follows **Clean Architecture**: business rules sit in the middle and know nothing about NestJS, TypeORM, HTTP, bcrypt, JWT or any other detail. Details depend on the rules, never the other way round.

```
            presentation  (HTTP: controllers, DTOs, presenters, guards, filter)
                 |  depends on
                 v
            application   (use cases + ports)   <---- implemented by ----  infrastructure
                 |  depends on                                              (TypeORM, bcrypt, JWT,
                 v                                                           Cloudinary, SMTP, Gemini...)
              domain      (entities, rules, repository contracts, events)
```

## The dependency rule (and how it is enforced)

| Layer | May import | Must never import |
|---|---|---|
| `domain` | itself only (no packages at all) | everything else |
| `application` | `domain`, itself, `@nestjs/common` (only for `@Injectable`) | infrastructure, presentation, any other package |
| `infrastructure` | `domain`, `application` | presentation |
| `presentation` | `domain`, `application` | infrastructure |

`npm run check:architecture` scans every import and fails when one of these rules is broken (it runs in CI). `app.module.ts` is the composition root and is the one place that may see all layers.

**Honest compromise:** use cases carry NestJS's `@Injectable()` so the framework can build them. That is the only framework symbol in `application`, and it does not tie the logic to any implementation detail. A stricter variant would register use cases through factories in the composition root.

## Domain

Plain TypeScript classes, no decorators.

- **Entities with behaviour:** `Order` (`place`, `cancel` with the 2-hour window, `markAsPaid`, `ensureBelongsTo`), `Product` (`hasEnoughStock`, `decreaseStock`, `subtotalFor`), `Coupon` (`isApplicable`, `discountFor`), `User`/`Admin` (`toProfile` — a password hash can never leak, even through `JSON.stringify`), `ContactMessage.respond`, `Webhook.subscribesTo`, `CartItem.belongsTo`.
- **Domain errors** (`InsufficientStockError`, `CancellationWindowExpiredError`, ...). The domain never throws HTTP errors.
- **Domain events** (`OrderCreatedEvent`, ...).
- **Repository contracts:** abstract classes (`UserRepository`, `OrderRepository`, ...). An abstract class is both the interface and the injection token, so no `@Inject(SYMBOL)` boilerplate is needed.
- **Health model:** `buildHealthReport` decides what "healthy" means (every probe up).

## Application

One class per business action, each with a single `execute()` method, grouped by area (`auth`, `users`, `products`, `categories`, `cart`, `orders`, `customers`, `admin`, `notifications`, `contacts`, `chat`, `webhooks`, `feature-flags`, `health`).

Use cases receive plain inputs and return plain data or domain entities. They know nothing about HTTP: they throw `ApplicationError`s (`NotFoundError`, `BadRequestError`, ...) or the domain's errors.

**Ports** (`application/ports`) describe everything outside the business logic:

| Port | Adapter (infrastructure) |
|---|---|
| `PasswordHasher` | `BcryptPasswordHasher` |
| `TokenService` | `JwtTokenService` (separate secrets for access and refresh tokens) |
| `ImageStorage` | `CloudinaryImageStorage` |
| `EmailSender` | `SmtpEmailSender` (only logs when SMTP is not configured) |
| `ChatAssistant` | `GeminiChatAssistant` |
| `EventPublisher` | `EventEmitterPublisher` |
| `CacheStore` | `CacheManagerStore` (in memory; Redis is a configuration change) |
| `WebhookClient` | `FetchWebhookClient` |
| `ErrorReporter` | `SentryErrorReporter` (inert without `SENTRY_DSN`) |
| `AppLogger` | `NestAppLogger` |
| `Metrics` | `PrometheusMetrics` |
| `UnitOfWork` | `TypeOrmUnitOfWork` |
| `HealthProbe[]` | `DatabaseHealthProbe`, `MemoryHealthProbe` |

All bindings live in `infrastructure/infrastructure.module.ts` (and `persistence.module.ts` for the repositories).

## Infrastructure

- **Persistence.** Domain classes are mapped to the database with TypeORM `EntitySchema` (`persistence/schemas/schemas.ts`), so the domain needs no ORM decorators and no second set of "ORM entities" or mappers. This file is the only place that knows the table and column names. TypeORM repositories implement the domain contracts.
- **Transactions.** `UnitOfWork.run(work)` gives the use case transaction-bound repositories. Checkout (order + items + stock) and cancellation (status + stock) are atomic. Stock changes are `quantity = quantity ± N` statements, never "read, compute, write back", so concurrent checkouts cannot overwrite each other.
- **Events.** Handlers translate domain events into admin notifications (`AdminNotificationHandler`) and webhook deliveries (`WebhookDispatchHandler`). Adding a reaction does not touch the use case that raised the event.

## Presentation

- **Controllers** are thin: parse the request, call a use case, wrap the result in `{ success, message, data }`.
- **DTOs** validate input with `class-validator`.
- **Presenters** (`support/presenters.ts`) shape responses.
- **One exception filter** is the only place where application and domain errors become HTTP status codes. 4xx are logged as warnings; 5xx are logged with the stack trace and reported to `ErrorReporter`.
- **Guards:** `JwtAuthGuard`, `OptionalAuthGuard`, `AdminGuard`, `FeatureFlagGuard('key')`. They use the `TokenService` port, not a JWT library.

### The public HTTP contract is kept in one layer

Routes (`/usuario/registro`), request field names (`nome`, `senha`) and response field names (`id_pedido`, `valor_total`) are the contract with the existing web and mobile clients, so they were **not** renamed. They are confined to `presentation`: routes in the controllers, request names in the DTOs' `@Expose({ name })`, response names in the presenters. Everything behind that layer uses English names. Renaming the contract later would only touch those three places.

The same applies to persisted values: enum members are English (`OrderStatus.PAID`) while their values are what the database already stores (`'pago'`).

## Request flow

```
HTTP -> middleware -> guards -> ValidationPipe (DTO) -> controller -> use case
        -> domain entity rules -> repository contract -> TypeORM -> MySQL
        <- presenter <- controller <- result          errors -> AllExceptionsFilter -> HTTP status
```

## Health check

`CheckHealthUseCase` runs every registered `HealthProbe` in parallel; a probe that throws counts as down. `buildHealthReport` (domain) aggregates the result. `HealthController` maps it to `200`/`503`. `GET /health/live` deliberately checks no dependency, so an orchestrator does not restart a healthy process just because the database is down.

## What was deliberately left out

- **CSRF protection:** not applicable to a stateless bearer-token API.
- **Redis cache, APM, secrets manager:** need external services; the ports are in place.
- **Access-token revocation on logout:** access tokens remain valid until they expire (15 minutes). Logout does revoke the submitted refresh token, preventing it from issuing another access token.
