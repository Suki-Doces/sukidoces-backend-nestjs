# Passo a passo para testar o projeto inteiro

Este roteiro executa as verificações automatizadas do projeto e, depois,
orienta a validação da API em execução. Os comandos são para PowerShell na
pasta raiz do repositório.

## 1. Prepare o ambiente

Confirme que está na pasta certa e que o `.env` não será enviado ao Git:

```powershell
Get-Location
git check-ignore .env
```

O segundo comando deve listar `.env`. **Não copie nem compartilhe os valores do
arquivo `.env`.** Se ainda não instalou as dependências, instale exatamente as
versões do lockfile:

```powershell
npm ci
```

É necessário ter uma versão compatível do Node.js instalada. O CI do projeto
usa Node.js 20.

## 2. Rode a verificação de tipos

```powershell
npm run lint
```

Apesar do nome, esse script executa `tsc --noEmit`: verifica os tipos
TypeScript sem gerar arquivos. Corrija os erros antes de seguir.

## 3. Rode todos os testes unitários

```powershell
npm test -- --runInBand
```

O Jest procura todos os arquivos `*.spec.ts` dentro de `src`. Atualmente há 29
arquivos de teste unitário cobrindo casos de uso, serviços, domínio, DTOs e
utilitários. `--runInBand` executa em sequência e costuma ser mais estável no
Windows.

## 4. Rode os testes E2E

```powershell
npm run test:e2e -- --runInBand
```

O E2E inicializa a aplicação e usa SQLite em memória, sem conectar ao MySQL
configurado no `.env`. Ele valida o fluxo HTTP e a estrutura relacional do
banco de teste. SQLite não é idêntico ao MySQL; por isso, ainda é necessário
validar a conexão real antes de publicar.

## 5. Gere o relatório de cobertura (opcional)

```powershell
npm run test:cov -- --runInBand
```

O Jest mostra a cobertura no terminal e salva relatórios na pasta `coverage/`.
Cobertura mede código executado pelos testes; não garante, por si só, que todos
os cenários ou integrações externas estejam corretos.

## 6. Compile o projeto

```powershell
npm run build
```

O comando deve terminar sem erros e gerar a saída de compilação em `dist/`.

## 7. Confira o `.env` e inicie a API

A aplicação valida as configurações ao iniciar, usando
[`src/config/env.validation.ts`](./src/config/env.validation.ts). São
obrigatórias `DATABASE_URL`, `JWT_SECRET` (mínimo de 16 caracteres),
`JWT_REFRESH_SECRET` (mínimo de 16 caracteres), `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY` e `CLOUDINARY_API_SECRET`.

Confira se o MySQL indicado por `DATABASE_URL` está disponível. Então inicie:

```powershell
npm run start:dev
```

Se uma variável obrigatória estiver ausente ou inválida, a inicialização deve
falhar e apontar o problema. Não publique logs sem remover informações
confidenciais.

Em outro terminal, verifique a aplicação e o banco:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

O resultado deve indicar sucesso para o health check e o banco. Se `PORT` for
outro, substitua `3000`. Os endpoints estão documentados em
`http://localhost:3000/docs`.

## 8. Faça uma verificação final das integrações

Os testes automatizados não validam credenciais reais dos provedores. Pela
documentação Swagger ou pelos fluxos do sistema, faça operações com dados de
teste:

1. **MySQL:** consulte dados persistidos além do health check.
2. **Cloudinary:** teste um upload e confirme o arquivo na conta de teste.
3. **Gemini:** se `GEMINI_API_KEY` estiver configurada, teste o recurso de chat.
4. **SMTP:** envie para uma caixa de e-mail controlada; sem SMTP, os e-mails
   devem ser registrados no console.
5. **Sentry:** se `SENTRY_DSN` estiver configurada, valide o recebimento de
   evento seguindo o procedimento do ambiente Sentry, nunca provocando erros
   em produção.
6. **CORS:** se `ALLOWED_ORIGINS` estiver definida, teste uma origem permitida
   e confirme que uma origem não permitida é bloqueada.

`SESSION_SECRET` e `CLIENT_URL` presentes no `.env` atual não aparecem na
validação nem no código da aplicação. Para links de e-mail, o código usa
`FRONTEND_URL`. Confirme se esses campos não são configurações antigas ou
pertencem a outro serviço.

Não execute migrações, seeds ou operações de escrita contra produção durante
os testes.

## Critério de conclusão

Considere a verificação local completa quando `npm run lint`, `npm test`,
`npm run test:e2e` e `npm run build` terminarem sem falhas, e `/health` indicar
que a API e o banco estão saudáveis. As integrações externas precisam ser
testadas separadamente se forem usadas.
