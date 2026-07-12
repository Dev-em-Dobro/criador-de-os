# 02 — Schema do Manifesto (`ClientManifest`)

> O coração do design. Um cliente = um manifesto. O core lê o manifesto e renderiza tudo: marca, navegação, telas, bindings de dados. Substitui o `App.tsx` hardcoded por **dados**.

> **Revisado (2026-07-12): Firebase → NeonDB.** O bloco `firebase` do manifesto vira `dataApi` (só a base URL da API do app — a connection string da Neon **não** vai no manifesto, fica no `.env` server-side). O `DataSourceBinding` troca `kind: 'firestore'` por `kind: 'query'` (declarativo: `view`/`table`, `select`, `where`, `orderBy`, `limit`, agregações), resolvido pelo **endpoint de query genérico** do backend (doc 05, §4) — não mais pelo browser direto. `rest` e `static` permanecem. O restante do schema (identity, navigation, tema, registry) **não muda**.

## 1. Visão

O manifesto tem 4 blocos:

1. **`identity`** — marca (nome, logo, tema/cores).
2. **`dataApi`** — base URL da API do próprio app (as funções serverless que falam com a Neon). **Não** contém segredo: a connection string vive só no `.env` server-side.
3. **`navigation`** — a árvore de menus (menu principal → sub-abas), cada folha aponta para um **bloco** + **config** + **dataSource**.
4. **`settings`** — opções globais (auth on/off, período default, etc.).

O core percorre `navigation` para: (a) desenhar topbar/sidebar, (b) gerar as rotas, (c) para cada rota, resolver `block` no registry e passar `config` + `dataSource`. O `dataSource` declarativo é enviado pelo cliente de API do core ao endpoint `POST /api/query` do backend, que o resolve com segurança (auth + allowlist de views + SQL parametrizado — doc 05).

## 2. Tipo TypeScript (contrato)

> Este é o **contrato de design**. A implementação ficará em `packages/core/src/manifest/types.ts` e será validada em runtime com `zod` (fail-fast: manifesto inválido não builda/carrega).

```typescript
// ===== Identidade / Marca =====
export interface ManifestIdentity {
  clientId: string;           // slug único, ex.: "cliente-exemplo"
  displayName: string;        // "Cliente Exemplo"
  productName: string;        // wordmark, ex.: "EXEMPLO" + badge "OS"
  logoUrl: string;            // /logo.webp (por app)
  theme: ManifestTheme;
}

export interface ManifestTheme {
  // Cada chave remapeia um token CSS do core (estratégia @theme do Tailwind).
  // O core injeta como CSS vars; todo utility gray-*/blue-* herda.
  brand: string;              // cor primária, ex.: "#6528d3"
  brandBright?: string;
  signal?: string;            // cor de "ok/positivo", ex.: "#22c55e"
  // opcional: overrides finos de escala de cinza/acento
  tokens?: Partial<Record<ThemeTokenName, string>>;
  fontSans?: string;
  fontMono?: string;
}

// ===== Data API (um backend serverless por cliente) =====
export interface ManifestDataApi {
  // Base URL da API do próprio app (funções serverless que falam com a Neon).
  // NÃO é segredo: pode ir para o bundle. A connection string (DATABASE_URL)
  // vive SÓ no .env server-side das funções, nunca aqui (ver doc 05).
  // Ex.: "" (mesma origem, /api/*) ou "https://cliente-x.vercel.app".
  baseUrl: string;
  // caminhos padrão (default: /api/query e /api/auth); override se necessário.
  queryPath?: string;   // default "/api/query"
  authPath?: string;    // default "/api/auth"
}

// ===== Navegação =====
export interface ManifestNavigation {
  redirectRoot: string;       // para onde "/" redireciona, ex.: "/kpis/vendas"
  menus: MenuItem[];          // menu principal (topbar)
}

export interface MenuItem {
  key: string;                // slug do menu, ex.: "kpis"
  label: string;              // "Dashboard de KPIs"
  icon: IconName;             // nome de ícone lucide, ex.: "LayoutDashboard"
  route: string;              // rota base, ex.: "/kpis"
  // Folha direta (sem sub-abas) OU grupo com sub-abas:
  view?: BlockBinding;        // se folha: o bloco renderizado
  tabs?: SubTab[];            // se grupo: sidebar de sub-abas
}

export interface SubTab {
  id: string;                 // slug da aba, ex.: "vendas"
  label: string;              // "Vendas"
  icon: IconName;
  view: BlockBinding;         // o bloco desta aba
}

// ===== Binding: menu/aba → bloco + config + fonte =====
export interface BlockBinding {
  block: BlockType;           // qual bloco do registry, ex.: "kpi-dashboard"
  title?: string;             // título exibido no SectionHeader
  subtitle?: string;
  config: Record<string, unknown>; // config específica do bloco (tipada por bloco)
  dataSource?: DataSourceBinding;  // de onde vêm os dados
}

// ===== DataSource: como o bloco se liga a dados (sem hardcode) =====
// 'query'  → resolvido pelo endpoint genérico /api/query no backend (doc 05, §4).
//            Declarativo e SEGURO: referencia uma VIEW read-only da allowlist,
//            colunas conhecidas, SQL montado com bind params. Nunca SQL cru.
// 'rest'   → o cliente de API faz fetch em uma rota custom do app.
// 'static' → dados embutidos no config (telas sem backend).
export interface DataSourceBinding {
  kind: 'query' | 'rest' | 'static';

  // kind: 'query' (o caso principal — Postgres via backend)
  view?: string;              // VIEW read-only da allowlist, ex.: "v_vendas_kpi"
  table?: string;             // alternativa: tabela permitida (se a allowlist a expuser)
  select?: string[];          // colunas a retornar; DEVEM ser colunas conhecidas da view
  where?: FilterClause[];     // filtros declarativos → viram bind params ($1, $2...)
  orderBy?: { field: string; dir: 'asc' | 'desc' }[];
  limit?: number;             // teto aplicado no backend (ex.: máx. 1000)
  // agregações também podem vir prontas da view; para casos declarativos simples:
  aggregate?: { fn: 'sum' | 'count' | 'avg' | 'min' | 'max'; field: string; as: string }[];
  groupBy?: string[];

  // kind: 'rest'
  url?: string;               // rota custom do app, ex.: "/api/scudo/students"

  // atualização (não há realtime nativo no Postgres — ver doc 05, §8)
  refetch?: { mode: 'manual' | 'interval'; ms?: number };  // default { mode: 'manual' }

  // mapper: nome de um transformador registrado (opcional; default = identidade)
  mapper?: string;
}

export interface FilterClause {
  field: string;              // DEVE ser coluna conhecida da view (validado no backend)
  // conjunto FECHADO de operadores (validado no backend; nunca concatenado em SQL):
  op: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'like';
  // valor SEMPRE vira bind param; pode ser literal OU ref a estado do shell:
  value: unknown | { ref: 'period' | 'clientId' | string };
}

// ===== Settings globais =====
export interface ManifestSettings {
  // Auth é OBRIGATÓRIA (Better Auth self-hosted). 'enabled: false' só para demo local.
  auth: { enabled: boolean; provider: 'better-auth'; allowedDomains?: string[] };
  period?: { enabled: boolean; default: 'weekly' | 'monthly' | 'quarterly'; options?: string[] };
  footerText?: string;
}

// ===== O manifesto completo =====
export interface ClientManifest {
  version: 1;                 // versão do schema (para migração futura)
  identity: ManifestIdentity;
  dataApi: ManifestDataApi;   // base URL da API do app (sem segredo)
  navigation: ManifestNavigation;
  settings: ManifestSettings;
}

// tipos auxiliares (nomes fechados para validação)
export type BlockType =
  | 'kpi-dashboard' | 'data-table' | 'kanban-board'
  | 'funnel' | 'timeline' | 'doc-viewer' | 'metric-comparison'
  | `custom:${string}`;       // blocos sob medida do app, ex.: "custom:scudo-students"
export type IconName = string;        // validado contra o set do lucide-react
export type ThemeTokenName = string;
```

## 3. Exemplo preenchido — "Cliente Exemplo"

> Uma empresa fictícia com 4 menus: Vendas (KPIs), Clientes (tabela), Tarefas (kanban), Documentos (markdown). Note que **nenhum código React** foi escrito — só configuração.

```typescript
import type { ClientManifest } from '@os/core';

export const clienteExemploManifest: ClientManifest = {
  version: 1,

  identity: {
    clientId: 'cliente-exemplo',
    displayName: 'Cliente Exemplo',
    productName: 'EXEMPLO',
    logoUrl: '/logo.webp',
    theme: {
      brand: '#2563eb',          // azul do cliente (remapeia blue-500 do core)
      brandBright: '#3b82f6',
      signal: '#16a34a',
    },
  },

  dataApi: {
    // Só a base URL da API do app. NÃO é segredo (a connection string da Neon
    // vive no .env server-side, nunca aqui). Vazia = mesma origem (/api/*).
    baseUrl: '',
    queryPath: '/api/query',
    authPath: '/api/auth',
  },

  navigation: {
    redirectRoot: '/vendas',
    menus: [
      // 1) VENDAS — folha direta com bloco de KPIs
      {
        key: 'vendas',
        label: 'Vendas',
        icon: 'BarChart3',
        route: '/vendas',
        view: {
          block: 'kpi-dashboard',
          title: 'Vendas',
          subtitle: 'Desempenho comercial',
          config: {
            kpis: [
              { key: 'faturamento', label: 'Faturamento', unit: 'R$', target: 100000, tooltip: 'Receita bruta no período' },
              { key: 'novos_clientes', label: 'Novos Clientes', unit: 'count', target: 40 },
              { key: 'ticket_medio', label: 'Ticket Médio', unit: 'R$', target: 2500 },
              { key: 'conversao', label: 'Conversão', unit: '%', target: 12 },
            ],
          },
          // Lê a VIEW read-only v_vendas_kpi (agregação pronta no Postgres).
          // O endpoint /api/query valida view+colunas contra a allowlist e usa bind params.
          dataSource: {
            kind: 'query',
            view: 'v_vendas_kpi',
            select: ['periodo', 'faturamento', 'novos_clientes', 'ticket_medio'],
            where: [{ field: 'periodo', op: '=', value: { ref: 'period' } }],
            orderBy: [{ field: 'periodo', dir: 'desc' }],
            limit: 12,
            refetch: { mode: 'interval', ms: 60000 },  // sem realtime: refaz a cada 60s
          },
        },
      },

      // 2) CLIENTES — folha direta com tabela
      {
        key: 'clientes',
        label: 'Clientes',
        icon: 'Users',
        route: '/clientes',
        view: {
          block: 'data-table',
          title: 'Base de Clientes',
          config: {
            columns: [
              { key: 'nome', label: 'Nome', format: 'text' },
              { key: 'plano', label: 'Plano', format: 'badge' },
              { key: 'mrr', label: 'MRR', format: 'currency' },
              { key: 'ultimoContato', label: 'Último contato', format: 'date' },
            ],
            defaultSort: { field: 'mrr', dir: 'desc' },
          },
          dataSource: {
            kind: 'query',
            view: 'v_clientes',
            select: ['nome', 'plano', 'mrr', 'ultimo_contato'],
            orderBy: [{ field: 'mrr', dir: 'desc' }],
            refetch: { mode: 'manual' },   // recarrega ao clicar em "atualizar"
          },
        },
      },

      // 3) OPERAÇÃO — grupo com sub-abas (sidebar): Tarefas + Documentos
      {
        key: 'operacao',
        label: 'Operação',
        icon: 'ClipboardList',
        route: '/operacao',
        tabs: [
          {
            id: 'tarefas',
            label: 'Tarefas',
            icon: 'Kanban',
            view: {
              block: 'kanban-board',
              title: 'Tarefas',
              config: {
                columns: [
                  { id: 'todo', label: 'A fazer' },
                  { id: 'doing', label: 'Em progresso' },
                  { id: 'done', label: 'Concluído' },
                ],
                groupBy: 'projeto',        // filtro lateral por projeto
                statusField: 'status',
              },
              dataSource: {
                kind: 'query',
                view: 'v_tarefas',
                select: ['id', 'titulo', 'status', 'projeto'],
                refetch: { mode: 'interval', ms: 30000 },  // board: refaz a cada 30s
              },
            },
          },
          {
            id: 'documentos',
            label: 'Documentos',
            icon: 'FileText',
            view: {
              block: 'doc-viewer',
              title: 'Documentos',
              config: { editable: true, groupField: 'pasta' },
              dataSource: {
                kind: 'query',
                view: 'v_documentos',
                select: ['id', 'titulo', 'conteudo', 'pasta'],
                refetch: { mode: 'manual' },
              },
            },
          },
        ],
      },
    ],
  },

  settings: {
    auth: { enabled: true, provider: 'better-auth', allowedDomains: ['clienteexemplo.com'] },
    period: { enabled: true, default: 'monthly', options: ['weekly', 'monthly', 'quarterly'] },
    footerText: 'Cliente Exemplo · OS',
  },
};
```

## 4. Como isso substitui o `App.tsx` hardcoded

| No Dobro OS hoje (código) | No Criador de OS (dados no manifesto) |
|---|---|
| `type MainMenu = 'founders' \| 'kpis' \| ...` (união hardcoded) | `navigation.menus[].key` |
| `const mainNav = [{ key:'kpis', label:'...', icon: LayoutDashboard, to:'/kpis/youtube' }]` | `navigation.menus[]` (label/icon/route) |
| `const kpiTabs = [{ id:'youtube', label:'YouTube', icon: MonitorPlay }]` | `menus[].tabs[]` |
| `parsePathname()` + `useEffect` de redirect | `ManifestRouter` gera rotas + `navigation.redirectRoot` |
| `{mainMenu === 'kpis' && kpiTab === 'youtube' && <YouTubeSection period={period}/>}` | `registry[binding.block]` recebe `binding.config` + `binding.dataSource` |
| `<YouTubeSection>` faz `useYouTubeData()` (coleção hardcoded) | bloco `kpi-dashboard` recebe `dataSource.view` por config; o dado vem do `/api/query` |
| `TECNOLOGIA_WEEKLY_OBJECTIVES` (dados no código) | vira `dataSource` (view/tabela no Neon) ou config do bloco (`kind: 'static'`) |
| Cor/logo/tema em `index.css` fixos | `identity.theme` → CSS vars injetadas pelo `ThemeProvider` |

O `App.tsx` de ~540 linhas some. No lugar: um `<OsApp manifest={...} blocks={registry} />` de poucas linhas no `apps/<cliente>/main.tsx`, e o manifesto — que qualquer operador do Dev em Dobro edita sem tocar em React.

## 5. Decisões de design do manifesto (e por quê)

- **`dataSource` declarativo (não código).** O binding descreve `view` + `select` + `where` + `orderBy` como dados. Assim o mesmo `kpi-dashboard` serve a `v_vendas_kpi` de um cliente e `v_email_kpi` de outro sem recompilar o bloco. Trade-off: filtros muito exóticos podem não caber no modelo declarativo → escape hatch é `kind: 'rest'` (rota custom no `api/`) ou um `custom:` block no app.
- **Resolução SEGURA no backend.** O `dataSource` declarativo **não** é executado no browser. O core envia esse objeto ao endpoint `POST /api/query`, que valida `view`/colunas contra a **allowlist** (só views read-only expostas), monta **SQL parametrizado** (bind params) e só então consulta a Neon — sempre depois de checar a sessão Better Auth. Detalhe completo no doc 05, §4. Isso é o que preserva "o operador edita o manifesto sem dev" **sem** abrir brecha de segurança: o manifesto só pode pedir o que a view já expõe.
- **`ref` em filtros** (`value: { ref: 'period' }`) resolve estado do shell (período atual, clientId) em runtime e vira **bind param** no backend. Evita cabear o filtro de período em cada bloco como o Dobro OS faz hoje.
- **Sem realtime → `refetch`.** Como o Postgres não tem `onSnapshot`, cada `dataSource` declara sua estratégia de atualização (`manual` ou `interval`). Default `manual` (doc 05, §8).
- **`custom:${string}`** no `BlockType` é a válvula de escape honesta: quando uma tela é específica demais (Scudo), o app registra um bloco sob medida e o referencia pelo manifesto — mantendo tudo config-driven, sem forçar generalização prematura.
- **`version: 1`** no topo permite migração de schema quando o manifesto evoluir, sem quebrar clientes antigos.
- **Validação com zod no load** (fail-fast): manifesto malformado falha no boot com mensagem clara, não com tela branca — importante porque o operador (não-dev) vai editar manifestos.
```
