---
name: criador-de-os-architecture-rules
description: Regras de fronteira inegociáveis do monorepo Criador de OS (@os/core não conhece cliente; dependência unidirecional) — evita quebrar o design multi-tenant
metadata:
  type: project
---

Monorepo pnpm + Turborepo em `D:\projetos-clientes-impulse\criador-de-os`. Camadas: `@os/core` (chassi) ← `@os/blocks` (catálogo) ← `apps/*` (clientes). Dependência SÓ unidirecional (apps → blocks → core).

**Regras inegociáveis:**
- `@os/core` NÃO importa de `@os/blocks` nem de `apps/*`. Conhece só a INTERFACE de bloco (`BlockDefinition`); o app registra as implementações via `createRegistry()` (inversão de controle).
- `@os/core/src` NÃO contém texto/cor/nome de cliente em VALORES de runtime. Referências a "Dobro"/"scudo" só existem em comentários/JSDoc arquiteturais (documentando o que o motor substitui) — isso é aceito. A paleta default do core é NEUTRA (azul sóbrio em `theme/base.css`); a cor do cliente vem de `manifest.identity.theme` via `ThemeProvider`.
- Texto/cor/marca de cliente vive SÓ em `apps/<cliente>/src/manifest.ts`.
- TS estrito: `strict` + `verbatimModuleSyntax` + `isolatedModules` LIGADOS → SEMPRE `import type` para tipos. Sem `any` desnecessário (o único cast justificado é na fronteira do `register()` do registry, por contravariância do config do componente).

**Why:** é o que garante multi-tenant + segurança: o mesmo core serve N clientes sem recompilar, e um cliente não "vaza" no chassi. O boundary quebra silenciosamente se alguém importar um bloco no core.
**How to apply:** antes de adicionar import no core, cheque a direção. Ao criar um bloco, ele NÃO fala com banco/SDK — recebe dados via `ctx.data`; título/rótulos vêm de props/config. Verificação: `pnpm typecheck` (gate real; não há ESLint configurado ainda — `pnpm lint` é no-op) e grep por strings de cliente em `@os/core/src`. Ver [[criador-de-os-phases]].
