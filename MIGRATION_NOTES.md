# Notas de Migração — Prisma → TypeORM

## Rodada mais recente: Use Cases + domínio rico + DTOs de produto

1. **Use Cases** (11 classes em 5 módulos — ver `ARCHITECTURE.md`). Controllers
   chamam o Use Case direto. `AuthService` foi removido (virou 4 Use Cases +
   `TokenIssuerService`). Leituras/CRUD simples ficaram em Services.
2. **Domínio rico** para `Pedido` e `Produto`, com mappers e hierarquia de
   `DomainError`. Regras que antes eram `if`s espalhados nos services
   (estoque, janela de 2h, "pedido já processado") agora vivem no domínio e têm
   testes unitários próprios, sem Nest nem banco.
3. **DTOs tipados para criar/atualizar produto** (`CreateProdutoDto`,
   `UpdateProdutoDto`). Antes eram `body: any` com `parseFloat` manual no
   service. Como o corpo é multipart (tudo chega como string), os campos
   numéricos usam `@Type(() => Number)`.

### Comportamento da API — o que mudou e o que não mudou

- Status HTTP e textos de erro dos fluxos migrados foram **preservados** (o
  domínio gera as mesmas mensagens: "Estoque insuficiente para: X. Disponível:
  N", "Pedidos entregues não podem ser cancelados", etc.), e há testes
  verificando isso.
- **Mudança intencional:** criar produto agora valida o body. `preco` inválido
  (`abc`), `0` ou negativo, `quantidade` negativa/decimal e `nome` com menos de
  2 caracteres passam a responder **400** — antes, `preco: 'abc'` virava `NaN`
  e só falhava (ou gravava lixo) mais adiante. Também remove tags HTML de
  `nome`/`descricao`.
- **Efeito colateral a conhecer:** com `whitelist: true` no `ValidationPipe`,
  campos desconhecidos no body de `POST/PUT /produtos` agora são descartados em
  silêncio em vez de chegarem ao service.

### Validação desta rodada

`tsc` e `nest build` limpos · 29 suites / 107 testes unitários · 24 testes E2E
contra SQLite em memória, incluindo: cliente comum recebe 403 ao criar produto;
admin cria produto por multipart (strings viram números); checkout acima do
estoque → 400 sem baixar nada; checkout válido baixa o estoque; outro usuário
não cancela (403); dono cancela e o estoque volta; segundo cancelamento → 400
sem devolver estoque duas vezes.

---

## Rodada anterior: inversão de dependência (Clean Architecture)

Extraí interfaces (`IUsuarioRepository`, `IAdministradorRepository`,
`IProdutoRepository`, `ICategoriaRepository`, `IPedidoRepository`) para os
5 repositórios compartilhados, em `src/common/repositories/interfaces/`.
Cada service que antes injetava a classe concreta (`UsuarioRepository`)
agora injeta a interface via token de DI (`@Inject(USUARIO_REPOSITORY)`),
e `RepositoriesModule` é o único lugar que liga o token à implementação
TypeORM real (`useClass`). Ver `ARCHITECTURE.md` para o detalhamento.

9 services tocados (`AuthService`, `UsuarioService`, `ClientesService`,
`AdminPerfilService`, `AdminNotificationListener`, `AdminService`,
`ProdutosService`, `PedidosService`, `CategoriasService`) + os 8 specs
correspondentes, atualizados para mockar o token em vez da classe.
**Nenhuma lógica de negócio mudou** — é puramente uma inversão de quem
depende de quem. Validado com `tsc`, `nest build`, os 57 testes unitários e
os 15 testes E2E (contra SQLite real) passando de ponta a ponta depois da
mudança.

Isso resolve só a "porta 1" das 3 sugeridas para evoluir rumo a Clean
Architecture completo (extrair interfaces). As outras duas
— mover regra de negócio para dentro das entidades (hoje anêmicas) e criar
uma camada formal de Use Cases — continuam fora de escopo, pela mesma
razão já registrada: o ganho não compensa a complexidade extra para o
tamanho atual do domínio.

## Por quê

Requisito do professor: o projeto final precisa ter front-end em React
Native e back-end em NestJS com **TypeORM** (não Prisma). O restante da
arquitetura (módulos, Repository Pattern, Observer para notificações,
guards, DTOs, testes) foi preservado — só a camada de acesso a dados
mudou de ORM.

## O que mudou de fato

- **12 entidades TypeORM** (`src/database/entities/`) substituem o
  `schema.prisma`. Mesmos nomes de tabela e coluna (`usuario`,
  `id_usuario`, etc.) — nenhuma migração de dados necessária além de criar
  as tabelas novas (`webhooks`, `featureFlags`) e a coluna nova
  (`usuario.email_verificado`), que já existiam desde a rodada anterior.
- **`PrismaService`/`PrismaModule` → `DatabaseModule`**
  (`TypeOrmModule.forRootAsync`), com `synchronize: false` sempre —
  mudança de schema passa por migration explícita
  (`npm run migration:generate` / `migration:run`), nunca sincronização
  automática.
- **Os 5 repositórios compartilhados** (`UsuarioRepository`,
  `AdministradorRepository`, `ProdutoRepository`, `CategoriaRepository`,
  `PedidoRepository`) mantiveram os MESMOS nomes de método — só a
  implementação interna trocou de `this.prisma.model.method()` para
  `this.repo.method()` (TypeORM). **Isso significa que nenhum service que
  consome esses repositórios precisou mudar** — essa é exatamente a
  vantagem que o Repository Pattern (extraído numa rodada anterior) foi
  desenhado para entregar.
- **Transações**: `prisma.$transaction(fn)` → `dataSource.transaction(fn)`,
  onde `fn` recebe um `EntityManager` em vez de um objeto `tx` com um
  atalho por model. Isso exigiu reescrever os 2 blocos de transação
  (`PedidosService.checkout`, `UsuarioService.cancelarPedido`) usando
  `manager.getRepository(Entity)`.
- **Erros de banco**: `prisma-error-mapper.ts` (códigos `P2002`/`P2025`)
  → `db-error-mapper.ts` (códigos nativos do mysql2:
  `ER_DUP_ENTRY`/`ER_NO_REFERENCED_ROW`/`ER_ROW_IS_REFERENCED_2`). O
  TypeORM propaga o erro original do driver (`QueryFailedError` copia
  `.code` do driver), então a lógica de mapeamento ficou mais simples, não
  mais complexa.
- **Health check**: `PrismaHealthIndicator` customizado (precisava de uma
  query manual `SELECT 1`) → `TypeOrmHealthIndicator`, que já vem pronto
  no `@nestjs/terminus`.

## Ganho inesperado nos testes E2E

Com Prisma, os testes E2E precisavam mockar `PrismaService` inteiro,
porque gerar um client real (`prisma generate`) depende de baixar um
binário Rust — algo que falhou consistentemente em ambientes com rede
restrita. TypeORM não tem essa dependência: os testes E2E agora rodam
contra um banco **SQLite real em memória** (`better-sqlite3`), substituindo
`DatabaseModule` via `.overrideModule()` do Nest. Isso significa que os
testes exercitam relações, chaves estrangeiras e constraints de unicidade
de verdade — não apenas comportamento mockado. Ver `test/app.e2e-spec.ts`.

## O que NÃO mudou

Todo o resto da revisão de arquitetura da rodada anterior continua válido
e não foi tocado: padrão de resposta `{success, message, data}`, access +
refresh token, rate limiting, Helmet, CORS via env, cache em memória,
enums, validador de CPF, Swagger, Sentry (inerte sem DSN), verificação de
e-mail (inerte sem SMTP), webhooks atrás de feature flag, Docker/CI. Veja
o restante deste histórico abaixo para os detalhes dessas decisões.

## Validação feita nesta rodada

- `npx tsc --noEmit` e `npx nest build` — sem erros.
- `npx jest` — todos os testes unitários passando (mocks de repositório
  TypeORM em vez de Prisma).
- `npx jest --config ./test/jest-e2e.json` — testes E2E passando contra
  SQLite real em memória, incluindo um fluxo completo de
  registro → login → acesso a rota protegida → refresh de token.

## Um lembrete sobre este ambiente de desenvolvimento

Este projeto foi reconstruído mais de uma vez nesta conversa porque o
sandbox onde ele foi desenvolvido reseta o sistema de arquivos
periodicamente. O conteúdo final é fiel ao que foi validado a cada rodada,
mas se você notar qualquer inconsistência pontual, é mais provável que
seja um resquício desse processo do que um bug de lógica — abra uma
issue/me avise e eu corrijo.
