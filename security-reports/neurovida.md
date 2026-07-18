# Relatório de Segurança — Neurovida

> Gerado a partir do código real de `apps/neurovida` (preset `full`, com particularidades).
> Este arquivo é a trilha de auditoria das defesas com que `apps/neurovida` opera hoje.
> Fonte de verdade dos controles: `docs/security/seguranca-na-criacao-de-os.md`.
> Nada aqui é inventado — cada camada aponta para um arquivo real deste OS.

| Campo | Valor |
|---|---|
| Cliente | Neurovida |
| Produto | Neurovida OS |
| Slug | `neurovida` |
| Pasta | `apps/neurovida` |
| Preset | `full` (variante sem `/api/query`) |
| Data de emissão | 2026-07-17 |

## Resumo executivo

`apps/neurovida` roda com banco isolado por cliente (projeto Neon dedicado), a API nunca
conecta como owner (usa **um** role de menor privilégio, `app_auth`), `SELECT` de `PUBLIC`
revogado com grants granulares, e autenticação obrigatória (fail-closed) antes de qualquer
rota de negócio. Os segredos que o cliente salva em Configurações (`app_settings`, modelo
BYOK) são cifrados em repouso com **AES-256-GCM**. As credenciais do role são provisionadas
com senha forte e o boot é **fail-closed em produção** se a var faltar.

> **Nota de honestidade — divergências reais do template `full`:** este OS **não** expõe o
> endpoint genérico `/api/query`. Não existem, no código: `api/query-allowlist.ts`,
> `api/query-builder.ts`, `db/views.sql`, `db/verify-grants.ts`, nem o role `app_query`
> (`db/client.ts` tem só `db` [owner] e `dbAuth` [`app_auth`]). Por isso as camadas de
> "allowlist de views", "SQL parametrizado do /api/query", "views read-only", "prova de
> isolamento por role" e "role `app_query`" estão marcadas como **não aplicáveis** abaixo —
> não são declaradas como presentes. O acesso a dados de negócio (leads, faturas, métricas
> Hotmart, Estúdio IA de carrossel) é servido por rotas específicas do `@os/server`
> (`mountApi`/`mountAssistant`) e do próprio app, todas **auth-first**.

## Camadas de segurança aplicadas

| Camada | O que protege | Arquivo neste OS |
|---|---|---|
| Isolamento multitenant (um Neon por cliente) | Impede que a query de um cliente alcance o banco de outro; neurovida **não herda** o `.env` da raiz de propósito | `apps/neurovida/db/client.ts`, `apps/neurovida/api/env.ts` |
| Role de menor privilégio (`app_auth`) | O runtime (Better Auth + `/api/settings` + negócio) nunca conecta como owner | `apps/neurovida/db/grants.sql`, `apps/neurovida/db/client.ts` |
| `REVOKE SELECT ... FROM PUBLIC` + grants granulares | Anula o `SELECT` que o Neon dá a `PUBLIC`; só os grants explícitos valem | `apps/neurovida/db/grants.sql` |
| Provisioning de senha forte + rotação idempotente | Senha `randomBytes(24)`; segredo nunca impresso; re-rodar rotaciona; grava no `.env` **do app** | `apps/neurovida/db/provision-roles.ts` |
| Auth-first nas rotas de negócio | Sessão válida ou 401 antes de tocar no banco (leads/faturas via `@os/server`; carrossel do Estúdio IA) | `apps/neurovida/api/app.ts` |
| Better Auth (Drizzle adapter, `dbAuth`) | Login e sessões no banco do próprio cliente, via role `app_auth` | `apps/neurovida/api/auth.ts` |
| Env server-side + fail-closed em produção | Segredos só server-side (sem `VITE_`); sem `AUTH_DATABASE_URL` em produção, o boot aborta | `apps/neurovida/api/env.ts` |
| Cifragem AES-256-GCM de `app_settings` (BYOK) | Segredos do cliente (chave Anthropic, credenciais Hotmart) cifrados em repouso; valor em claro nunca volta ao browser | `apps/neurovida/api/env.ts` (`getSettingsEncKey`) → `packages/server/src/settings.ts` |
| Role `app_query` + `/api/query` (allowlist + query-builder + views) | **NÃO APLICÁVEL** — neurovida não expõe `/api/query`; não há `app_query`, allowlist, query-builder nem `db/views.sql` | — (ausente neste OS) |
| Prova de isolamento por role (`verify-grants`) | **NÃO APLICÁVEL** — não há `db/verify-grants.ts` neste OS | — (ausente neste OS) |

## Detalhe por área

### Isolamento multitenant
`apps/neurovida` usa seu próprio projeto Neon. Diferente do dobro, **carrega só o `.env` do
próprio app** (`apps/neurovida/api/env.ts`) e **não** lê `NEON_DATABASE_URL` da raiz — de
propósito: a raiz aponta para o banco de outro cliente, e herdá-la mandaria as migrations
para o banco errado. Um cliente = um Neon; cada app carrega só os próprios segredos, que
nunca são logados.

### Banco — role, REVOKE de PUBLIC, grants
`apps/neurovida/db/grants.sql` cria **um** role de menor privilégio (`app_auth`) como
`NOLOGIN`, zera privilégios amplos (`REVOKE ALL ... FROM app_auth`), revoga o `SELECT` de
`PUBLIC` das tabelas de auth e de negócio (`app_settings`, `lead_source_rows`, `leads`,
`invoices`, `invoice_items`, `hotmart_metrics`) e concede CRUD granular só nessas tabelas.
Colunas `IDENTITY` recebem `USAGE, SELECT ON ALL SEQUENCES`. O role é concedido a
`CURRENT_USER` (em vez de um nome de owner fixo — funciona em qualquer projeto Neon) para
permitir `SET ROLE` em testes. Não há role `app_query` porque não há endpoint `/api/query`.

### Credenciais — provisioning, rotação e fail-closed
`apps/neurovida/db/provision-roles.ts` provisiona **só o `app_auth`**: gera senha forte
(`randomBytes(24)`, só-hex), aplica `ALTER ROLE app_auth LOGIN PASSWORD`, faz um smoke test
real (`SELECT count(*) FROM "user"`) e grava `AUTH_DATABASE_URL` no **`.env` do próprio app**
(`apps/neurovida/.env`, isolamento por cliente) — sem imprimir o segredo. Re-rodar rotaciona
(idempotente). Em produção, `apps/neurovida/api/env.ts` é **fail-closed** em
`getAuthDatabaseUrl`: sem `AUTH_DATABASE_URL`, o boot aborta em vez de cair no owner (em DEV,
cai no owner com WARN único).

### API — auth-first (sem `/api/query`)
`apps/neurovida/api/app.ts` monta as capacidades de fábrica via `@os/server`
(`mountApi` → `/api/settings`, `/api/leads/*`, `/api/invoices/*`; `mountAssistant` →
copilotos de IA por seção) e o endpoint específico do Estúdio IA (`POST /api/agents/carousel`).
Todas as rotas de negócio são **auth-first**: sem sessão válida do Better Auth → 401 antes de
tocar no banco (ex.: o handler do carrossel valida a sessão logo no início). Não há o endpoint
genérico `/api/query` deste app, portanto não há a camada de allowlist/query-builder — o
acesso a dados passa pelas rotas tipadas do `@os/server`, que rodam com o role `app_auth`.

### Cifragem de segredos do cliente
Os segredos que o cliente salva em Configurações (`app_settings`, modelo BYOK — chave da
Anthropic e credenciais Hotmart `client_id`/`client_secret`) são cifrados em repouso com
**AES-256-GCM** (IV aleatório por gravação via `randomBytes(12)`; tag de autenticação detecta
adulteração), herdado de `@os/server` (`packages/server/src/settings.ts`). Só chaves do
registro fechado `KNOWN_SETTINGS` são aceitas, e o valor em claro **nunca** volta ao browser
(só um hint mascarado `••••<4 últimos>`). A chave de cifra vem de `getSettingsEncKey`
(`apps/neurovida/api/env.ts`), que por padrão deriva do `BETTER_AUTH_SECRET` quando
`SETTINGS_ENC_KEY` não está definida — recomenda-se uma `SETTINGS_ENC_KEY` própria em
produção (ver §7.3 do doc de segurança).

## Responsabilidade do operador (não automatizado)

1. **Criar o projeto Neon** dedicado do neurovida (não é criado pelo scaffolder).
2. Preencher `apps/neurovida/.env` com `DATABASE_URL` e `BETTER_AUTH_SECRET` (e, recomendado, `SETTINGS_ENC_KEY` própria) — nunca com prefixo `VITE_`.
3. `pnpm -C apps/neurovida db:migrate` (migrations + grants; este OS não tem `views.sql`).
4. `pnpm -C apps/neurovida db:provision-roles` (LOGIN do `app_auth` + grava `AUTH_DATABASE_URL` no `.env` do app).
5. **Garantir `NODE_ENV=production` no ambiente de deploy** — o gate fail-closed depende dessa var.
6. Configurar backup do banco — ver `docs/operations/backup-neon.md`.

---

Documento completo dos controles e das lacunas: `docs/security/seguranca-na-criacao-de-os.md`.
Postura de backup: `docs/operations/backup-neon.md`.
