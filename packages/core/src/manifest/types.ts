/**
 * @os/core — Tipos do `ClientManifest`.
 *
 * O coração do design (doc 02): um cliente = um manifesto. O core lê o manifesto
 * e renderiza tudo (marca, navegação, telas, bindings de dados). Substitui o
 * `App.tsx` hardcoded por DADOS.
 *
 * Revisado (2026-07-12): Firebase → NeonDB. O bloco de dados vira `dataApi` (só
 * a base URL da API do app — a connection string da Neon NÃO vai no manifesto,
 * fica no `.env` server-side). O `DataSourceBinding` usa
 * `kind: 'query' | 'rest' | 'static'` (nunca `firestore`).
 *
 * Reaproveita `Theme` (theme/types.ts) e `Period` (ui/types.ts) do próprio core.
 */

import type { Theme } from '../theme/types';
import type { Period } from '../ui/types';

// ============================================================
// Identidade / Marca
// ============================================================

export interface ManifestIdentity {
  /** Slug único do cliente, ex.: "cliente-exemplo". */
  clientId: string;
  /** Nome de exibição, ex.: "Cliente Exemplo". */
  displayName: string;
  /** Wordmark exibido no shell, ex.: "EXEMPLO" (+ badge "OS"). */
  productName: string;
  /** Caminho do logo (por app), ex.: "/logo.webp". */
  logoUrl: string;
  /**
   * Tema/cores da marca. Reaproveita o contrato `Theme` do core: o
   * `ThemeProvider` injeta esses valores como CSS custom properties, e todo
   * utility `blue-*` do design system herda a cor do cliente.
   */
  theme: Theme;
}

// ============================================================
// Data API (um backend serverless por cliente)
// ============================================================

export interface ManifestDataApi {
  /**
   * Base URL da API do próprio app (funções serverless que falam com a Neon).
   * NÃO é segredo: pode ir para o bundle. A connection string (DATABASE_URL)
   * vive SÓ no `.env` server-side das funções, nunca aqui (ver doc 05).
   * Ex.: "" (mesma origem, /api/*) ou "https://cliente-x.vercel.app".
   */
  baseUrl: string;
  /** Caminho do endpoint de query genérico. Default: "/api/query". */
  queryPath?: string;
  /** Caminho base de auth (Better Auth). Default: "/api/auth". */
  authPath?: string;
}

// ============================================================
// Navegação
// ============================================================

export interface ManifestNavigation {
  /** Para onde "/" redireciona, ex.: "/kpis/vendas". */
  redirectRoot: string;
  /** Menu principal (topbar). */
  menus: MenuItem[];
}

export interface MenuItem {
  /** Slug do menu, ex.: "kpis". */
  key: string;
  /** Rótulo exibido, ex.: "Dashboard de KPIs". */
  label: string;
  /** Nome de ícone lucide, ex.: "LayoutDashboard". */
  icon: IconName;
  /** Rota base, ex.: "/kpis". */
  route: string;
  /** Se folha (sem sub-abas): o bloco renderizado diretamente. */
  view?: BlockBinding;
  /** Se grupo (com sub-abas): sidebar de sub-abas. */
  tabs?: SubTab[];
  /** Se `true`, some da navegação (pills, sidebar e rotas). Reversível — para
   *  ocultar uma seção temporariamente sem apagar sua config. */
  hidden?: boolean;
  /**
   * Copiloto de IA flutuante ancorado a ESTA seção (FAB estilo WhatsApp). Quando
   * presente, o `ManifestRouter` renderiza um `<FloatingAgent>` genérico enquanto
   * o menu está ativo. Config-driven: a PERSONA/prompt do agente NÃO fica aqui
   * (vive server-side, registrada por `contextKey` no backend) — o manifesto só
   * declara o que é seguro expor ao browser (título, campos, sugestões).
   */
  assistant?: AssistantConfig;
}

/** Um campo opcional que o usuário informa ao copiloto (ex.: faturamento). */
export interface AssistantInput {
  /** Chave enviada ao backend, ex.: "receitaMensal". */
  key: string;
  /** Rótulo exibido. */
  label: string;
  /** Placeholder do campo. */
  placeholder?: string;
  /** Dica curta ao lado do rótulo (ex.: "opcional — libera a leitura de margem"). */
  hint?: string;
  /**
   * Procedência do dado (opcional): de onde ele vem quando NÃO é digitado à mão.
   * Ex.: "vem do Faturamento (Hotmart) se conectada". Renderizado como uma nota
   * de origem, para o usuário entender por que/quando o campo é usado.
   */
  source?: string;
}

/**
 * Configuração de um copiloto flutuante (assistente de IA de uma seção).
 * Só contém o que pode ir ao browser — a persona/prompt e o acesso a dados vivem
 * no backend, referenciados por `contextKey` (ver `@os/server` → `mountAssistant`).
 */
export interface AssistantConfig {
  /** Chave do provedor de contexto registrado no backend, ex.: "financas". */
  contextKey: string;
  /** Título no cabeçalho do painel, ex.: "Analista financeiro". */
  title: string;
  /** Subtítulo curto sob o título. */
  subtitle?: string;
  /** Ícone lucide do FAB (default: "Sparkles"). */
  icon?: IconName;
  /** Sugestões de pergunta iniciais no chat. */
  starters?: string[];
  /** Campos opcionais que o usuário informa (persistidos localmente, enviados ao backend). */
  inputs?: AssistantInput[];
  /**
   * Rótulo do botão que dispara a ANÁLISE pesada (diagnóstico) sob demanda.
   * O balão abre leve (só saudação + sugestões); a análise só roda quando o
   * usuário clica neste botão. Default: "📊 Diagnóstico completo".
   */
  analyzeLabel?: string;
}

export interface SubTab {
  /** Slug da aba, ex.: "vendas". */
  id: string;
  /** Rótulo exibido, ex.: "Vendas". */
  label: string;
  /** Nome de ícone lucide. */
  icon: IconName;
  /** O bloco desta aba. */
  view: BlockBinding;
}

// ============================================================
// Binding: menu/aba → bloco + config + fonte de dados
// ============================================================

export interface BlockBinding {
  /** Qual bloco do registry, ex.: "kpi-dashboard". */
  block: BlockType;
  /** Título exibido no SectionHeader (opcional). */
  title?: string;
  /** Subtítulo exibido no SectionHeader (opcional). */
  subtitle?: string;
  /** Config específica do bloco (tipada por bloco no lado do bloco). */
  config: Record<string, unknown>;
  /** De onde vêm os dados (opcional: telas puramente estáticas de config). */
  dataSource?: DataSourceBinding;
  /**
   * Ajuda da seção (opcional): uma breve descrição de "como funciona" + um
   * tutorial passo-a-passo (abre num modal ao clicar "Ver tutorial"). Renderizado
   * genericamente pelo ManifestRouter acima do bloco — serve para orientar o
   * operador/cliente a cadastrar os dados e configurar. Config-driven (por cliente).
   */
  help?: SectionHelp;
}

/** Ajuda de uma seção: descrição curta + tutorial opcional (config no manifesto). */
export interface SectionHelp {
  /** Descrição curta de como a seção funciona (1-2 frases). */
  description?: string;
  /** Tutorial passo-a-passo, exibido num modal ao clicar "Ver tutorial". */
  tutorial?: {
    /** Título do modal (default: "Como usar esta seção"). */
    title?: string;
    /** Passos (cada item = um passo; markdown simples/texto). */
    steps: string[];
  };
}

// ============================================================
// DataSource: como o bloco se liga a dados (sem hardcode)
// ============================================================

/**
 * `kind`:
 * - `query`  → resolvido pelo endpoint genérico `/api/query` no backend
 *              (doc 05, §4). Declarativo e SEGURO: referencia uma VIEW read-only
 *              da allowlist, colunas conhecidas, SQL montado com bind params.
 * - `rest`   → o cliente de API faz fetch em uma rota custom do app.
 * - `static` → dados embutidos no binding (telas sem backend).
 */
export interface DataSourceBinding {
  kind: 'query' | 'rest' | 'static';

  // ---- kind: 'query' (o caso principal — Postgres via backend) ----
  /** VIEW read-only da allowlist, ex.: "v_vendas_kpi". */
  view?: string;
  /** Alternativa: tabela permitida (se a allowlist a expuser). */
  table?: string;
  /** Colunas a retornar; DEVEM ser colunas conhecidas da view. */
  select?: string[];
  /** Filtros declarativos → viram bind params ($1, $2...). */
  where?: FilterClause[];
  /** Ordenação declarativa. */
  orderBy?: OrderByClause[];
  /** Teto de linhas aplicado no backend (ex.: máx. 1000). */
  limit?: number;
  /** Agregações declarativas simples (também podem vir prontas da view). */
  aggregate?: AggregateClause[];
  /** Colunas de agrupamento (para as agregações). */
  groupBy?: string[];

  // ---- kind: 'rest' ----
  /** Rota custom do app, ex.: "/api/scudo/students". */
  url?: string;

  // ---- kind: 'static' ----
  /**
   * Dados embutidos no binding, retornados como estão pelo DataAdapter.
   * Presente apenas para `kind: 'static'`. O bloco recebe isto via `ctx.data`.
   */
  data?: unknown;

  /**
   * Atualização (não há realtime nativo no Postgres — ver doc 05, §8).
   * Default: `{ mode: 'manual' }`.
   */
  refetch?: RefetchPolicy;

  /** Nome de um transformador registrado (opcional; default = identidade). */
  mapper?: string;
}

export interface OrderByClause {
  field: string;
  dir: 'asc' | 'desc';
}

export interface AggregateClause {
  fn: 'sum' | 'count' | 'avg' | 'min' | 'max';
  field: string;
  as: string;
}

export interface RefetchPolicy {
  mode: 'manual' | 'interval';
  /** Intervalo em ms quando `mode === 'interval'`. */
  ms?: number;
}

/** Conjunto FECHADO de operadores (validado no backend; nunca concatenado em SQL). */
export type FilterOp = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'like';

/**
 * Referência a estado do shell resolvida em runtime → vira bind param no backend.
 * Ex.: `{ ref: 'period' }` resolve para o período atual do shell.
 */
export interface FilterRef {
  ref: 'period' | 'clientId' | (string & {});
}

export interface FilterClause {
  /** DEVE ser coluna conhecida da view (validado no backend). */
  field: string;
  op: FilterOp;
  /** Valor SEMPRE vira bind param: literal OU ref a estado do shell. */
  value: unknown | FilterRef;
}

// ============================================================
// Settings globais
// ============================================================

export interface ManifestAuthSettings {
  /**
   * Auth é OBRIGATÓRIA em produção (Better Auth self-hosted).
   * `enabled: false` só para demo local.
   */
  enabled: boolean;
  provider: 'better-auth';
  allowedDomains?: string[];
}

export interface ManifestPeriodSettings {
  enabled: boolean;
  /** Período default do shell. Reaproveita o tipo `Period` do core. */
  default: Period;
  /** Opções oferecidas ao usuário (subconjunto de Period). */
  options?: Period[];
}

export interface ManifestSettings {
  auth: ManifestAuthSettings;
  period?: ManifestPeriodSettings;
  footerText?: string;
}

// ============================================================
// O manifesto completo
// ============================================================

export interface ClientManifest {
  /** Versão do schema (para migração futura). Fixa em 1 nesta fase. */
  version: 1;
  identity: ManifestIdentity;
  /** Base URL da API do app (sem segredo). */
  dataApi: ManifestDataApi;
  navigation: ManifestNavigation;
  settings: ManifestSettings;
}

// ============================================================
// Tipos auxiliares (nomes fechados para validação)
// ============================================================

/**
 * Blocos conhecidos do catálogo + válvula de escape `custom:${string}` para
 * blocos sob medida do app (ex.: "custom:scudo-students").
 */
export type BlockType =
  | 'kpi-dashboard'
  | 'data-table'
  | 'kanban-board'
  | 'funnel'
  | 'timeline'
  | 'doc-viewer'
  | 'metric-comparison'
  // Blocos "console" (gerenciam estado próprio + falam com o backend da fábrica @os/server)
  | 'settings-panel'
  | 'lead-console'
  | 'invoice-console'
  | 'hotmart-console'
  | 'agent-gallery'
  | 'finance-overview'
  | `custom:${string}`;

/** Nome de ícone do set do lucide-react (validado contra o set em runtime pelo app). */
export type IconName = string;

/** Nome de um token de tema (para overrides finos). */
export type ThemeTokenName = string;
