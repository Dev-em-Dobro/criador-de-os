# 00 — Blueprint Geral do "Criador de OS"

> Autora: Aria (@architect) · Data: 2026-07-12 · Status: Proposta de arquitetura (design, sem código de produção)
> Documento raiz. Leia junto com `01-inventory.md` ... `08-riscos-decisoes.md`.
>
> **Revisado (2026-07-12): Firebase → NeonDB.** O banco passou de Firestore para **NeonDB (Postgres serverless)**; o acesso passou de SDK no browser para **backend/API por app** (funções serverless) com a connection string **só server-side**; auth passou a ser **obrigatória via Better Auth**. O monorepo, o manifesto config-driven, o catálogo de blocos, o BlockRegistry e o tema por cliente **não mudam** — a troca é uma camada isolada. Mudanças refletidas aqui: `core/data/` (agora cliente de API), layout do app (pasta `api/` + `.env` com `DATABASE_URL`) e o §6 (build & deploy).

## 1. O problema em uma frase

O Dev em Dobro tem um OS interno (o **Dobro OS**) que é uma ferramenta sob medida, com **roteamento e menus 100% hardcoded** em um `App.tsx` de ~540 linhas e ~60 seções fortemente acopladas ao próprio Dev em Dobro (Scudo, CodeQuest, Curseduca, nomes de pessoas, objetivos da semana embutidos no código). Queremos transformar esse conhecimento em uma **fábrica de OSs para clientes**: cada cliente ganha um dashboard sob medida, entregue pronto pelo Dev em Dobro, com menus que fazem sentido para qualquer empresa mas conteúdo customizado.

## 2. Princípios de arquitetura (o "porquê" antes do "como")

1. **Config-driven, não code-driven.** A diferença entre um cliente e outro é **dados de configuração** (um manifesto), não código copiado. O `switch` gigante do `App.tsx` morre; um motor lê o manifesto e renderiza.
2. **Núcleo único que todos herdam.** Melhorou o core, todos os clientes melhoram no próximo build. Zero fork de chassi.
3. **Isolamento total por cliente.** Código do cliente, tema, dados (**projeto Neon próprio**), backend/API e deploy são independentes. Um cliente nunca enxerga nem quebra o outro.
4. **Direção de dependência estrita e unidirecional.** `apps → blocks → core`. O core **nunca** importa de um app ou conhece um cliente. Blocos nunca importam de apps. (Detalhe no §5.)
5. **Extração honesta.** O que é fácil de extrair, extraímos primeiro. O que é caro (seções muito acopladas), fica no `apps/` do próprio Dev em Dobro e vira bloco genérico só quando um segundo cliente pedir algo parecido. **Não generalizamos sem 2 casos reais** (regra de mitigação de risco).

## 3. Layout do monorepo

```text
criador-de-os/
├── package.json                # workspace root (pnpm workspaces)
├── pnpm-workspace.yaml         # define packages/* e apps/*
├── turbo.json                  # pipeline de build/lint/typecheck
├── tsconfig.base.json          # paths compartilhados (@core/*, @blocks/*)
│
├── packages/
│   ├── core/                   # O CHASSI + design system. Não conhece nenhum cliente.
│   │   ├── src/
│   │   │   ├── shell/          # AppShell: topbar, sidebar, footer, layout
│   │   │   ├── router/         # ManifestRouter: gera rotas a partir do manifesto
│   │   │   ├── manifest/       # tipos ClientManifest + validação (zod) + loader
│   │   │   ├── registry/       # BlockRegistry: mapeia blockType → componente
│   │   │   ├── data/           # OsClient (cliente de API/fetch) + DataAdapter que
│   │   │   │                   #   resolve dataSource via /api/query (NÃO fala com banco)
│   │   │   ├── theme/          # ThemeProvider: aplica tokens do manifesto (CSS vars)
│   │   │   ├── ui/             # design system: KpiCard, SectionHeader, EmptyState,
│   │   │   │                   #   TrendChart, PeriodFilter, SkeletonCard, Table, Modal...
│   │   │   ├── period/         # filtro de período (weekly/monthly/quarterly)
│   │   │   └── index.ts        # barrel de exports públicos do core
│   │   └── package.json        # name: "@os/core"
│   │
│   ├── blocks/                 # Catálogo de BLOCOS genéricos, reutilizáveis por qualquer cliente.
│   │   ├── src/
│   │   │   ├── kpi-dashboard/  # grade de KPIs a partir de uma coleção
│   │   │   ├── data-table/     # tabela genérica com colunas via config
│   │   │   ├── kanban-board/   # board drag-and-drop (colunas via config)
│   │   │   ├── funnel/         # funil / etapas
│   │   │   ├── timeline/       # linha do tempo de eventos
│   │   │   ├── doc-viewer/     # visualizador/editor de markdown
│   │   │   ├── metric-comparison/ # comparativo atual vs anterior
│   │   │   └── index.ts        # registra cada bloco no formato de contrato
│   │   └── package.json        # name: "@os/blocks" (depende de @os/core)
│   │
│   └── scaffolder/             # (Fase 4) o "criador": CLI que gera apps/cliente-x
│       ├── src/
│       └── templates/          # template de app + manifesto inicial + tema
│
├── apps/
│   ├── dobro/                  # O próprio Dobro OS migrado (o primeiro "cliente").
│   │   ├── src/                # FRONT (SPA)
│   │   │   ├── manifest.ts     # menus → blocos → data bindings + tema
│   │   │   ├── blocks/         # blocos SOB MEDIDA do Dobro (Scudo, CodeQuest...)
│   │   │   ├── theme.ts        # cores/logo do Dobro
│   │   │   └── main.tsx        # monta <OsApp manifest={dobroManifest} />
│   │   ├── api/                # BACKEND (funções serverless — Hono)
│   │   │   ├── query.ts        # endpoint de query genérico (allowlist + bind + Neon)
│   │   │   ├── auth.ts         # Better Auth montado em /api/auth/*
│   │   │   └── [custom].ts     # rotas custom (ex.: /api/scudo/students)
│   │   ├── db/                 # schema Drizzle + migrations + views read-only por menu
│   │   │   ├── schema.ts       # tabelas (define a allowlist de views/colunas)
│   │   │   ├── views/          # v_<menu>.sql (o contrato de exposição de dados)
│   │   │   └── migrations/     # geradas pelo drizzle-kit
│   │   ├── .env                # DATABASE_URL (Neon) + BETTER_AUTH_SECRET — SÓ server-side
│   │   ├── .env.example        # placeholders versionados (sem segredos reais)
│   │   └── package.json        # name: "@app/dobro" (depende de @os/core, @os/blocks)
│   │
│   └── cliente-exemplo/        # cliente novo gerado pelo scaffolder
│       └── ...                 # mesma estrutura: front + api/ + db/, Neon próprio, tema próprio
│
└── docs/architecture/          # estes documentos
```

### Responsabilidade de cada package

| Package | Responsabilidade | Conhece cliente? | Depende de |
|---|---|---|---|
| **`@os/core`** | Chassi (shell/nav/router/footer), motor de manifesto, registry de blocos, design system, camada de dados (**OsClient de API + DataAdapter** que resolve `dataSource` via `/api/query`), tema, período. | **NÃO** | (nada interno; só react, lucide, react-router — **sem SDK de banco no front**) |
| **`@os/blocks`** | Catálogo de blocos genéricos reutilizáveis. Cada bloco é "burro" quanto ao cliente: recebe config + binding e renderiza. | **NÃO** | `@os/core` |
| **`@os/scaffolder`** | Gerador de novos apps (front + `api/` + `db/`) a partir de template + inputs. | Gera qualquer cliente | `@os/core` (só tipos) |
| **`apps/<cliente>`** | Manifesto + tema + blocos sob medida (front) + `api/` (funções serverless: query genérico + Better Auth) + `db/` (schema/migrations/views) + `.env` com `DATABASE_URL` do Neon próprio. Ponto de deploy. | **É o cliente** | `@os/core`, `@os/blocks` |

## 4. Ferramentas de monorepo — recomendação e justificativa

**Recomendado: pnpm workspaces + Turborepo.**

| Decisão | Escolha | Por quê (trade-off) |
|---|---|---|
| Gerenciador | **pnpm workspaces** | `node_modules` com hard-links economiza disco e instala rápido — relevante porque teremos N apps compartilhando React/Tailwind/Hono/Better Auth/Drizzle idênticos. Workspaces resolvem `@os/core` como link local sem publicar em registry. Alternativa npm/yarn funciona, mas pnpm é o padrão-ouro para monorepo TS hoje e o mais econômico com dependências repetidas. |
| Orquestrador de tasks | **Turborepo** | Cache de build/lint/typecheck por package com hashing de inputs. Como cada `apps/<cliente>` é um deploy independente, o Turbo só reconstrói o que mudou: mexeu no core → rebuilda todos; mexeu só no `apps/dobro` → rebuilda só ele. Sem isso, "melhorei o core, preciso republicar todos" vira um gargalo manual. Alternativa Nx é mais poderosa mas mais pesada/opinativa; para o tamanho atual (poucos clientes premium crescendo), Turbo é o ponto ideal de simplicidade/ganho. |
| Bundler/dev | **Vite 7** (já é a stack) | Um `vite build` por app. Sem mudança. |
| TS paths | `tsconfig.base.json` com `@os/core`, `@os/blocks` | Imports absolutos (Artigo VI da Constitution: absolute imports SHOULD). |

> **Nota de pragmatismo:** Turborepo é recomendado, não obrigatório para a Fase 0. Se o setup inicial ficar no caminho crítico, pnpm workspaces sozinho já entrega o isolamento; Turbo entra assim que o número de apps justificar o cache (2+ apps).

## 5. Direção de dependências (regra inegociável — "zero coupling")

```text
        ┌─────────────────────────────────────────┐
        │              apps/<cliente>              │  ← conhece o cliente
        │  (manifesto + tema + blocos sob medida)  │
        └───────────────┬─────────────────────────┘
                        │ importa
              ┌─────────▼─────────┐
              │    @os/blocks     │  ← genérico, sem cliente
              └─────────┬─────────┘
                        │ importa
              ┌─────────▼─────────┐
              │     @os/core      │  ← chassi, sem cliente, sem blocos
              └───────────────────┘
```

Regras verificáveis (candidatas a lint/CI):
- `@os/core` **não** pode importar de `@os/blocks` nem de `apps/*`.
- `@os/blocks` **não** pode importar de `apps/*`.
- `apps/*` **não** pode importar de outro `apps/*`.
- Nomes de tabela/view, textos de cliente, logos, cores: **proibidos** em `core` e `blocks`. Só existem em manifesto/tema/`db/` dentro de `apps/*`.
- **Nenhum SDK/driver de banco no front** (`packages/*` e `apps/*/src`): a Neon só é acessada de `apps/*/api`. Segredos (`DATABASE_URL`, `BETTER_AUTH_SECRET`) nunca com prefixo `VITE_`.

Como o core então "conhece" os blocos em runtime sem importá-los? Via **inversão de controle**: o app registra os blocos (do `@os/blocks` + os sob medida) em um `BlockRegistry` e passa para o `<OsApp>`. O core só conhece a *interface* de bloco, nunca as implementações. (Detalhe em `03-contrato-bloco.md`.)

## 6. Estratégia de build & deploy

- **Um deploy por `apps/<cliente>`, agora front + funções serverless.** Cada app deixa de ser um SPA estático puro: é um **front (SPA Vite) + uma pasta `api/` de funções serverless** (Hono). O hosting precisa suportar as duas coisas. Recomendação: **Vercel por cliente** (front + Serverless Functions no mesmo deploy, integração first-class com Hono e com a Neon), com **Cloudflare Pages+Workers** como plano B se custo/latência em escala pedirem. Ver `05-dados-auth-multitenant.md`, §7 e D-4.
- **A Neon é separada do hosting.** Cada cliente tem um **projeto Neon** (dados) + um deploy de hosting (front+API). Não são o mesmo provedor — diferente do modelo anterior, em que dados e hosting ficavam no mesmo projeto Firebase.
- **Pipeline Turbo:** `turbo run build --filter=@app/cliente-x` builda o app (front) e suas deps (`core`, `blocks`) com cache; as funções `api/` são empacotadas pelo provedor de hosting no deploy. CI de um cliente não toca no de outro.
- **Versão do core:** todos os apps consomem o `@os/core` do workspace (mesma versão do monorepo). Um cliente que precise "congelar" numa versão antiga do core é decisão explícita (ver `08-riscos-decisoes.md`, D-3) — default: todos na mesma versão, todos herdam melhorias.
- **Config sensível:** `DATABASE_URL` (Neon) e `BETTER_AUTH_SECRET` ficam no `.env` de cada app, lidos **só pelas funções `api/` (server-side)** — **nunca** com prefixo `VITE_` (que vazaria no bundle). Só a base URL da API vai para o front (não é segredo). Ver `05-dados-auth-multitenant.md`, §6.

## 7. Como o `App.tsx` hardcoded vira config-driven (a virada central)

Hoje (Dobro OS):
```
App.tsx  →  parsePathname()  →  switch (mainMenu) { case 'kpis': <KpiTab/>... }
             ~540 linhas, cada seção importada e cabeada à mão
```

Depois (Criador de OS):
```
apps/dobro/main.tsx
  → <OsApp manifest={dobroManifest} blocks={registry} />   (dataApi vem do manifesto)
       └─ core/OsClient (cliente de API) → fala com apps/dobro/api/* por HTTP
       └─ core/ManifestRouter lê manifest.navigation → gera <Route>s
       └─ core/AppShell renderiza topbar/sidebar a partir de manifest.navigation
       └─ para cada rota, core resolve manifest.item.block → registry[blockType]
       └─ passa item.config + item.dataSource ao bloco (dado resolvido via /api/query)
```

O `switch` e o `parsePathname` deixam de existir como código: viram **dados** no `manifest.navigation`. Adicionar um menu novo para um cliente = editar o manifesto, não o core.

## 8. O que este blueprint NÃO decide (fica para o dono — ver doc 08)

- ~~Se auth é obrigatória~~ → **RESOLVIDO:** auth obrigatória via Better Auth (premissa do dono).
- ~~Forma de acesso a dados~~ → **RESOLVIDO:** backend/API por app + Neon (premissa do dono).
- ~~Topologia de tenancy~~ → **RESOLVIDO:** 1 projeto Neon por cliente (premissa do dono).
- Política de versão do core quando um cliente diverge (fork vs feature-flag) — em aberto (D-3).
- Onde hospedar (Vercel vs Cloudflare vs Netlify) — recomendação dada (Vercel), decisão do dono (D-4).
- Se o scaffolder é CLI interativo ou template git — recomendação na Fase 4 (D-5).
- Query builder do backend (Drizzle vs Kysely) — recomendação dada (Drizzle), ver doc 05 §3.
```
