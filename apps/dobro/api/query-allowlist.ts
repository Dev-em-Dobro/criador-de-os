/**
 * apps/dobro — ALLOWLIST de views para o endpoint /api/query (doc 05, §4, Defesa 2).
 *
 * O manifesto NUNCA referencia tabela crua. Só referencia uma VIEW read-only
 * `v_*` explicitamente listada aqui, com o conjunto FECHADO de colunas conhecidas.
 * View fora da lista → 403; coluna fora da lista da view → 400.
 *
 * Isto é a fonte de verdade em código do que o endpoint aceita. Reforçado no
 * banco pelo GRANT (o role da API lê só as views, nunca as tabelas base).
 */

/** Uma entrada de allowlist: o nome da view + as colunas que ela expõe. */
export interface AllowedView {
  /** Nome exato da view no Postgres (DEVE começar com `v_`). */
  view: string;
  /** Conjunto FECHADO de colunas consultáveis (select/where/orderBy). */
  columns: readonly string[];
}

/**
 * Registro fechado das views permitidas. Uma tela nova = uma view read-only
 * nova aqui + no banco. Tabelas cruas (`user`, `metricas_visao_geral`) NUNCA
 * entram nesta lista.
 */
const ALLOWED_VIEWS: Record<string, AllowedView> = {
  v_visao_geral: {
    view: 'v_visao_geral',
    columns: [
      'receita',
      'receita_prev',
      'conversao',
      'conversao_prev',
      'roas',
      'roas_prev',
      'leads',
      'leads_prev',
      'period',
    ],
  },
};

/** Retorna a entrada de allowlist para uma view, ou `undefined` se não permitida. */
export function getAllowedView(name: string | undefined): AllowedView | undefined {
  if (!name) return undefined;
  return ALLOWED_VIEWS[name];
}

/** True se `column` é uma coluna conhecida da view (validação de identificador). */
export function isKnownColumn(view: AllowedView, column: string): boolean {
  return view.columns.includes(column);
}
