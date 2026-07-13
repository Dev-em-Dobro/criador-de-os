# 05 — Dados, Auth e Multi-Tenant (NeonDB + Backend por App + Better Auth)

> **Revisado (2026-07-12): troca de premissa Firebase → NeonDB.** O banco deixa de ser Firebase/Firestore e passa a ser **NeonDB (Postgres serverless)**. O acesso deixa de ser SDK no browser e passa a ser **backend/API por app** (funções serverless). A connection string da Neon é **segredo de verdade, apenas no servidor**. Autenticação passa a ser **obrigatória via Better Auth (self-hosted)**. Não há realtime nativo.

## 0. O que mudou (e o que sobreviveu intacto)

| Antes (Firebase) | Agora (Neon) |
|---|---|
| Firestore por cliente, SDK no browser | **NeonDB (Postgres) por cliente**, acessado por **API do próprio app** |
| `apiKey` no bundle (não-segredo) + security rules | **`DATABASE_URL` só no servidor** (segredo real) + auth na API |
| Firebase Auth por projeto | **Better Auth (self-hosted)**, usuários no Neon do cliente |
| `onSnapshot` (realtime nativo) | **Sem realtime** → polling/refresh manual |
| `dataSource.kind: 'firestore'` no manifesto | `dataSource.kind: 'query'` resolvido por **endpoint de query genérico** no backend |
| Deploy: SPA estático (Firebase Hosting) | Deploy: **front + funções serverless** (Vercel/Cloudflare/Netlify) |

**Sobrevive intacto** (não muda com esta troca): o monorepo (`core`/`blocks`/`apps`), a dependência `apps → blocks → core`, o **manifesto config-driven**, o **catálogo de blocos**, o **BlockRegistry** (inversão de controle) e o **tema por cliente**. Os blocos continuam "burros": recebem `ctx.data` + `config` e **não sabem de onde o dado veio**. A troca Firestore→Neon fica confinada a uma camada isolada: **DataProvider (cliente de API) + resolvedor de dataSource no backend + Auth**.

---

## 1. Modelo de isolamento: um projeto Neon por cliente

**Decisão (premissa do dono — RESOLVIDA):** cada cliente tem seu **próprio projeto Neon**, com connection string própria. Espelha o isolamento já decidido no modelo anterior.

```text
Projeto Neon "dobro-os"         → apps/dobro           (dados do Dev em Dobro)
Projeto Neon "cliente-exemplo"  → apps/cliente-exemplo
Projeto Neon "cliente-y"        → apps/cliente-y
```

**Trade-offs (honestos):**
- ✅ **Isolamento máximo e físico.** Bancos Postgres separados; impossível vazar dados entre clientes. Sem coluna `tenant_id` em toda tabela, sem risco de query sem filtro cruzar clientes.
- ✅ **Barato no início.** Neon tem free tier generoso por projeto e **scale-to-zero** (o compute suspende quando ocioso) — poucos clientes premium cabem folgado.
- ✅ **Faturamento/quota por cliente** naturais.
- ✅ **A força do Postgres vira nossa:** JOINs, agregações, views, índices — exatamente o que faltava no modelo de documentos do Firestore para KPIs.
- ⚠️ **Custo operacional cresce com N.** Criar projeto Neon, rodar migrations, provisionar usuário admin, configurar `DATABASE_URL`, deploy da API — por cliente. É o preço do isolamento. Mitigação: o **scaffolder** (doc 06) automatiza; a partir de ~dezenas de clientes, reavaliar tenancy (ver `08-riscos-decisoes.md`, D-2).

---

## 2. Arquitetura de acesso: backend/API por app (o padrão novo)

No modelo anterior, o browser falava direto com o Firestore. **Agora, o browser (SPA) fala com uma API do próprio app; essa API fala com a Neon.** A connection string **nunca** vai para o bundle.

```text
┌──────────────────────────────────────────────────────────────┐
│  Browser (SPA React do cliente)                              │
│   - blocos renderizam ctx.data (não sabem de onde veio)      │
│   - useOsClient() = CLIENTE DE API (fetch), não um "db"      │
└───────────────┬──────────────────────────────────────────────┘
                │ HTTPS (cookie de sessão Better Auth, HttpOnly)
                ▼
┌──────────────────────────────────────────────────────────────┐
│  apps/<cliente>/api/  (funções serverless — Hono)            │
│   POST /api/auth/*     → Better Auth (login, sessão, logout) │
│   POST /api/query      → endpoint de query genérico (§4)     │
│   GET/POST /api/...     → rotas custom do app (se preciso)    │
│                                                              │
│   1. valida sessão Better Auth  → sem sessão? 401            │
│   2. resolve dataSource declarativo → SQL parametrizado      │
│   3. usa DATABASE_URL (server-side) para consultar a Neon    │
└───────────────┬──────────────────────────────────────────────┘
                │ @neondatabase/serverless (HTTP one-shot)
                ▼
┌──────────────────────────────────────────────────────────────┐
│  NeonDB do cliente (Postgres serverless)                     │
│   - tabelas de negócio + views read-only por menu            │
│   - tabelas do Better Auth (user, session, account...)       │
└──────────────────────────────────────────────────────────────┘
```

**Consequência para o front:** o `useOsClient()` deixa de ser um `db` Firestore e passa a ser um **cliente de API** (um wrapper de `fetch` para `/api/query`, `/api/auth/*` etc.). Ver doc 03, §4. Os blocos **não mudam** — continuam recebendo `ctx.data`.

---

## 3. Stack do backend — recomendação e justificativa

Cada `apps/<cliente>` ganha uma pasta `api/` com funções serverless. Recomendação de stack coerente:

| Camada | Escolha | Por quê (trade-off) |
|---|---|---|
| **Roteador de API** | **Hono** | Leve (~kB), roda em Vercel Functions, Cloudflare Workers e Node sem reescrever — casa com a hospedagem por cliente ainda em aberto (§7). Integração de primeira classe com Better Auth (`auth.handler` monta as rotas). Alternativa: Express (mais pesado, menos edge-friendly) ou rotas nativas do Vercel (menos portável entre provedores). |
| **Autenticação** | **Better Auth** (self-hosted) | Roda inteiramente na nossa infra, sem serviço externo nem custo por assento — casa com "um Neon por cliente". Armazena usuários e sessão **no Neon do próprio cliente** (isolamento). Integra com Hono e com o Drizzle adapter. |
| **Driver Neon** | **`@neondatabase/serverless`** (modo **HTTP**) | Para o endpoint de query (one-shot, stateless), o modo HTTP faz ~3 round-trips vs ~8 do TCP — ideal para serverless/edge. WebSocket/Pool só quando precisarmos de transações interativas (raro no read-path). **Cuidado documentado:** em serverless, conexões não sobrevivem além de uma requisição — abrir/usar/fechar dentro do handler. |
| **Query builder** | **Drizzle** (recomendado) vs Kysely (alternativa forte) | Ver comparação abaixo. |

### Drizzle vs Kysely — a decisão do query builder

Ambos geram **SQL parametrizado** (bind params, nunca concatenação) — o que é o ponto de segurança inegociável. A escolha é de ergonomia/ecossistema:

| Critério | **Drizzle** (recomendado) | Kysely |
|---|---|---|
| SQL parametrizado | ✅ sempre (prepared/bind) | ✅ sempre (prepared/bind) |
| Schema como código | ✅ define tabelas em TS; gera migrations (`drizzle-kit`) | ⚠️ tipos vêm de codegen do schema existente |
| Adapter Better Auth | ✅ **oficial** (`drizzleAdapter`, provider `"pg"`) | ⚠️ não oficial |
| Migrations | ✅ `drizzle-kit generate/migrate` (crítico para "rodar migrations iniciais" no onboarding) | precisa de ferramenta à parte |
| Integração driver Neon | ✅ `drizzle(neon(...))` documentado | ✅ dialeto Postgres compatível |
| Query builder puro | bom | ✅ excelente (mais próximo de SQL, tipos afiados) |

**Recomendação: Drizzle.** O fator decisivo é o **adapter oficial do Better Auth** + as **migrations integradas** (que o scaffolder precisa para o onboarding do cliente — doc 06). Kysely é tecnicamente ótimo como query builder, mas exigiria colar auth e migrations por fora, aumentando a superfície de manutenção por app. Como o endpoint de query genérico monta SQL a partir de um schema declarativo, o schema-as-code do Drizzle também nos dá a **allowlist de tabelas/colunas de graça** (ver §4).

> **Nota de honestidade:** para o *endpoint de query genérico*, tanto Drizzle quanto Kysely servem — o que realmente protege é a **allowlist + bind params** (§4), não a marca do builder. A recomendação de Drizzle é pelo conjunto (auth + migrations + schema-as-code), não por superioridade no read-path.

---

## 4. O endpoint de query genérico seguro (O CRUX)

**O problema:** manter a promessa "o operador edita o manifesto sem dev" com um backend por app, **sem abrir brecha de segurança**. O `dataSource` do manifesto (tabela/view, colunas, filtros, orderBy, agregações) precisa ser resolvido por um endpoint genérico de forma **segura**. Um `POST /api/query` que aceitasse "qualquer SQL" ou "qualquer tabela/coluna" seria um buraco de segurança clássico (SQL injection + acesso arbitrário a dados).

### 4.1 As três defesas (todas obrigatórias, em camadas)

**Defesa 1 — Autenticação primeiro (fail-closed).**
Toda requisição a `/api/query` valida a sessão Better Auth **antes** de qualquer coisa. Sem sessão válida → **401**, sem tocar no banco. Nenhuma query roda anônima.

**Defesa 2 — Allowlist por VIEWS read-only por menu (a escolha recomendada).**
O manifesto **nunca** referencia uma tabela crua arbitrária. Ele referencia uma **view SQL read-only**, criada explicitamente no Neon do cliente, que define **exatamente** o que é exposto (quais colunas, já filtradas/joinadas/agregadas). Exemplo: o menu "Vendas" referencia a view `v_vendas_kpi`, não a tabela `pedidos`.

Comparação das duas abordagens de allowlist consideradas:

| Abordagem | Como funciona | Veredito |
|---|---|---|
| **(A) Allowlist de tabelas+colunas** | O app declara um mapa `{ tabela: [colunas consultáveis] }`; o endpoint só aceita nomes presentes no mapa. | Bom, mas a superfície é maior: cada coluna nova exige atualizar o mapa; agregações/JOINs ficam difíceis de expressar com segurança. |
| **(B) Views read-only por menu** ✅ | O DBA/dev cria uma view por menu (`v_<menu>`); o manifesto só referencia views; a view **é** o contrato de exposição (colunas, filtros embutidos, agregações). O endpoint valida contra a **lista de views permitidas**. | **Recomendada.** Mais segura e mais pragmática: a view encapsula JOIN/agregação (a força do Postgres), esconde colunas sensíveis por construção, e o `GRANT SELECT` na view (não nas tabelas base) reforça no nível do banco. Uma view é literalmente "o que o operador pode ver". |

**Recomendação: (B) views read-only por menu, com (A) allowlist de views como reforço.** O endpoint mantém uma lista fechada de views consultáveis (derivada do schema Drizzle / de um registro no app). Referenciar qualquer objeto fora dessa lista → **403**. As colunas em `select`/`where`/`orderBy` são validadas contra as **colunas conhecidas da view** (não contra input livre).

> **Por que views vencem allowlist de tabelas aqui:** a força do Postgres — que era a fraqueza do Firestore — são **agregações e JOINs para KPI**. Uma view `v_vendas_kpi AS SELECT date_trunc('month', criado_em) AS periodo, SUM(valor) AS faturamento, COUNT(*) AS novos_clientes FROM pedidos GROUP BY 1` entrega o KPI pronto, expõe **só** o que o dashboard precisa, e o manifesto só diz "leia `v_vendas_kpi`". O operador nunca toca em SQL; o dev cria a view uma vez.

**Defesa 3 — SQL sempre parametrizado (bind), nunca concatenado.**
Todo valor de filtro (`where[].value`, incluindo `ref: 'period'`) entra como **bind parameter** (`$1`, `$2`...), jamais interpolado na string SQL. Isso é o que o query builder (Drizzle/Kysely) garante por construção. **Identificadores** (nome de view/coluna/direção de orderBy) **não podem** ser parametrizados por bind — por isso eles passam pela **allowlist** (Defesa 2): só nomes conhecidos entram, comparados contra o schema, nunca refletidos do input cru.

### 4.2 Contrato do endpoint (conceitual)

```text
POST /api/query
Headers: Cookie: <sessão Better Auth HttpOnly>
Body (= dataSource declarativo do manifesto):
{
  "view": "v_vendas_kpi",                    // DEVE estar na allowlist de views
  "select": ["periodo", "faturamento"],       // DEVEM ser colunas conhecidas da view
  "where":  [{ "field": "periodo", "op": "=", "value": { "ref": "period" } }],
  "orderBy":[{ "field": "periodo", "dir": "desc" }],
  "limit":  12
}

Fluxo no handler:
  1. auth: valida sessão Better Auth   → sem sessão? 401 (fail-closed)
  2. allowlist: "view" ∈ views permitidas?           → não? 403
  3. allowlist: cada coluna ∈ colunas conhecidas da view? → não? 400
  4. resolve refs: { ref: 'period' } → valor do período atual (vindo do body, validado)
  5. builder monta SQL PARAMETRIZADO:
       SELECT "periodo","faturamento" FROM "v_vendas_kpi"
       WHERE "periodo" = $1 ORDER BY "periodo" DESC LIMIT $2
       binds: [periodoAtual, 12]
  6. driver Neon (HTTP) executa → rows
  7. retorna { data: rows }   (o bloco recebe isso como ctx.data)
```

**Pontos de segurança verificáveis:**
- `view` e colunas: **validados contra allowlist/schema** — nunca refletidos do input.
- `op` (operador): validado contra um **conjunto fechado** (`=`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `like`) — nunca concatenado.
- `dir`: apenas `asc`|`desc`.
- `value`: sempre **bind param**.
- `limit`: coerção numérica + teto (ex.: máx. 1000) para evitar exfiltração em massa.
- Sem sessão → 401 **antes** de qualquer parse de body pesado.

### 4.3 Agregações de KPI (a força do Postgres)

As agregações que no Firestore exigiam gambiarra (ler tudo no client e somar) agora vivem **no banco**, dentro das views:

```sql
-- apps/<cliente>/db/views/v_vendas_kpi.sql  (criada no onboarding, versionada)
CREATE OR REPLACE VIEW v_vendas_kpi AS
SELECT
  date_trunc('month', criado_em)::date          AS periodo,
  SUM(valor)                                     AS faturamento,
  COUNT(*) FILTER (WHERE novo_cliente)           AS novos_clientes,
  AVG(valor)                                     AS ticket_medio
FROM pedidos
GROUP BY 1;

GRANT SELECT ON v_vendas_kpi TO app_query;   -- role SELECT-only do /api/query
```

O manifesto referencia `v_vendas_kpi`; o KPI chega pronto e barato. Views mais pesadas podem virar **materialized views** com refresh agendado se a latência exigir (evolução, não requisito inicial).

> **Implementação concreta (Fase 3 — hardening de least privilege).** A API **não** conecta como owner. São **dois roles**, um por caminho, cada um com sua connection string server-side:
> - **`app_auth`** (`AUTH_DATABASE_URL`) — usado pelo Better Auth (`/api/auth/*`): `SELECT/INSERT/UPDATE/DELETE` **só** nas tabelas de auth (`user`, `session`, `account`, `verification`). Sem acesso a views nem a dados de negócio.
> - **`app_query`** (`QUERY_DATABASE_URL`) — usado pelo `/api/query`: `SELECT` **só** nas views `v_*`. A view roda com o privilégio do owner dela, então `app_query` lê o KPI **sem** ter acesso à tabela crua.
>
> Os privilégios são versionados e idempotentes em `apps/<cliente>/db/grants.sql` (aplicado por `db/migrate.ts`); o login/senha de cada role e as connection strings são provisionados fora do git (Console Neon / `.env`). `db/verify-grants.ts` prova o isolamento por caminho (`pnpm db:verify-grants`). Fallback de DEV: sem as vars dos roles, a API usa o owner e **avisa** que a defesa não está ativa.

---

## 5. Autenticação com Better Auth (obrigatória)

**Decisão (premissa do dono — RESOLVIDA):** autenticação **obrigatória** via Better Auth (self-hosted). Não é mais opcional. Toda requisição de dados exige usuário autenticado.

**Onde ficam os usuários:** no **Neon do próprio cliente** (tabelas `user`, `session`, `account`, `verification` criadas pelo Better Auth via Drizzle adapter). Isolamento total: usuários de um cliente vivem só no banco daquele cliente.

**Fluxo de login:**
```
1. Cliente acessa a URL do app → SPA detecta "sem sessão" → tela de login.
2. POST /api/auth/sign-in/email (Better Auth) → valida credenciais contra tabela `user` do Neon do cliente.
3. Better Auth cria sessão (linha em `session`) e devolve um cookie HttpOnly, Secure, SameSite.
4. SPA recarrega → agora com sessão → app renderiza.
5. Toda chamada a /api/query envia o cookie; a API valida a sessão ANTES de consultar. Sem sessão → 401.
```

**Validação de sessão na API:** cada rota protegida chama `auth.api.getSession({ headers })` (Better Auth) como primeiro passo. Retorno nulo → 401. Isso substitui o papel que as *security rules* do Firestore tinham — só que agora a autorização acontece **no nosso backend**, onde temos controle total (e onde a connection string vive em segurança).

**Provisionamento inicial:** o operador cria o **usuário admin** do cliente durante o onboarding (script `create-admin` do scaffolder, ou seed) — ver doc 06. Usuários adicionais podem ser criados por um fluxo de admin no próprio app ou por script.

**Autorização fina (papéis):** Better Auth suporta plugins de organização/roles. Baseline: qualquer sessão válida lê as views permitidas. Refinamento por papel (ex.: só admin escreve) é evolução — a view + o handler são o ponto natural para checar `session.user.role`.

---

## 6. Onde fica a config sensível (a grande diferença de segurança)

| Segredo | Onde fica | Vai para o bundle? |
|---|---|---|
| **`DATABASE_URL`** / `NEON_DATABASE_URL` (Neon **owner**) | `.env` server-side — usada **só por scripts admin** (migrate/seed/grants), nunca pelo runtime da API | **NUNCA** |
| **`AUTH_DATABASE_URL`** (role `app_auth` — R/W só nas tabelas de auth) | `apps/<cliente>/.env`, server-side; usada pelo handler `/api/auth/*` | **NUNCA** |
| **`QUERY_DATABASE_URL`** (role `app_query` — SELECT só nas views) | `apps/<cliente>/.env`, server-side; usada pelo endpoint `/api/query` | **NUNCA** |
| **`BETTER_AUTH_SECRET`** (assina sessões) | `apps/<cliente>/.env`, server-side | **NUNCA** |
| **`BETTER_AUTH_URL`** / base URL da API | `.env` (server) + config pública da SPA (base URL da API é pública, ok) | base URL sim; segredos não |
| Tokens de APIs próprias (Scudo/Curseduca) | `.env` server-side, atrás das rotas `api/` | **NUNCA** |

**A mudança conceitual mais importante vs. Firebase:** antes, a `apiKey` do Firebase ia para o bundle e **não era segredo** (a segurança vinha de auth + rules). Agora, a **`DATABASE_URL` É segredo de verdade** — quem a tem tem acesso total e irrestrito ao Postgres do cliente. Por isso ela vive **exclusivamente no servidor**, nunca é exposta a `import.meta.env` do Vite (que vaza no bundle), e o `.env` nunca é commitado (`.env.example` versionado com placeholders). Isso **eleva** a criticidade de R-5 (doc 08).

> **Regra de ouro:** nenhuma variável com segredo pode ter prefixo `VITE_` (o Vite injeta `VITE_*` no bundle client). Segredos ficam sem prefixo, lidos só pelas funções serverless.

---

## 7. Hospedagem — reavaliação (front + funções serverless por cliente)

Antes a recomendação era Firebase Hosting (SPA estático). Agora cada app = **front (SPA) + funções serverless** (a pasta `api/`). A Neon é o projeto de **dados** por cliente, **separado** do hosting.

| Opção | Prós | Contras | Veredito |
|---|---|---|---|
| **Vercel** ✅ | Front + Serverless Functions no mesmo deploy; suporte first-class a Hono; integração oficial com Neon (inclusive provisioning); `vercel env` por projeto; domínio/preview fáceis. | Cold starts em functions; pricing por projeto cresce com N. | **Recomendado** para a v1 — menor atrito front+API+Neon, casa com "um deploy por cliente". |
| **Cloudflare Pages + Workers** | Edge global, Workers baratos e rápidos; Hono nasceu no ecossistema CF; ótimo para o driver Neon HTTP. | Modelo de env/secrets e limites de Workers exigem mais setup; DX de fullstack um pouco mais manual. | Forte alternativa; ótima se latência/custo em escala virarem prioridade. |
| **Netlify** | Front + Functions; simples. | Ecossistema serverless menos afinado com Hono/edge que os dois acima. | Aceitável, mas sem vantagem clara sobre Vercel aqui. |

**Recomendação: Vercel por cliente na v1** (um projeto Vercel por app), com **Cloudflare** como plano B se custo/latência em escala pedirem. Decisão do dono registrada em D-4 (doc 08). O ponto de deploy continua sendo `apps/<cliente>`, agora com front **e** funções.

---

## 8. Ausência de realtime (capacidade que muda)

**O que se perde:** o Firestore tinha `onSnapshot` — a tela atualizava sozinha quando o dado mudava no banco. **Postgres não tem isso nativamente** no caminho HTTP serverless.

**Como fica:**
- **Padrão: polling / refresh manual.** O bloco recarrega ao trocar de período, ao clicar em "atualizar", ou por `setInterval` opcional (ex.: a cada 30–60s em telas de KPI). O `useOsClient()` expõe `reload()`; `ctx.actions.reload` já existe no contrato de bloco (doc 03).
- **Configurável no manifesto:** `dataSource.refetch` (ex.: `{ mode: 'manual' | 'interval', ms?: number }`). Default `manual`.
- **Se um cliente exigir realtime de verdade** (raro para dashboards de gestão): opções futuras são `LISTEN/NOTIFY` do Postgres via WebSocket próprio, ou um serviço de pub/sub — tratado como evolução sob demanda, não requisito inicial.

**Honestidade:** para dashboards de gestão (o caso de uso real), polling/refresh é perfeitamente adequado — os dados de KPI não mudam a cada segundo. A perda de realtime é aceitável e explícita. Documentado como risco novo em doc 08.

---

## 9. Checklist de "pronto" para a camada de dados/auth (atualizado)

- [ ] Cada `apps/<cliente>` tem pasta `api/` (Hono) com funções serverless.
- [ ] `DATABASE_URL` **só server-side** (sem prefixo `VITE_`); `.env.example` versionado; `.env` fora do git.
- [ ] Endpoint `POST /api/query` implementado com as **3 defesas**: auth-first (401), allowlist de views (403), SQL parametrizado (bind).
- [ ] Views read-only por menu criadas no Neon do cliente (`v_<menu>`), com `GRANT SELECT` para o role da API (não nas tabelas base).
- [ ] Better Auth montado em `/api/auth/*` (Hono) com Drizzle adapter (provider `pg`) apontando ao Neon do cliente.
- [ ] Migrations iniciais aplicadas (`drizzle-kit migrate`), incluindo as tabelas do Better Auth.
- [ ] Usuário admin do cliente provisionado.
- [ ] `useOsClient()` no front é um **cliente de API** (fetch), não um `db`; nenhum acesso a banco no browser.
- [ ] Cliente-piloto: login → sessão → só vê o próprio Neon → `/api/query` bloqueia view fora da allowlist e requisição sem sessão (validado end-to-end).
- [ ] Nenhum `VITE_DATABASE_URL` ou segredo com prefixo `VITE_` em lugar algum (grep de CI).
