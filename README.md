# Criador de OS

Monorepo que gera **OSs** (dashboards de gestão sob medida) para clientes, a partir de um núcleo reutilizável. Config-driven: cada cliente é um **manifesto** + tema + banco Neon próprio.

> Blueprint de arquitetura completo em [`docs/architecture/`](./docs/architecture/).

## Estrutura

```
packages/
  core/      @os/core    — chassi + design system + motor de manifesto (não conhece cliente)
  blocks/    @os/blocks  — catálogo de blocos genéricos (depende de @os/core)
apps/
  dobro/     @app/dobro  — o Dobro OS migrado (o primeiro "cliente")
```

**Regra de dependência (inegociável):** `apps → blocks → core`. O core nunca importa de `blocks`/`apps`; nomes de tabela, textos e cores de cliente só existem em `apps/*`.

## Stack

- pnpm workspaces + Turborepo · React 19 + TypeScript + Vite 7 + TailwindCSS 4
- Dados: NeonDB (Postgres) por cliente, acessado por uma API server-side por app (Fase 1+)
- Auth: Better Auth (Fase 1+)

## Comandos

```bash
pnpm install       # instala o workspace
pnpm dev           # sobe os apps em modo dev (Vite)
pnpm build         # build de tudo (Turborepo)
pnpm typecheck     # checagem de tipos
```

## Status

**Fase 0 — Setup do monorepo** (esqueleto que builda e roda um shell vazio). Ver plano faseado em `docs/architecture/07-plano-migracao.md`.
