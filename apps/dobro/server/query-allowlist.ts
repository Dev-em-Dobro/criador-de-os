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
  v_conteudo_posts: {
    view: 'v_conteudo_posts',
    columns: [
      'id',
      'titulo',
      'capa_url',
      'data_programada',
      'cta_final',
      'link_presente_notion',
      'briefing_url',
      'briefing',
      'refs_links',
      'estado',
      'formato',
      'gancho',
      'pauta',
      'legenda',
      'hashtags',
      'roteiro',
    ],
  },
  v_referencias_perfis: {
    view: 'v_referencias_perfis',
    columns: [
      'handle',
      'perfil_url',
      'nome',
      'nota',
      'refs',
      'carrosseis',
      'reels',
      'media_curtidas',
      'media_comentarios',
      'ultima_ref',
      'ultima_url',
    ],
  },
  v_conteudo_desempenho: {
    view: 'v_conteudo_desempenho',
    columns: [
      'id',
      'post_id',
      'data',
      'formato',
      'tema',
      'alcance',
      'visualizacoes',
      'curtidas',
      'comentarios',
      'compartilhamentos',
      'salvamentos',
      'visitas_perfil',
      'seguidores',
      'duracao_s',
      'tempo_medio_s',
      'permalink',
      'estrutura',
    ],
  },
  v_conteudo_previsoes: {
    view: 'v_conteudo_previsoes',
    columns: [
      'id',
      'post_id',
      'classe',
      'confianca',
      'taxa_salvamentos_pct',
      'taxa_compartilhamentos_pct',
      'retencao_pct',
      'classe_salvamentos',
      'classe_compartilhamentos',
      'classe_retencao',
      'aposta_principal',
      'riscos',
      'fura_total',
      'fura_notas',
      'fura_justificativa',
      'resumo',
      'modelo',
      'registrada_em',
    ],
  },
  v_conteudo_placar: {
    view: 'v_conteudo_placar',
    columns: [
      'post_id',
      'titulo',
      'estado',
      'formato',
      'classe_prevista',
      'confianca',
      'prev_salvamentos_pct',
      'prev_compartilhamentos_pct',
      'prev_retencao_pct',
      'fura_total',
      'aposta_principal',
      'resumo',
      'modelo',
      'registrada_em',
      'publicado_em',
      'alcance',
      'visualizacoes',
      'curtidas',
      'comentarios',
      'compartilhamentos',
      'salvamentos',
      'visitas_perfil',
      'seguidores',
      'duracao_s',
      'tempo_medio_s',
      'permalink',
      'estrutura',
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
