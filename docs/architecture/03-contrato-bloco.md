# 03 — Contrato de Bloco e Data-Source Adapter

> Como um bloco é definido, como recebe config do manifesto, e o padrão de adapter que o pluga a qualquer fonte **sem hardcode**. Esta é a peça que substitui os ~50 hooks de dados do Dobro OS (`useYouTubeData`, `useBoardTasks`, `useFirestoreMetrics`...) por um mecanismo genérico.
>
> **Revisado (2026-07-12): Firebase → NeonDB.** O `DataAdapter` deixa de falar com o SDK Firestore no browser e passa a chamar a **API do app** (HTTP): envia o `dataSource` declarativo a `POST /api/query`, que resolve com segurança contra a Neon (doc 05). O `useOsClient()` deixa de ser um `db` Firestore e vira um **cliente de API** (fetch). **Os blocos em si NÃO mudam** — continuam recebendo `ctx.data` e não sabem de onde o dado veio. O exemplo `KpiDashboardBlock` permanece idêntico.

## 1. O que é um bloco

Um **bloco** é um componente React genérico que:
- **não conhece** nenhum cliente, nenhuma coleção, nenhum texto de negócio;
- recebe **config** (do `binding.config` do manifesto) e **dados** (resolvidos pelo core a partir do `binding.dataSource`);
- renderiza usando o design system do `@os/core`.

Contraste com o Dobro OS: hoje `YouTubeSection` chama `useYouTubeData()` (coleção fixa), tem título fixo "@devemdobro" e sabe que é YouTube. O bloco `kpi-dashboard` não sabe nada disso — recebe tudo por config.

## 2. Interface de props de um bloco

```typescript
// packages/core/src/registry/block.ts

export interface BlockContext {
  // dados já resolvidos pelo core a partir do dataSource do manifesto
  data: unknown;              // formato depende do adapter/mapper
  loading: boolean;
  error: string | null;
  // estado global do shell disponível para o bloco
  period: Period;
  clientId: string;
  // ações opcionais (ex.: escrever de volta) expostas pelo adapter
  actions: {
    updateDoc?: (id: string, patch: Record<string, unknown>) => Promise<void>;
    reload?: () => void;
  };
}

// Props que TODO bloco recebe
export interface BlockProps<TConfig = Record<string, unknown>> {
  title?: string;
  subtitle?: string;
  config: TConfig;            // vem de binding.config (tipado por bloco)
  ctx: BlockContext;          // dados + estado + ações, injetados pelo core
}

// Um bloco é só um componente com essa assinatura
export type Block<TConfig = Record<string, unknown>> =
  (props: BlockProps<TConfig>) => JSX.Element;

// Definição registrável (o que o app registra no registry)
export interface BlockDefinition<TConfig = Record<string, unknown>> {
  type: BlockType;                 // "kpi-dashboard", "custom:scudo-students"...
  component: Block<TConfig>;
  // valida o config vindo do manifesto (zod schema) — fail-fast
  configSchema?: unknown;          // ZodSchema<TConfig>
  // como este bloco quer os dados (default; pode ser sobrescrito no manifesto)
  defaultDataShape?: 'collection' | 'doc' | 'raw';
}
```

## 3. O BlockRegistry (inversão de controle — como o core não importa blocos)

```typescript
// packages/core/src/registry/registry.ts
export interface BlockRegistry {
  register(def: BlockDefinition): void;
  resolve(type: BlockType): BlockDefinition | undefined;
}
```

O **app** monta o registry (não o core):

```typescript
// apps/cliente-exemplo/main.tsx  (conceitual)
import { createRegistry, OsApp } from '@os/core';
import { kpiDashboard, dataTable, kanbanBoard, docViewer } from '@os/blocks';
import { clienteExemploManifest } from './manifest';

const registry = createRegistry();
registry.register(kpiDashboard);
registry.register(dataTable);
registry.register(kanbanBoard);
registry.register(docViewer);
// blocos sob medida do próprio app entram aqui também:
// registry.register(meuBlocoCustom);

// <OsApp> recebe manifesto + registry; a base URL da API vem de manifest.dataApi
// (sem segredo — a DATABASE_URL fica no .env server-side do app). O core faz o resto.
render(<OsApp manifest={clienteExemploManifest} registry={registry} />);
```

Resultado: `@os/core` só conhece a **interface** `BlockDefinition`. As implementações vêm de fora (blocks + app). Dependência unidirecional preservada (`apps → blocks → core`).

## 4. O Data-Source Adapter (o padrão central — agora via API do app)

Hoje cada hook do Dobro OS repete: `collection(db, 'x')` + `query`/`where` + `onSnapshot` + um mapper próprio. O adapter genérico transforma isso em **um** mecanismo dirigido por config. **A diferença do novo modelo:** o adapter não fala com um banco no browser — ele fala com a **API do app** por HTTP. Quem fala com a Neon é o backend (doc 05).

### 4.1 O `useOsClient()` agora é um cliente de API (não um `db`)

```typescript
// packages/core/src/data/OsClient.ts  (conceitual)
// Antes: { db: Firestore; auth: Auth }.  Agora: um wrapper de fetch para a API do app.
export interface OsClient {
  // envia o dataSource declarativo ao endpoint de query genérico (doc 05, §4).
  // O cookie de sessão (Better Auth, HttpOnly) vai junto via credentials:'include'.
  query(binding: DataSourceBinding, vars: { period: Period; clientId: string }): Promise<unknown>;
  // rotas custom (kind:'rest')
  rest(url: string, init?: RequestInit): Promise<unknown>;
  // sessão / logout (Better Auth via /api/auth/*)
  getSession(): Promise<Session | null>;
  signOut(): Promise<void>;
}
// baseUrl/queryPath vêm de manifest.dataApi; NENHUM segredo aqui (a DATABASE_URL é server-side).
```

```typescript
// packages/core/src/data/adapter.ts
export interface ResolvedData {
  data: unknown;
  loading: boolean;
  error: string | null;
  actions: BlockContext['actions'];
}

// O core resolve um DataSourceBinding em dados chamando a API do app (via OsClient).
export interface DataAdapter {
  resolve(
    binding: DataSourceBinding,
    ctx: { period: Period; clientId: string; client: OsClient }
  ): ResolvedData;   // hook interno: dispara client.query() e trata loading/error/refetch
}
```

### 4.2 Fluxo em runtime (substituindo `useFirestoreMetrics`/`useBoardTasks`)

```
manifest.binding.dataSource = { kind:'query', view:'v_vendas_kpi',
                                select:['periodo','faturamento'],
                                where:[{field:'periodo', op:'=', value:{ref:'period'}}],
                                orderBy:[{field:'periodo', dir:'desc'}], limit:12,
                                refetch:{ mode:'interval', ms:60000 } }
        │
        ▼  core.DataAdapter.resolve()  (no BROWSER)
1. resolve refs: {ref:'period'} → período atual do shell
2. client.query(binding, vars) → POST /api/query  (cookie de sessão vai junto)
        │
        ▼  BACKEND do app (doc 05, §4) — funções serverless
   a. valida sessão Better Auth  → sem sessão? 401
   b. allowlist: view ∈ permitidas? colunas conhecidas? → não? 403/400
   c. monta SQL PARAMETRIZADO (Drizzle/Kysely, bind params)
   d. @neondatabase/serverless (HTTP) consulta a Neon do cliente
   e. responde { data: rows }
        │
        ▼  de volta no BROWSER
3. aplica mapper (se dataSource.mapper) ou identidade
4. agenda refetch conforme dataSource.refetch (manual/interval) — não há realtime
        │
        ▼
{ data, loading, error, actions:{ reload, updateDoc? } }  → injetado no BlockContext do bloco
```

O bloco recebe exatamente o mesmo `ctx.data` de antes. **Toda a mudança Firestore→Neon acontece dentro do adapter e do backend — invisível para o bloco.**

### Mappers registráveis (para formas de dado não-triviais)

O `firestoreToMetric`/`docToBoardTask` do Dobro OS viram **mappers nomeados** registrados por quem precisa (app ou bloco), referenciados por `dataSource.mapper`. Default é identidade (a linha da view vira `{ ...row }`). Assim o adapter é genérico, mas quando um cliente precisa transformar um `numeric` ou uma data, registra-se um mapper — sem tocar no core. (Boa parte da normalização, porém, pode viver **na própria view SQL** — vantagem do Postgres.)

### Escape hatch honesto

- `kind: 'rest'` → o cliente de API faz `fetch(url)` numa **rota custom do `api/`** do app (cobre Scudo/Curseduca style: lógica própria server-side; o segredo do token da API externa fica no `.env` server-side, nunca no client).
- `kind: 'static'` → dados embutidos no config (para telas sem backend, ex.: "objetivos da semana").
- Se nem isso serve, o app usa um **`custom:` block** que consome uma rota própria da sua `api/`. O manifesto continua sendo a fonte de verdade da navegação.

> **Nota de segurança:** nenhum bloco nem o front montam SQL. O front só envia um `dataSource` declarativo; o backend decide se aquilo é permitido. Uma tela nova = uma **view read-only nova** no Neon + uma linha no manifesto — sem expor tabela crua.

## 5. Exemplo concreto: `KpiDashboardBlock`

Extraído do arquétipo repetido em `YouTubeSection`, `AquisicaoSection`, `NewsletterSection`, etc.

```typescript
// packages/blocks/src/kpi-dashboard/index.ts
import { SectionHeader, KpiCard, EmptyState, SkeletonCards } from '@os/core';
import type { BlockProps, BlockDefinition } from '@os/core';

// Config que ESTE bloco espera (vem de binding.config no manifesto)
export interface KpiDashboardConfig {
  kpis: Array<{
    key: string;          // chave do campo no documento de dados
    label: string;        // rótulo exibido
    unit: 'R$' | '%' | 'x' | 'count';
    target: number;
    tooltip?: string;
  }>;
  columns?: number;       // grid (default 4)
}

function KpiDashboardBlock({ title, subtitle, config, ctx }: BlockProps<KpiDashboardConfig>) {
  const { data, loading, error } = ctx;

  if (loading) {
    return (<div><SectionHeader title={title ?? 'KPIs'} subtitle={subtitle} /><SkeletonCards count={config.kpis.length} /></div>);
  }
  if (error) return (<EmptyState message={`Erro ao carregar: ${error}`} />);

  // 'data' são as linhas resolvidas pelo adapter (ex.: linhas da view v_vendas_kpi).
  // O bloco mapeia cada KPI do config para o valor correspondente nos dados.
  const rows = (data as Record<string, number>[]) ?? [];
  const latest = rows[0] ?? {};

  return (
    <div>
      <SectionHeader title={title ?? 'KPIs'} subtitle={subtitle} />
      <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${config.columns ?? 4}`}>
        {config.kpis.map((k) => (
          <KpiCard
            key={k.key}
            data={{
              id: k.key,
              label: k.label,
              value: latest[k.key] ?? 0,
              target: k.target,
              unit: k.unit,
              previousValue: latest[`${k.key}_prev`],
              tooltip: k.tooltip,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Definição registrável
export const kpiDashboard: BlockDefinition<KpiDashboardConfig> = {
  type: 'kpi-dashboard',
  component: KpiDashboardBlock,
  defaultDataShape: 'collection',
  // configSchema: z.object({ kpis: z.array(...), columns: z.number().optional() }),
};
```

Note o que **desapareceu** em relação ao `YouTubeSection` original: sem `useYouTubeData()`, sem coleção hardcoded, sem "@devemdobro", sem `USE_MOCK_DATA`. O mesmo componente serve YouTube do Dobro, vendas do Cliente Exemplo, ou qualquer grade de KPI — a diferença é 100% config + dataSource.

## 6. Regras do contrato (inegociáveis)

1. **Bloco não fala com banco nem com SDK de dados.** Recebe dados via `ctx`; nunca importa driver de banco, nunca monta query, nunca vê a connection string. (Isso garante multi-tenant e segurança: o backend do cliente certo é quem consulta a Neon, e o segredo fica server-side.)
2. **Bloco não tem texto de negócio hardcoded.** Título/subtítulo vêm de props; rótulos vêm de config.
3. **Bloco não conhece nome de tabela/view.** O core envia o `dataSource` ao `/api/query`; o backend resolve.
4. **Config é validado** (zod) no load do manifesto — erro de config falha cedo e claro.
5. **Escape hatch é explícito** (`custom:` block consumindo uma rota própria do `api/`), nunca por gambiarra dentro de um bloco genérico.
6. **Nenhum SQL no front.** O front só envia um `dataSource` declarativo; quem valida (allowlist) e monta SQL parametrizado é o backend.
```
