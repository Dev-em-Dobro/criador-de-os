# 01 — Inventário e Classificação do Dobro OS

> Fonte analisada: `D:\----- DEVQUEST\dobro-company-agents\dashboard\src`
> Método: leitura de `App.tsx`, primitivos de UI, `services/firebase.ts`, hooks de dados representativos, e amostragem das ~60 seções por arquétipo. Classificação honesta com esforço de extração.
>
> **Nota (2026-07-12): Firebase → NeonDB.** As colunas "Artefato no Dobro OS" descrevem o legado **como ele é hoje** (Firestore) — isso é fato histórico e permanece. O que muda é o **destino** na nova arquitetura: onde antes o padrão Firestore virava um "adapter Firestore genérico" no browser, agora vira **cliente de API (`OsClient`) no front + endpoint de query genérico no backend + Neon** (docs 03 e 05). As linhas de destino abaixo já refletem isso.

## Legenda dos baldes

- **(A) CORE / chassi** → vai para `packages/core`. Genérico, sem cliente, sem regra de negócio.
- **(B) BLOCO genérico** → vai para `packages/blocks`. Reutilizável por qualquer cliente via config.
- **(C) ESPECÍFICO do cliente** → fica em `apps/dobro`. Regra/dado/integração do Dev em Dobro.

Esforço de extração: **P** (pequeno, quase copiar-colar) · **M** (médio, precisa parametrizar) · **G** (grande, precisa reescrever/desacoplar).

---

## Balde A — CORE / Chassi

| Artefato no Dobro OS | Vira em `core` | Esforço | Observação de acoplamento |
|---|---|---|---|
| `App.tsx` (topbar, sidebar, footer, layout) | `shell/AppShell` | **M** | Layout e chrome são genéricos e bem-feitos. O acoplamento está no **conteúdo** dos arrays `mainNav`/`kpiTabs`/etc. e no `TECNOLOGIA_WEEKLY_OBJECTIVES` (dados do Dobro embutidos). Extrai-se o layout; os menus viram `manifest.navigation`. |
| `App.tsx` → `parsePathname` + `useEffect` de redirect | `router/ManifestRouter` | **G** | É o coração do "switch gigante". Reescrever para gerar rotas a partir do manifesto. Não é copiar — é o principal trabalho de engenharia do core. |
| `components/KPICard.tsx` | `ui/KpiCard` | **P** | Puro, só props (`KPICardData`). Extração trivial. |
| `components/SectionHeader.tsx` | `ui/SectionHeader` | **P** | Puro. Trivial. |
| `components/EmptyState.tsx` | `ui/EmptyState` | **P** | Puro (emoji 📊 hardcoded, tornar prop opcional). |
| `components/TrendChart.tsx` | `ui/TrendChart` | **P** | Puro SVG, sem deps. Trivial. |
| `components/SkeletonCard.tsx` (`SkeletonCards`) | `ui/Skeleton` | **P** | Puro. |
| `components/StatusIndicator.tsx` | `ui/StatusIndicator` | **P** | Puro (value/target). |
| `components/ErrorBanner.tsx` | `ui/ErrorBanner` | **P** | Puro (visible/message). |
| `components/PeriodFilter.tsx` + `hooks/usePeriodFilter.ts` | `period/*` | **P** | Filtro de período genérico. `Period` type é reutilizável. localStorage key vira config. |
| `utils/indicators.ts` (cores, `formatValue`, trend) | `ui/tokens` + `ui/format` | **P** | Puro. `formatValue` já suporta `%`, `x`, `R$`, `count` — genérico. |
| `src/index.css` (`@theme` tokens Tailwind) | `theme/base.css` + tokens | **M** | **Ativo valioso.** O tema inteiro é CSS vars (`--color-blue-500`, `--color-brand`...). A estratégia de "remapear todo `gray-*`/`blue-*`" torna o theming por cliente trivial: o manifesto injeta cores e o CSS var propaga. Extrair a base; cor do Dobro vira `apps/dobro/theme`. |
| `services/firebase.ts` (`initializeApp` + `export const db`) | `data/OsClient` (cliente de API) + `apps/*/api` (backend) | **G** | **Ponto crítico de refactor.** Hoje `db` é singleton de módulo Firestore no browser. No novo modelo, **some do front**: o front ganha um `OsClient` (fetch para `/api/*`) e o acesso ao banco passa a viver nas funções serverless de `apps/*/api`, com a `DATABASE_URL` (Neon) só server-side. Sem isso, não há multi-tenant nem segurança do segredo (docs 03, 05). |
| Padrão dos hooks (`onSnapshot`/`query`/`where`) | `data/DataAdapter` (front) → `/api/query` (backend) | **G** | O padrão de acesso é consistente e bom, mas **cada hook hardcoda o nome da coleção** (`'email_metrics'`, `'tasks'`) e tem seu próprio mapper. Vira um **`dataSource` declarativo** (`kind:'query'`, `view`, `select`, `where`) resolvido pelo **endpoint de query genérico seguro** (allowlist de views + bind params) — não mais `onSnapshot` no browser. Sem realtime (vira `refetch`). Ver docs 03 e 05. |
| `components/TaskDetailModal.tsx` (casca do modal) | `ui/Modal` | **M** | A casca (overlay/fechar) é genérica; o conteúdo é específico de task. Extrair só o `Modal` genérico. |

**Resumo do balde A:** os primitivos de UI são limpos e de baixo custo (a maior parte é **P**). O custo real e o valor de engenharia estão nas peças **G**: o **ManifestRouter**, o **OsClient de API + DataAdapter** (o front deixa de falar com banco) e o **endpoint de query genérico seguro no backend** (com Better Auth) — que juntos substituem o `db` singleton e os hooks Firestore. Essas são o core de verdade da nova arquitetura.

---

## Balde B — BLOCOS genéricos (o catálogo)

Cada linha é um **arquétipo de tela** que aparece repetido no Dobro OS e serve a qualquer empresa. As Sections listadas em "Origem" são as evidências/donor code.

| Bloco (`@os/blocks`) | Arquétipo | Sections de origem (donor) | Esforço | O que parametrizar via config |
|---|---|---|---|---|
| **`kpi-dashboard`** | Grade de KPIs com meta/tendência/comparativo | `YouTubeSection`, `AquisicaoSection`, `NewsletterSection`, `PaidTrafficSection`, `InstagramSection`, `PipelineSection`, `LaunchesSection` | **M** | coleção/fonte, lista de KPIs (label, unit, target, tooltip), período. As 7 seções são **a mesma forma** (KPICard grid + comparativo) com dados diferentes. |
| **`data-table`** | Tabela com colunas configuráveis, sort, badge | `ScudoStudentsSection`, `LeadJourneyTable`, `IcpAlunosView`, `CustomerSuccessSection` (listas) | **M** | colunas (key, label, formato, badge rule), fonte, sort default. |
| **`kanban-board`** | Board drag-and-drop, colunas configuráveis, filtro lateral | `BoardSection` | **M** | colunas (id/label), campo de agrupamento (ex.: `campaign`), coleção, ação de update de status. O drag-and-drop e o layout são 100% genéricos; só os textos ("Board dos agentes", "squad de marketing") e a coleção `'tasks'` são do Dobro. |
| **`funnel`** | Funil / etapas com indicadores | `FunnelOverview`, `FunnelStepIndicator`, `FunnelStepsDetail`, `FunilDisparosSection` | **G** | etapas, métricas por etapa, fonte. Mais acoplado à lógica de lançamento do Dobro; generalizar só o desenho do funil. |
| **`timeline`** | Linha do tempo de eventos/vendas | `SalesTimeline`, `LaunchProgressSection` | **M** | eventos (data, label, valor), fonte. |
| **`doc-viewer`** | Visualizador/editor de markdown a partir de fonte | `CampanhasDocsSection`, `PodcastDraftView`, `NewsletterDetailView` | **M** | fonte (API ou coleção), permissão de edição, agrupamento (campanha/pasta). Usa `react-markdown`+`remark-gfm` (já na stack). |
| **`metric-comparison`** | Comparativo "atual vs anterior" | bloco extraído do `ComparisonRow`/`ChangeIndicator` do `YouTubeSection` | **P** | pares de métricas. Pode ser sub-componente do `kpi-dashboard`. |

**Honestidade sobre acoplamento (balde B):** O `kanban-board` e o `kpi-dashboard` são os blocos de **maior alavancagem** — cobrem ~10 seções e são visualmente genéricos; valem a extração já na Fase 2. O `funnel` é o mais caro (a lógica de lançamento do Dobro está entranhada) — **não** deve ser generalizado na largada; extrair só o desenho quando um 2º cliente precisar de funil.

---

## Balde C — ESPECÍFICO do cliente (fica em `apps/dobro`)

Estas seções carregam nome, integração externa ou regra de negócio do Dev em Dobro. **Não** viram bloco genérico; viram **blocos sob medida** dentro de `apps/dobro/blocks`. Padrão: se um 2º cliente pedir algo parecido, aí sim se avalia generalizar (regra dos 2 casos).

| Section | Por que é do cliente | Integração |
|---|---|---|
| `ScudoStudentsSection` | Scudo (produto Dev em Dobro), fonte Neon `public.User` via `/api/scudo/students` | API externa própria |
| `CustomerSuccessSection` + `ForumAnalysisView` + `NpsAlunosView` | CS de alunos, CodeQuest, fórum | Firestore + APIs próprias |
| `useCurseducaExpiring` / `services/curseduca.ts` | Curseduca (plataforma de cursos do Dobro) | API Curseduca |
| `CeoWeeklySection`, `FoundersSection` | Visão CEO/Founders do Dobro, metas internas | Firestore |
| `TecnologiaSection` + `TECNOLOGIA_WEEKLY_OBJECTIVES` | Objetivos da semana com nomes (Cassimiro, Erackson, Pablo, Ricardo) hardcoded no `App.tsx` | hardcoded |
| `LaunchHubSection`, `LaunchBriefingSection`, `LaunchBoardSection`, `Launches*` | Metodologia de lançamento do Dobro (LF4, TMB, Hubla, Ticto, Provi) | Firestore + hooks específicos |
| `SimuladorSection` + `simulador/*` | Simulador financeiro específico do Dobro | Firestore |
| `ComercialSection` + `comercial/*` | Gestão comercial interna | Firestore |
| `CustosSection`, `FinanceSection`, `financeiro/*` | Financeiro do Dobro | Firestore |
| `CarrosselCreatorSection`, `LpCreatorSection`, `CampanhasImageAISection`, `ContentCP1Section` | Ferramentas de criação de conteúdo com IA do Dobro | APIs próprias |
| `IcpSection`, `IcpCompradorSection`, `LeadScoreSection` | Modelos de ICP/lead score do Dobro | Firestore |
| `Newsletter*` (N8n, YouTubeSelector, NewsSelector, Social) | Pipeline de newsletter do Dobro (n8n) | Firestore + n8n |
| `PodcastSection`, `PodcastDraftView` | Pipeline de podcast do Dobro | Firestore |

**Nota:** muitas dessas seções internamente **usam** os arquétipos do balde B (tabela, KPI grid, doc-viewer). O caminho é: a seção do Dobro passa a **compor** blocos genéricos + regra específica, em vez de reimplementar o layout. Isso reduz o `apps/dobro` a "manifesto + regra + binding".

---

## Contagem-resumo (aproximada, para dimensionar esforço)

| Balde | Qtde aprox. de artefatos | Custo dominante |
|---|---|---|
| A — Core/chassi | ~15 primitivos + 3 peças estruturais | 3 peças **G** (Router, DataProvider, Adapter); resto **P** |
| B — Blocos genéricos | ~7 blocos cobrindo ~20 sections | 2 blocos de alta alavancagem (**M**); funil é **G** |
| C — Específico Dobro | ~35–40 sections | fica em `apps/dobro`; migra sem generalizar |

**Conclusão honesta:** o Dobro OS é ~70% código específico do cliente e ~30% material reutilizável. Isso é **normal e esperado** para uma ferramenta interna. A boa notícia: os 30% reutilizáveis são exatamente o chassi + os primitivos + 2 arquétipos que já se repetem 7–10 vezes — ou seja, a alavancagem por extração é alta onde importa. O erro a evitar é tentar generalizar os 70% agora (isso é caro e sem retorno até haver um 2º cliente).
```
