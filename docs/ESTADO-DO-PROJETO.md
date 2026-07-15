# Criador de OS — Estado do Projeto (documentação consolidada)

> Atualizado em **2026-07-14**. Visão geral de tudo que foi construído até aqui.
> Para o desenho arquitetural detalhado, ver `docs/architecture/` (00–09).

---

## 1. O que é

O **Criador de OS** é uma **fábrica de "OS"** — dashboards de gestão sob medida — para clientes do **Dev em Dobro**. Ele extrai um núcleo reutilizável do OS interno existente (o **Dobro OS**) e o transforma numa base **config-driven**: cada cliente vira um app dirigido por um único **manifesto**, sem reescrever código de tela.

**Fonte/inspiração:** o Dobro OS (React 19 + TS + Vite + Tailwind), hoje altamente acoplado (menus/seções hardcoded num `App.tsx` gigante). O Criador de OS extrai o ~30% reutilizável e o generaliza.

## 2. Modelo (decisões fechadas — não relitigar)

- **NÃO é SaaS.** Cada cliente tem menus comuns, mas conteúdo sob medida. O cliente **opera**; o Dev em Dobro **configura e entrega pronto**, melhora depois.
- **1 app por cliente** (`apps/<cliente>`) + **1 projeto Neon por cliente** (isolamento total de dados).
- **Config-driven:** um `ClientManifest` por cliente substitui o switch hardcoded. Validado com zod no boot (fail-fast).
- **Banco = NeonDB (Postgres)**, acesso via **backend/API serverless por app** (connection string server-side; nunca no bundle).
- **Auth obrigatória** com **Better Auth** (self-hosted; usuários no Neon do cliente).
- **pnpm workspaces + Turborepo**; um deploy por app.

## 3. Arquitetura do monorepo

```
criador-de-os/
├── packages/
│   ├── core       (@os/core)       chassi + design system + motor do manifesto
│   ├── blocks     (@os/blocks)     catálogo de blocos genéricos (telas)
│   ├── server     (@os/server)     capacidades de backend (settings/leads/faturas/…)
│   └── scaffolder (@os/scaffolder) o "Criador de OS": gera apps/<cliente>
├── apps/
│   ├── dobro      (@app/dobro)     app de referência
│   └── neurovida  (@app/neurovida) 1º cliente real
└── docs/architecture/  (blueprint 00–09)
```

**Dependências:** `apps → { @os/core, @os/blocks, @os/server }`. Os pacotes são consumidos como **source** (via `vite-tsconfig-paths`), sem build separado. `drizzle-kit` resolve os re-exports de schema entre pacotes.

## 4. Config-driven: o `ClientManifest`

Tudo que descreve um cliente é **dado**, não código. Um `ClientManifest` (validado por `validateManifest`, zod, fail-fast com path legível) declara:

- `identity` — marca (clientId, productName, logo, **tema/paleta** — injetada como CSS custom properties).
- `dataApi` — base URL da API do app (sem segredo).
- `navigation` — `redirectRoot` + `menus[]`. Cada `MenuItem` é **folha** (`view: BlockBinding`) ou **grupo** (`tabs[]`), pode ter `hidden`, `help` (descrição + tutorial) e — novo — `assistant` (copiloto flutuante).
- `BlockBinding` — qual `block` do registry + `config` + `dataSource` (`query` | `rest` | `static`) + `help`.
- `settings` — auth, período, footer.

O motor (`ManifestRouter`) gera rotas, alimenta o shell e resolve cada bloco no registry, injetando `config` + dados. **Substitui o `App.tsx` hardcoded por um arquivo de configuração.**

## 5. Os pacotes

### 5.1 `@os/core` — chassi + design system

- **`OsApp`** — ponto de entrada: valida o manifesto → `ThemeProvider` → `AuthGate` → `BrowserRouter` → `ManifestRouter`.
- **`ManifestRouter`** — motor de navegação (rotas a partir de `navigation`, alimenta o `AppShell`, resolve blocos, trata `redirectRoot`/grupos, esconde `hidden`, monta o copiloto do menu ativo).
- **`AppShell`** — chassi visual (topbar em pills + sidebar opcional + footer), prop-driven, sem texto de cliente. Slots: `logo`, `banner`, **`floating`** (camada fixa para copilotos).
- **Design system:** `ui/*` (KpiCard, SectionHeader, EmptyState, TrendChart, Skeleton, StatusIndicator, ErrorBanner, SectionIntro), `theme/*` (tokens `@theme` + `base.css` token-driven — remapeia escalas `gray/blue/…` via CSS custom properties, então **skins** trocam a identidade sem tocar componentes), `router/icon.ts` (registry curado de ícones lucide + `resolveIcon`), `period/*`.
- **Motor do manifesto:** `manifest/types.ts` + `manifest/schema.ts` (zod), `registry/*` (BlockRegistry + contrato de bloco), `data/DataAdapter.ts` (`useDataSource`), `data/createOsClient.ts` (cliente de API real), `auth/AuthGate.tsx`.
- **`FloatingAgent`** (novo) — copiloto de IA flutuante genérico (ver §7 e doc 09).

### 5.2 `@os/blocks` — catálogo de blocos (telas)

Blocos genéricos, **code-split lazy** (cada um vira um chunk sob demanda):

- **Conteúdo:** `kpi-dashboard`, `data-table`, `kanban-board`, `metric-comparison`, `doc-viewer`.
- **"Console"** (gerenciam estado próprio + falam com o backend de fábrica): `settings-panel` (BYOK), `lead-console`, `invoice-console` (fatura PDF por IA), `hotmart-console` (faturamento).

Cada bloco: `index.ts` (schema zod da config + `React.lazy(component)`) + `component.tsx` (pesado, isolado no chunk). `registerDefaultBlocks(registry)` registra todos.

### 5.3 `@os/server` — capacidades de backend

A lógica de backend vive **uma vez** aqui; cada app liga os fios ao seu Neon. Banco Drizzle injetado por dependência (`ServerDb`). `mountApi(app, { auth, db, settingsEncKey, agencyAnthropicKey })` monta, **auth-first**:

- **Configurações/BYOK** — `app_settings` chave→valor **cifrado (AES-256-GCM)**; o valor cru nunca volta ao browser (só hint `••••XXXX`). Registro fechado `KNOWN_SETTINGS`.
- **Leads** — parser CSV RFC 4180, dedup por email/telefone, merge union-find, **score config-driven** (régua no manifesto), 4 segmentos.
- **Faturas** — `invoices` + `invoice_items`; extração de PDF por IA (`invoice-extract`, Claude com bloco `document` base64), agregação por categoria.
- **Faturamento (Hotmart)** — `hotmart_metrics` (só agregados, sem PII), OAuth `client_credentials`, sync do endpoint de resumo.
- **Copiloto** (novo) — `mountAssistant` + `makeFinanceAssistant` (ver §7 e doc 09).

Schema compartilhado (`SHARED_TABLES`): tabelas do Better Auth + `app_settings` + leads + invoices + hotmart.

### 5.4 `@os/scaffolder` — o "Criador de OS"

Gera `apps/<cliente>` a partir de respostas. CLI (`node:readline`, zero dep de prompt): wizard interativo **ou** `--config <json>` **ou** `--dry-run` **ou** `validate`. Scripts raiz: `pnpm create-client` / `pnpm os`.

- **Presets:** `static` (só-front, roda sem Neon) e `full` (front + `api/` Hono+Better Auth + `db/` Drizzle/Neon + `/api/query` seguro + capacidades de fábrica + **backend do copiloto**).
- **Garantia-chave:** o gerador roda o `validateManifest` **real** do core ANTES de escrever qualquer arquivo — todo app nasce com manifesto válido por construção.

## 6. Dados, autenticação e segurança

- **1 Neon por cliente** — isolamento total. Cada app carrega só o próprio `.env` (não herda a raiz).
- **Better Auth** (email+senha, adapter Drizzle) — sessão validada na API de cada app.
- **`/api/query` genérico e SEGURO** — 3 defesas: (1) auth-first; (2) allowlist de **views** read-only (view fora → 403, coluna fora → 400); (3) SQL montado com **bind params** (identificadores via allowlist, valores sempre parametrizados).
- **2 roles least-privilege** — `app_auth` (R/W só nas tabelas de auth + capacidades) e `app_query` (SELECT só nas views `v_*`). A API não conecta mais como owner. Provisionados via `db:provision-roles`.
- **BYOK cifrado** — a chave de IA do cliente é guardada cifrada (AES-256-GCM) e usada server-side; nunca vai ao bundle.

## 7. Ações de IA de produto

Todas usam **`claude-opus-4-8`** (SDK `@anthropic-ai/sdk`), rodam **server-side** (o SDK nunca vaza pro bundle — verificado por grep no `dist`), e usam a chave **BYOK** do cliente (fallback DEV da agência).

- **Estúdio IA (carrossel)** — gera carrossel de Instagram embasado em evidência real (Claude + `web_search` server-side) com saída estruturada forçada.
- **Fatura PDF por IA** — extrai/categoriza os lançamentos de um PDF de fatura (bloco `document` base64, saída forçada, streaming para faturas grandes).
- **Copiloto flutuante (assistente por seção)** — o primitivo novo (abaixo).

### O copiloto flutuante — primitivo de fábrica

Um **FAB estilo WhatsApp** ancorado a uma seção que abre um painel: **análise automática** ao abrir + **chat** de follow-up. Config-driven em 3 camadas:

1. **Manifesto** (`MenuItem.assistant: AssistantConfig`) — `{ contextKey, title, subtitle?, icon?, starters?, inputs? }`. Só o seguro ao browser; a **persona/prompt vive no backend**.
2. **Core** (`FloatingAgent`) — FAB + painel genéricos. Análise no formato `{ resumo, secoes[], acoes[] }` + chat + campos opcionais (persistidos em localStorage). Montado pelo `ManifestRouter` no menu ativo.
3. **Backend** (`mountAssistant` + `AssistantProvider`) — `POST /api/assistant/:key/{analyze,chat}`, auth-first + BYOK. Cada domínio registra um provedor (`persona` + `provide` → contexto server-side). `makeFinanceAssistant(db)` é um provedor **pronto** (consultor financeiro sênior sobre a fatura do cartão).

**Como adicionar um copiloto a qualquer seção:** (1) escreva um `AssistantProvider` no backend e registre em `mountAssistant.providers['<chave>']`; (2) declare `assistant: { contextKey: '<chave>', … }` no menu do manifesto. Detalhes em `docs/architecture/09-copiloto-flutuante.md`.

## 8. Os apps

### `apps/dobro` — referência

App vitrine (Dobro OS) que exercita o vertical completo: manifesto + blocos + `/api/query` real na Neon.

### `apps/neurovida` — 1º cliente real

Origem: proposta Dev em Dobro × **Neurovida** (saúde/suplementos). Backend real (Better Auth + Neon + settings cifradas). Design system **creme/dusk** (linguagem orgânica, serifa Fraunces).

- **Menus visíveis:** **Financeiro** (fatura PDF por IA + **copiloto analista financeiro**), **Faturamento** (Hotmart, só agregados), **Leads Quentes** (ICP config-driven), **Simulador** (calculadora de lançamentos), **Configurações** (BYOK).
- **Ocultos** (`hidden: true`, reversível): Clube, Estúdio IA (carrossel).

## 9. Linha do tempo (fases)

| Fase | Entrega |
|------|---------|
| **0** | Monorepo pnpm + Turborepo (core/blocks/apps). |
| **1** | Vertical E2E: design system portado + motor do manifesto + camada de dados/auth + `/api/query` seguro (provado na Neon real). |
| **2** | Catálogo de blocos genéricos (code-split lazy). |
| **3** | Hardening de segurança: 2 roles least-privilege (API deixa de ser owner). |
| **4** | Scaffolder ("Criador de OS") — gera apps `static`/`full`, valida por construção. |
| **—** | Generalização das capacidades na fábrica (`@os/server`: settings/BYOK, leads, faturas, hotmart) + **copiloto flutuante** (primitivo em core/server/scaffolder). |

## 10. Como rodar

```bash
pnpm install
pnpm build                       # turbo: 4 apps/pacotes
pnpm -C apps/neurovida dev       # API (Hono) + Vite web

# Gerar um cliente novo:
pnpm create-client               # wizard
pnpm create-client -- --config caminho.json   # não-interativo
```

Dev do neurovida: login → configure a chave BYOK em **Configurações** → as ações de IA (Estúdio IA, fatura PDF, copiloto) passam a usar a conta do cliente.

## 11. Status e pendências

- **Verde:** `pnpm typecheck` (8/8) e `pnpm build` (4/4) passam. Nenhum segredo/SDK vaza pro bundle.
- **Provado na Neon real:** query segura, roles, BYOK (roundtrip cifrado), leads (6→4 fontes), faturas (camada de dados + 1 fatura real de 134 itens extraída ao vivo), copiloto (rota genérica via smoke fictício).
- **Pendências conhecidas:**
  - **Deploy por cliente** (hospedagem Vercel/Cloudflare) — nenhum app foi a produção ainda.
  - **Extração para repo separado** (`neurovida-os`) — exige publicar `@os/*` no GitHub Packages (bloqueada por token gh).
  - **Ações de IA ao vivo sobre dado real** — algumas (copiloto, sync Hotmart) têm a camada provada, mas a chamada ponta-a-ponta com dado real fica com o dono (privacidade + custo BYOK).
  - **Scaffolder** ainda não modela menus "console" (settings/leads/invoice/hotmart) nem o `assistant` no manifesto gerado — o backend do copiloto já é gerado; a declaração do menu é um one-liner manual.

---

*Documento gerado por @architect (Aria). Detalhe arquitetural: `docs/architecture/00-blueprint.md` … `09-copiloto-flutuante.md`.*
