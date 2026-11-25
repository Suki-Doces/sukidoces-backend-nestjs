# Integração: site Angular + app Expo → API NestJS

O site (`sukidoces-website`) e o app (`suki-doces-mobile-rn`) agora usam **esta API NestJS** no lugar do
antigo `sukidoces-service` (Express + Prisma). Os dois são clientes do mesmo backend e do mesmo banco, então a
sincronização é direta: o que um grava, o outro lê na próxima requisição.

| Ação | Onde aparece |
|---|---|
| Compra no app | Painel do site: **Pedidos** (coluna *Origem* = App), **Dashboard**, **Notificações** ("(mobile app)"), **Clientes**; estoque atualizado no site |
| Compra no site | App: **Meus pedidos** ("feito no site"); painel com *Origem* = Site |
| Admin muda status no painel | App: status atualizado em "Meus pedidos" |
| Item no carrinho (app ou site) | O carrinho fica no servidor: aparece nos dois |
| Contato enviado pelo app | Painel do site: **Contatos** (responder, marcar como resolvido, excluir) |
| Conta criada no app ou no site | Mesmo login nos dois |

Atualização automática: o painel de pedidos recarrega a cada 15 s e o dashboard a cada 30 s; a tela "Meus pedidos"
do app recarrega ao abrir, ao puxar para baixo e a cada 20 s.

## O que mudou na API

- **Origem do pedido**: o cliente envia `X-Client-Platform: web | mobile`; o pedido guarda em `pedidos.origem`
  (migration `1760000002000-AddOrderOrigin`) e a API devolve `origem` nos pedidos, no painel e no dashboard.
- **`POST /suki-doces/cupons/validar`** `{ codigo, subtotal }` → `{ codigo, tipo, valor, valor_desconto }`
  (o site já chamava essa rota, que não existia em nenhum backend).
- **`PUT /admin/contatos/:id/mark-read`** e **`DELETE /admin/contatos/:id`** (usadas pelo painel).
- **`EMAIL_VERIFICATION_REQUIRED`** (padrão `true`). Com `false`, contas novas entram direto.
- Endereço enviado no formato antigo do Prisma (`{ create }` / `{ update: { where, data } }`) é convertido
  para a lista salva em `usuario.enderecos`.
- Carrinho vazio não cobra mais frete (antes devolvia R$ 8,90 com zero itens).
- **Frete por destino (origem Diadema - SP), calculado só no servidor.** Antes existiam três regras
  (carrinho da API e app: R$ 8,90 abaixo de R$ 50; checkout do site: tabela por cidade/estado) e o frete
  nem entrava no pedido. Agora:
  - `POST /suki-doces/frete/calcular` `{ subtotal, estado, cidade }` → `{ frete, frete_gratis, frete_padrao, frete_gratis_a_partir_de, zona }` (pública).
  - `GET /carrinho` aceita `?estado=&cidade=`; sem eles usa o endereço principal salvo na conta; sem destino
    devolve `frete: 0` e `freteCalculado: false`.
  - `POST /pedidos` aceita `endereco_entrega: { estado, cidade }` (ou usa o endereço salvo; sem nenhum, 400).
    O frete é somado ao `valor_total` e gravado em `pedidos.valor_frete` (migration `1760000003000-AddOrderShipping`).
    Site e app não enviam valor de frete.
  - Faixas: Diadema R$ 5,90 (grátis a partir de R$ 50); capital e ABC R$ 9,90 (R$ 100); resto de SP R$ 16,90
    (R$ 150); RJ/MG/ES/PR/SC/RS R$ 24,90 (R$ 250); demais estados R$ 38,90 (R$ 250). Grátis pelo subtotal dos
    produtos, antes do cupom. A regra está em `src/domain/shipping/shipping.ts`.
  - O faturamento do dashboard passa a incluir o frete (`valor_total` é o que o cliente pagou). Pedidos antigos ficam com `valor_frete = 0`.

## Como rodar tudo localmente

### 1. API
Com MySQL (produção/homologação): siga o README (`migration:run`; em banco do Express, primeiro
`migration:adopt:legacy`). **Rode `npm run migration:run`** para criar as colunas `origem` e `valor_frete`.

Sem MySQL, para testar site + app:

```bash
npm run start:memory
```

Sobe a API real com banco em memória e dados de exemplo:
`admin@sukidoces.com / senha123`, `cliente@sukidoces.com / senha123`, cupom `SUKI10`.

### 2. Site
```bash
# PowerShell: $env:API_URL="http://localhost:3000/suki-doces"; npm start
API_URL=http://localhost:3000/suki-doces npm start
```
`API_URL` definido no terminal agora tem prioridade sobre `src/.env`. Atenção: `npm start` reescreve
`src/environments/environment.ts`.

### 3. App
```bash
# PowerShell: $env:EXPO_PUBLIC_API_URL="http://localhost:3000/suki-doces"; npx expo start
EXPO_PUBLIC_API_URL=http://localhost:3000/suki-doces npx expo start
```
Celular físico: use o IP do computador (ex.: `http://192.168.0.10:3000/suki-doces`). Emulador Android sem
variável usa `10.0.2.2` automaticamente.

## Testes

| Projeto | Comando | Cobre |
|---|---|---|
| API | `npm run test:e2e` | 122 testes (inclui as faixas de frete, endereço salvo/enviado e checkout sem endereço); `test/sync-web-mobile.e2e.test.ts` simula app e site comprando, admin vendo e alterando, carrinho/contato/endereço compartilhados |
| Site | `npx ng test --include src/app/core/interceptors/interceptors.spec.ts --watch=false` | Envelope da API, renovação de token, Idempotency-Key, cupom, status |
| App | `npx tsc --noEmit` | Tipagem (o app não tem test runner configurado) |
