# Relatório de Segurança — Dobro

> Gerado a partir do código real de `apps/dobro` (preset `full`).
> Este arquivo é a trilha de auditoria das defesas com que `apps/dobro` opera hoje.
> Fonte de verdade dos controles: `docs/security/seguranca-na-criacao-de-os.md`.
> Nada aqui é inventado — cada camada aponta para um arquivo real deste OS.

| Campo | Valor |
|---|---|
| Cliente | Dobro |
| Produto | Dobro OS |
| Slug | `dobro` |
| Pasta | `apps/dobro` |
| Preset | `full` |
| Data de emissão | 2026-07-17 |

## Resumo executivo

`apps/dobro` roda com a postura de segurança completa da fábrica: banco isolado por
cliente (projeto Neon dedicado), a API nunca conecta como owner (usa os roles de menor
privilégio `app_auth` e `app_query`), `SELECT` de `PUBLIC` revogado com grants granulares,
e a leitura de dados de negócio só acontece via `/api/query` — protegido por três defesas
(auth-first, allowlist fechada de 1 view read-only, SQL parametrizado). As credenciais dos
roles são provisionadas com senha forte e o boot é **fail-closed em produção** se elas
faltarem. O isolamento é provado por código (`db:verify-grants`).

> **Nota de honestidade:** diferente do neurovida, `apps/dobro` **não** monta as capacidades
> de fábrica (`@os/server` `mountApi`) — o `api/app.ts` tem só health, Better Auth e
> `/api/query`. Portanto **não há** `app_settings`/BYOK nem, consequentemente, cifragem
> AES-256-GCM de segredos do cliente neste OS. Esta camada está listada como "não aplicável"
> abaixo, para não declarar uma defesa que este app não possui.

## Camadas de segurança aplicadas

| Camada | O que protege | Arquivo neste OS |
|---|---|---|
| Isolamento multitenant (um Neon por cliente) | Impede que a query de um cliente alcance o banco de outro (isolamento físico, sem `tenant_id`) | `apps/dobro/db/client.ts`, `apps/dobro/api/env.ts` |
| Roles de menor privilégio (`app_auth`, `app_query`) | A API nunca conecta como owner; três clients Drizzle por papel (owner/auth/query) | `apps/dobro/db/grants.sql`, `apps/dobro/db/client.ts` |
| `REVOKE SELECT ... FROM PUBLIC` + grants granulares | Anula o `SELECT` que o Neon dá a `PUBLIC`; só os grants explícitos valem | `apps/dobro/db/grants.sql` |
| Views read-only (contrato de exposição) | A API lê a view `v_visao_geral`, nunca a tabela crua `metricas_visao_geral` | `apps/dobro/db/views.sql` |
| Provisioning de senha forte + rotação idempotente | Senha `randomBytes(24)` por role; segredo nunca impresso; re-rodar rotaciona; grava no `.env` da raiz | `apps/dobro/db/provision-roles.ts` |
| Prova de isolamento por role (`verify-grants`) | Teste executável que assume cada role e falha (exit 1) se um grant vazar | `apps/dobro/db/verify-grants.ts` |
| Allowlist fechada de views | View fora da lista → 403; coluna fora da view → 400; tabela crua → 403 | `apps/dobro/api/query-allowlist.ts` |
| SQL parametrizado + validação de op/dir/limit | Valores sempre como bind param; `op`/`dir` em conjunto fechado; `limit` com teto de 1000 | `apps/dobro/api/query-builder.ts` |
| Auth-first + `/api/query` executando como `app_query` | Sessão válida ou 401 antes de tocar no banco; runtime como role de menor privilégio (`dbQuery`) | `apps/dobro/api/app.ts` |
| Better Auth (Drizzle adapter, `dbAuth`) | Login e sessões no banco do próprio cliente, via role `app_auth` | `apps/dobro/api/auth.ts` |
| Env server-side + fail-closed em produção | Segredos só server-side (sem `VITE_`); sem `AUTH_/QUERY_DATABASE_URL` em produção, o boot aborta | `apps/dobro/api/env.ts` |
| Cifragem AES-256-GCM de `app_settings` (BYOK) | **NÃO APLICÁVEL** — `apps/dobro` não monta `@os/server` (`mountApi`), não tem `app_settings` nem `getSettingsEncKey` | — (ausente neste OS) |

## Detalhe por área

### Isolamento multitenant
`apps/dobro` usa seu próprio projeto Neon. A connection string vive só server-side
(`apps/dobro/api/env.ts` — precedência `apps/dobro/.env` → `.env` da raiz → `process.env`;
a chave canônica aqui é `NEON_DATABASE_URL` no `.env` da raiz) e **nunca é logada**. Sem
tabela compartilhada nem `tenant_id`.

### Banco — roles, REVOKE de PUBLIC, grants
`apps/dobro/db/grants.sql` cria `app_auth` e `app_query` como `NOLOGIN`, zera privilégios
amplos (`REVOKE ALL ... FROM <role>`), revoga o `SELECT` de `PUBLIC` da tabela base
`metricas_visao_geral`, das tabelas de auth e da view `v_visao_geral`, e concede de forma
granular: `app_auth` faz CRUD só nas quatro tabelas do Better Auth
(`user`/`session`/`account`/`verification`); `app_query` faz `SELECT` só em `v_visao_geral`.
O owner (`neondb_owner`) recebe `GRANT app_auth/app_query` apenas para testar via `SET ROLE`.

### Credenciais — provisioning, rotação e fail-closed
`apps/dobro/db/provision-roles.ts` provisiona **os dois roles** (`app_auth`, `app_query`):
gera senha forte (`randomBytes(24)`, só-hex), aplica `ALTER ROLE ... LOGIN PASSWORD`, faz um
smoke test real por role (`SELECT count(*) FROM "user"` e `... FROM v_visao_geral`) e grava
`AUTH_DATABASE_URL`/`QUERY_DATABASE_URL` no **`.env` da raiz** — sem imprimir o segredo.
Re-rodar rotaciona (idempotente). Em produção, `apps/dobro/api/env.ts` é **fail-closed** nos
dois getters (`getAuthDatabaseUrl`, `getQueryDatabaseUrl`): sem a var do role, o boot aborta
em vez de cair no owner (em DEV, cai no owner com WARN único). `apps/dobro/db/verify-grants.ts`
prova o isolamento por caminho (app_query lê a view mas nega tabela crua e `user`; app_auth
lê `user` mas nega a view) e falha (exit 1) se algum grant divergir.

### API — allowlist, query-builder, auth-first
`/api/query` (`apps/dobro/api/app.ts`) tem três defesas: (1) auth-first — sessão válida ou
401 antes de qualquer parse ou acesso ao banco; `clientId` deriva da **sessão**, nunca do
body; (2) allowlist fechada de views (`apps/dobro/api/query-allowlist.ts`, única view:
`v_visao_geral` com conjunto fechado de 9 colunas) — view fora → 403, coluna fora → 400,
leitura de tabela crua → 403; (3) SQL sempre parametrizado
(`apps/dobro/api/query-builder.ts`) — valores como bind param via o template `sql` do
Drizzle, identificadores via `sql.identifier(...)`, `op` em conjunto fechado, `dir` só
`asc|desc`, `limit` com teto de 1000. No runtime, o endpoint executa como `app_query`
(`dbQuery`).

## Responsabilidade do operador (não automatizado)

1. **Criar o projeto Neon** dedicado do dobro (não é criado pelo scaffolder).
2. Preencher o `.env` (raiz) com `NEON_DATABASE_URL`/`DATABASE_URL` e `BETTER_AUTH_SECRET` — nunca com prefixo `VITE_`.
3. `pnpm -C apps/dobro db:migrate` (migrations + views + grants).
4. `pnpm -C apps/dobro db:provision-roles` (LOGIN dos roles + grava `AUTH_/QUERY_DATABASE_URL`).
5. **Garantir `NODE_ENV=production` no ambiente de deploy** — o gate fail-closed depende dessa var.
6. (Recomendado) `pnpm -C apps/dobro db:verify-grants` no checklist de deploy.
7. Configurar backup do banco — ver `docs/operations/backup-neon.md`.

---

Documento completo dos controles e das lacunas: `docs/security/seguranca-na-criacao-de-os.md`.
Postura de backup: `docs/operations/backup-neon.md`.
