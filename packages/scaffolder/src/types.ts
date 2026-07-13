/**
 * @os/scaffolder — modelo de "respostas" (o input do gerador).
 *
 * O wizard interativo e o modo `--config <arquivo.json>` produzem AMBOS um
 * `ClientAnswers`. O gerador só conhece este formato — nunca lê o terminal.
 */

/** Blocos do catálogo genérico que o wizard oferece (subconjunto de BlockType do core). */
export type BlockKind =
  | 'kpi-dashboard'
  | 'data-table'
  | 'kanban-board'
  | 'metric-comparison'
  | 'doc-viewer';

/**
 * Preset de geração:
 * - `static`: só front, sem `api/`+`db/`, auth desligada, dados de exemplo
 *   embutidos. Roda com `pnpm dev` SEM Neon. Ideal para protótipo/aprovação.
 * - `full`: front + backend Hono (`api/`) + Drizzle/Neon (`db/`) + Better Auth.
 *   Menus `kpi-dashboard` já vêm ligados a `/api/query` (view read-only). Precisa
 *   de `.env` (DATABASE_URL) + migrations para rodar com dados reais.
 */
export type Preset = 'static' | 'full';

export type Period = 'weekly' | 'monthly' | 'quarterly';

export interface ThemeAnswers {
  /** Cor primária da marca (hex #rrggbb). As variações são derivadas dela. */
  brand: string;
  /** Verde de sinal/positivo (hex). Default #22c55e. */
  signal?: string;
}

export interface MenuAnswer {
  /** Slug do menu (kebab). Deriva a rota `/key`, a view `v_key` e a tabela. */
  key: string;
  /** Rótulo exibido no topo. */
  label: string;
  /** Qual bloco do catálogo renderiza este menu. */
  block: BlockKind;
  /** Ícone lucide (opcional; default por bloco). */
  icon?: string;
  /** Título do SectionHeader (opcional; default = label). */
  title?: string;
  /** Subtítulo do SectionHeader (opcional). */
  subtitle?: string;
}

export interface ClientAnswers {
  /** Slug do cliente (kebab). Vira a pasta `apps/<slug>` e o `identity.clientId`. */
  slug: string;
  /** Nome de exibição, ex.: "Cliente Exemplo". */
  displayName: string;
  /** Nome do produto no shell. Default: `${displayName} OS`. */
  productName?: string;
  /** Cores da marca. */
  theme: ThemeAnswers;
  /** Preset de geração (static | full). Default: full. */
  preset: Preset;
  /** Autenticação obrigatória (Better Auth). No preset `static` é ignorada (fica false). */
  auth: boolean;
  /** Domínio de e-mail permitido (opcional; vira settings.auth.allowedDomains). */
  allowedDomain?: string;
  /** Filtro de período do shell. */
  period: { enabled: boolean; default: Period; options: Period[] };
  /** Menus do OS (>= 1). */
  menus: MenuAnswer[];
  /** Texto do rodapé (opcional). */
  footerText?: string;
}
