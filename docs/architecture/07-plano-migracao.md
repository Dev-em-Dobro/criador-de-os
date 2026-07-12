# 07 — Plano de Extração/Migração Faseado

> Do Dobro OS para o monorepo, de baixo risco. Cada fase tem objetivo, entregáveis e critério de "pronto". Esforço relativo: **P** (pequeno) · **M** (médio) · **G** (grande).
>
> Filosofia (skill Architect-First): arquitetura e docs antes de código; nunca perder capacidade vs. a versão anterior; generalizar só após ≥2 casos reais. O Dobro OS é o **gold standard** — o piloto migrado precisa manter tudo o que ele já faz.
>
> **Revisado (2026-07-12): Firebase → NeonDB.** A Fase 1 troca "DataProvider por injeção do Firebase" por **backend/API por app (Hono) + endpoint de query genérico + Better Auth + OsClient de API no front**. A Fase 3 (piloto) usa **Neon + Better Auth** (não Firebase/Firestore).

## Sequência (por que esta ordem)

Extraímos de baixo para cima: primeiro o que é barato e sem risco (primitivos), depois o motor, depois provamos end-to-end com um cliente real, e só então automatizamos. Cada fase entrega algo utilizável e reduz o risco da seguinte.

---

## Fase 0 — Setup do monorepo · Esforço: **P**

**Objetivo:** esqueleto do monorepo funcionando, sem lógica ainda.

**Entregáveis:**
- `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json` com paths `@os/core`, `@os/blocks`.
- Packages vazios `packages/core`, `packages/blocks` com `package.json` e barrels.
- App vazio `apps/dobro` que compila e roda um "hello" via `<OsApp>` stub.
- Regras de lint de fronteira (core não importa blocks/apps) — mesmo que só documentadas na v0.

**Pronto quando:** `pnpm install` + `turbo run build` passam; `apps/dobro` sobe no Vite mostrando um shell vazio.

---

## Fase 1 — Extrair core + design system + backend base · Esforço: **M** (com 4 pontos **G**)

**Objetivo:** o chassi e os primitivos vivem no `@os/core`; o front consome dados por um **cliente de API**; existe um **backend por app** (query genérico + auth) provando o caminho ponta-a-ponta.

**Entregáveis:**
- **Design system** (balde A, itens **P**): `KpiCard`, `SectionHeader`, `EmptyState`, `TrendChart`, `Skeleton`, `StatusIndicator`, `ErrorBanner`, `PeriodFilter`, tokens/format — copiados e limpos de referências ao Dobro.
- **Theme** (`ThemeProvider` + base CSS a partir do `@theme` atual) — cor/logo passam a vir do manifesto.
- **Shell** (`AppShell`: topbar/sidebar/footer genéricos, dirigidos por `navigation`).
- **[G] ManifestRouter** — gera rotas a partir do manifesto (substitui `parsePathname`/switch).
- **[G] OsClient (cliente de API) no front** (`useOsClient` = fetch para `/api/*`) + `AuthGate` que consome a sessão Better Auth. **Nenhum SDK/driver de banco no front.**
- **[G] Backend base por app (`api/` com Hono):** `POST /api/query` (endpoint de query genérico com as 3 defesas — auth-first + allowlist de views + SQL parametrizado via Drizzle) + Better Auth em `/api/auth/*` (Drizzle adapter, provider pg) + `@neondatabase/serverless` (HTTP). Schema Drizzle + migrations + ≥1 view read-only.
- **[G] DataAdapter genérico** — resolve `DataSourceBinding` (`query`/`rest`/`static`) chamando o `OsClient` + mappers nomeados + política de `refetch` (sem realtime).

**Pronto quando:** um manifesto mínimo (1 menu, 1 bloco stub, 1 view) renderiza via core com **dado real vindo do `/api/query` do backend**, exigindo sessão Better Auth (sem sessão → 401), consultando um Neon real. O `/api/query` recusa view fora da allowlist (403). Nenhum acesso a banco no browser.

---

## Fase 2 — Blocos genéricos + engine de manifesto · Esforço: **M**

**Objetivo:** catálogo inicial de blocos reutilizáveis, provando que o mesmo bloco serve a configs diferentes.

**Entregáveis (priorizar alta alavancagem primeiro):**
- `kpi-dashboard` (cobre ~7 seções do Dobro) — **primeiro**.
- `kanban-board` (cobre o `BoardSection`) — **segundo**.
- `data-table` (cobre Scudo/leads/ICP como tabela) — **terceiro**.
- `doc-viewer` (markdown, cobre Campanhas/Podcast draft).
- `timeline` e `metric-comparison` se sobrar fôlego; `funnel` **fica de fora** (é **G** e sem 2º caso ainda).
- Registry montável pelo app; validação de config (zod) por bloco.

**Pronto quando:** um manifesto de teste com 3–4 menus renderiza 3–4 blocos genéricos diferentes, cada um lendo uma **view diferente** (via `/api/query`), só mudando config. Nenhum bloco tem texto/tabela/view do Dobro hardcoded.

---

## Fase 3 — Piloto end-to-end: 1 cliente exemplo com auth · Esforço: **M**

**Objetivo:** provar a fábrica inteira com um cliente real (ou o "Cliente Exemplo" do doc 02), do login ao dado.

**Entregáveis:**
- `apps/cliente-exemplo` com manifesto de 3–4 menus, tema próprio, **projeto Neon próprio** + pasta `api/` própria.
- **Better Auth** ligado (usuários no Neon do cliente) + `/api/query` com allowlist de views ativa; views read-only por menu criadas e com `GRANT SELECT` ao role da API.
- Migrations aplicadas; usuário admin provisionado; dados de exemplo populados; login funcionando; cada bloco mostrando dado real via `/api/query`.
- Deploy do app (**front + funções `api/`** no hosting recomendado — Vercel do cliente) — URL acessível; `DATABASE_URL`/`BETTER_AUTH_SECRET` configurados como env de servidor no provedor.
- **Migração paralela de `apps/dobro`**: portar os menus mais usados do Dobro (KPIs, Board, uma tabela) para o formato manifesto + views correspondentes no Neon, mantendo as seções específicas como `custom:` blocks (com rota própria em `api/`). Validar que o Dobro OS **não perdeu capacidade** nesses menus (incluindo o comportamento de atualização — agora polling/refresh, não realtime).

**Pronto quando:** (a) Cliente Exemplo roda end-to-end com Better Auth e dados isolados no seu Neon, com `/api/query` recusando view fora da allowlist e requisição sem sessão; (b) `apps/dobro` renderiza seus menus principais via manifesto sem regressão visível vs. a versão hardcoded (assumindo a troca realtime→refresh como esperada).

**Nota de risco:** esta é a fase que valida as decisões de arquitetura. Se o manifesto/adapter não cobrir um caso real do Dobro, é aqui que se descobre — por isso o piloto migra o Dobro em paralelo, não só um cliente fictício.

---

## Fase 4 — Scaffolder · Esforço: **M**

**Objetivo:** criar cliente novo vira comando, não trabalho manual.

**Entregáveis:**
- `packages/scaffolder` com templates + gerador (começar simples: template + script; evoluir para CLI interativo). Gera front + `api/` (Hono + Better Auth) + `db/` (schema/migrations/views stub) + `.env.example` (DATABASE_URL, sem `VITE_`).
- `pnpm create-client` gera `apps/<cliente>` que roda só com `.env` preenchido + migrations aplicadas.
- README gerado com passos manuais restantes (criar Neon, migrar, escrever views, criar admin, deploy Vercel).

**Pronto quando:** um app novo gerado pelo scaffolder sobe com `pnpm dev` sem edição de código (só `.env` + migrations), manifesto válido, e o operador consegue segui-lo do zero à entrega usando só o README.

---

## Resumo de esforço e dependências

| Fase | Esforço | Depende de | Entrega utilizável |
|---|---|---|---|
| 0 — Setup monorepo | P | — | esqueleto que builda |
| 1 — Core + DS + backend base | M (4× G internos) | 0 | core renderiza manifesto mínimo lendo `/api/query` com auth |
| 2 — Blocos + engine | M | 1 | catálogo de blocos config-driven |
| 3 — Piloto + Dobro | M | 2 | 1 cliente real no ar (Neon + Better Auth + Vercel) + Dobro migrado |
| 4 — Scaffolder | M | 3 | fábrica automatizada |

**Regra de ouro do plano:** não avançar de fase sem o critério de "pronto" da anterior. E não generalizar um bloco (ex.: `funnel`) até existir o 2º cliente que o peça — evita perfeccionismo e configuração prematura (mitigações da skill Architect-First).
```
