---
name: criador-de-os-phases
description: Faseamento do "Criador de OS" (motor de manifesto config-driven) e o que cada fatia entrega — orienta escopo de futuras stories
metadata:
  type: project
---

O "Criador de OS" é uma fábrica de OSs sob medida por cliente: um cliente = um `ClientManifest` (dados), e o `@os/core` renderiza tudo a partir dele (marca, navegação, telas, dados). Substitui o `App.tsx` hardcoded do Dobro OS por um motor dirigido por manifesto.

**Faseamento (fonte: docs/architecture/00, 02, 03; revisados 2026-07-12 para NeonDB):**
- **Fase 0 / 1A** (feitas): design system em `@os/core` (ui/*, theme/*, shell/AppShell, period/*). `OsApp` era um showcase mock.
- **Fase 1B** (feita nesta sessão): o MOTOR de manifesto — `manifest/` (types + zod `validateManifest` fail-fast), `registry/` (contrato de bloco + `createRegistry` com inversão de controle), `data/DataAdapter` (só `kind:'static'` implementado), `router/ManifestRouter` (gera rotas de `navigation`, alimenta o shell, resolve bloco+dado). `OsApp` agora é `{ manifest, registry }`.
- **Fase 1C** (FEITA): camada de dados+auth. `apps/dobro/api/` (Hono + `@hono/node-server` na porta 8787, proxy Vite `/api`), `apps/dobro/db/` (Drizzle + `@neondatabase/serverless` HTTP + drizzle-kit migrations + seed). Better Auth email+senha (Drizzle adapter, provider `pg`) em `/api/auth/*`. `/api/query` seguro: auth-first (401) → allowlist de views `v_*` em `api/query-allowlist.ts` (403) → SQL parametrizado via `sql`+`sql.identifier` do Drizzle em `api/query-builder.ts`. No core: `data/createOsClient.ts` (fetch real com `credentials:'include'`) + `auth/AuthGate.tsx` (login se `settings.auth.enabled`); `useDataSource` liga `query`/`rest`. Usuário DEV: admin@dobro.local. `pnpm dev` sobe API+Vite via concurrently.
- **Fase 2** (futura): catálogo real de blocos em `@os/blocks` (`kpi-dashboard`, `data-table`, `kanban-board`, ...). Hoje `@os/blocks` está vazio; os blocos de exemplo vivem provisoriamente em `apps/dobro/src/blocks.tsx`.

**Why:** modelo revisado de Firebase → NeonDB. A connection string NUNCA vai no manifesto (fica em `.env` server-side); o manifesto só carrega `dataApi.baseUrl` (sem segredo). Nenhum SQL no front — o front envia `dataSource` declarativo, o backend valida e monta SQL.
**How to apply:** ao pegar uma story de dados, é 1C — o trabalho é backend (`/api/query` + allowlist) + concretizar `OsClient` no core; NÃO reescrever o adapter/router. Ao pegar blocos reutilizáveis, é Fase 2 em `@os/blocks`, e aí remover os exemplos de `apps/dobro`. Ver [[criador-de-os-architecture-rules]].
