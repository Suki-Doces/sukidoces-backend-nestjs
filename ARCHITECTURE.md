# Arquitetura — Suki Doces API (NestJS + TypeORM)

## Camadas

```
Request → Middleware → Guards → Pipes → Controller → Service → Repository → TypeORM → MySQL
                                                          ↓
                                                   EventEmitter2 (eventos de domínio)
                                                          ↓
                                    AdminNotificationListener / WebhookDispatcherListener
```

- **Controller**: só roteamento HTTP, extração de DTO, delegação.
- **Service**: regra de negócio. Depende de **interfaces**
  (`IUsuarioRepository`, `IPedidoRepository`, etc.), nunca das classes
  concretas — ver seção "Inversão de dependência" abaixo.
- **Repository** (`src/common/repositories/`): encapsula acesso via
  `@InjectRepository(Entity)` + `Repository<Entity>` do TypeORM, para as 5
  entidades usadas por 3+ services (`Usuario`, `Administrador`, `Produto`,
  `Categoria`, `Pedido`). Entidades de consumidor único
  (`CarrinhoItem`, `Notificacao`, `ContatoMensagem`, `Webhook`,
  `FeatureFlag`) são injetadas diretamente no service que as usa —
  `Repository<Entity>` do TypeORM já É o Repository Pattern; um wrapper
  customizado ali só duplicaria a API sem lógica de domínio própria.
- **TypeORM**: `DatabaseModule` registra uma única conexão
  (`TypeOrmModule.forRootAsync`), `synchronize: false` sempre — mudanças
  de schema passam por migration explícita.

## Inversão de dependência (Clean Architecture)

As 5 entidades compartilhadas têm uma **porta** (`src/common/repositories/interfaces/`)
— uma interface TypeScript (`IUsuarioRepository`, `IProdutoRepository` etc.)
que descreve O QUE o repositório faz, sem dizer COMO. Todo service que
precisa de dados desses tipos injeta a interface, nunca a classe:

```ts
// auth.service.ts — depende da abstração, não da implementação
constructor(
  @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: IUsuarioRepository,
) {}
```

`RepositoriesModule` é o único lugar do projeto que conhece a
implementação concreta (TypeORM) por trás de cada porta:

```ts
{ provide: USUARIO_REPOSITORY, useClass: UsuarioRepository }
```

Como o TypeScript apaga interfaces em tempo de execução, o "encaixe"
entre pedir a interface e receber a implementação certa depende de um
token de DI — aqui, um `Symbol` (`USUARIO_REPOSITORY`), exportado junto
com a interface no mesmo arquivo. Trocar a implementação (outro ORM, uma
API externa, um mock fixo) significa escrever uma nova classe que
implementa a mesma interface e trocar essa uma linha no módulo — nenhum
service muda.

Escopo desta inversão: só as 5 entidades compartilhadas (onde o ganho de
testabilidade/desacoplamento é real, por serem consumidas por múltiplos
módulos). Entidades de consumidor único continuam com `Repository<Entity>`
do TypeORM injetado direto — colocar uma interface ali seria abstração sem
propósito, já que só existe uma implementação possível e um único
consumidor.

## Autenticação: access + refresh token

Inalterado da rodada anterior: access token de 15 min (`JWT_SECRET`),
refresh token de 7 dias (`JWT_REFRESH_SECRET`, segredo separado), cada um
marcado com `type: 'access' | 'refresh'` no payload para impedir uso
cruzado. Ver `MIGRATION_NOTES.md` da rodada anterior para o raciocínio
completo.

## Transações

TypeORM não tem um equivalente direto a `prisma.$transaction(fn)` no nível
do repositório — a transação é aberta a partir de `DataSource`, que
entrega um `EntityManager` transacional para o callback:

```ts
async runTransaction<T>(fn: (manager: EntityManager) => Promise<T>): Promise<T> {
  return this.dataSource.transaction(fn);
}
```

Dentro do callback, `manager.getRepository(Entity)` dá acesso aos métodos
normais do TypeORM, só que participando da mesma transação (commit/rollback
juntos). Usado em `PedidosService.checkout` (criar pedido + baixar
estoque) e `UsuarioService.cancelarPedido` (cancelar + devolver estoque).

## Tratamento de erros

Inalterado em estrutura: um único `AllExceptionsFilter` global, que separa
erro de negócio (4xx, log `warn`) de erro técnico (5xx, log `error` +
Sentry). O que mudou foi o mapeador de erros de banco
(`db-error-mapper.ts`): TypeORM propaga o erro nativo do driver mysql2
(`QueryFailedError` copia `.code`), então checar `err.code === 'ER_DUP_ENTRY'`
funciona sem precisar de tradução de códigos específicos de um ORM.

## Testes E2E contra um banco real

`test/test-database.module.ts` substitui `DatabaseModule` via
`.overrideModule()` do Nest, usando SQLite em memória
(`better-sqlite3`, `synchronize: true`). Isso só é possível porque o
TypeORM não depende de nenhum binário externo para funcionar — ao
contrário do `PrismaClient`, que precisa baixar um binário de engine para
sequer gerar os tipos. Os testes E2E exercitam relações, FKs e
constraints de unicidade reais (ex.: o teste de "rejeitar segundo registro
com mesmo e-mail" depende do `@Column({ unique: true })` da entidade
`UsuarioEntity` disparando um erro de verdade).

## O que continua igual (rodada anterior)

Observer/Event Bus para notificações de admin + webhooks, cache em
memória, rate limiting, Helmet, CORS via env, enums, Repository Pattern,
Swagger, Sentry/e-mail/webhooks como integrações opcionais e inertes sem
credenciais reais, e as mesmas decisões de **não** implementar CSRF (API
stateless Bearer-token), Clean Architecture completa, ou separação de
pastas admin/cliente. Ver `MIGRATION_NOTES.md` para o detalhamento
original dessas escolhas.
