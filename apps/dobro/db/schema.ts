/**
 * apps/dobro — Schema Drizzle (schema-as-code) do Neon do cliente "dobro".
 *
 * Duas famílias de tabelas:
 *  1) Better Auth (user/session/account/verification) — colunas conforme o
 *     core schema do Better Auth (doc 05, §5). O Drizzle adapter mapeia por
 *     nome de tabela/coluna, então os nomes têm de bater com o esperado.
 *  2) Negócio (metricas_visao_geral) — tabela de EXEMPLO desta fase, com as
 *     colunas usadas no manifesto (receita/conversao/roas/leads + *_prev).
 *
 * A VIEW read-only `v_visao_geral` (o contrato de exposição, doc 05, §4) é
 * criada por SQL puro em `db/views.sql` (Drizzle não modela views), e é a ÚNICA
 * coisa que o endpoint /api/query aceita ler — nunca a tabela crua.
 */

import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// ============================================================
// Better Auth — tabelas de autenticação
// (nomes/colunas conforme o core schema do Better Auth 1.6.x)
// ============================================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
});

// ============================================================
// Negócio — tabela de EXEMPLO desta fase
// ============================================================

/**
 * Métricas da tela "Visão geral". Colunas espelham exatamente o que o manifesto
 * consome (cada KPI + seu `*_prev` para a variação percentual dos cards).
 * A API NUNCA lê esta tabela direto — só a view `v_visao_geral` (allowlist).
 */
export const metricasVisaoGeral = pgTable('metricas_visao_geral', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  receita: doublePrecision('receita').notNull(),
  receitaPrev: doublePrecision('receita_prev').notNull(),
  conversao: doublePrecision('conversao').notNull(),
  conversaoPrev: doublePrecision('conversao_prev').notNull(),
  roas: doublePrecision('roas').notNull(),
  roasPrev: doublePrecision('roas_prev').notNull(),
  leads: integer('leads').notNull(),
  leadsPrev: integer('leads_prev').notNull(),
  /** Período de agregação: 'weekly' | 'monthly' | 'quarterly' (bate com Period do core). */
  period: text('period').notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// ============================================================
// Conteúdo / Social — pipeline de posts do Instagram (Fatia 1)
// ============================================================

/**
 * Referências capturadas de um canal (ex.: Telegram): um conteúdo que foi bem e
 * serve de inspiração. A ingestão (webhook) grava aqui; o pipeline analisa "por
 * que foi bem" e gera um rascunho em `conteudo_posts`. A API NUNCA lê esta
 * tabela direto — quando exposta, será por uma view read-only na allowlist.
 */
export const referencias = pgTable('referencias', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Canal de origem: 'telegram' | 'whatsapp' | 'manual'. */
  canal: text('canal').notNull(),
  /** URL de origem (ex.: link do post no Instagram). */
  origemUrl: text('origem_url'),
  /** Tipo do conteúdo capturado: 'link' | 'imagem' | 'texto'. */
  tipo: text('tipo').notNull().default('link'),
  /** Formato da referência: 'carrossel' | 'reels' | null (a detectar). */
  formatoRef: text('formato_ref'),
  /** Conteúdo bruto capturado (legenda/texto). */
  conteudoBruto: text('conteudo_bruto'),
  /** Observação de quem mandou a referência (sinal valioso). */
  notaTime: text('nota_time'),
  /** URL da capa/thumbnail da referência. */
  capaUrl: text('capa_url'),
  /** Métricas da referência no momento da captura (json livre). */
  metricasRef: jsonb('metricas_ref'),
  /** Teardown: por que o conteúdo foi bem (preenchido pelo pipeline). */
  analise: text('analise'),
  /** Estado de processamento: 'pendente' | 'processada'. */
  status: text('status').notNull().default('pendente'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

/**
 * Perfis de referência (os @ que a gente acompanha no Instagram) — a CURADORIA.
 *
 * A maioria dos perfis não precisa estar aqui: quem já mandou referência aparece
 * sozinho na tela, porque o autor de cada captura fica em `referencias.metricas_ref`
 * e a view `v_referencias_perfis` agrega por autor. Esta tabela existe para as
 * duas coisas que a captura não dá:
 *   · perfil que a gente quer seguir SEM ter mandado post dele ainda;
 *   · anotação humana sobre um perfil (nome de verdade, por que vale seguir).
 *
 * Chave é o `handle` normalizado (minúsculo, sem "@"). A API NUNCA lê esta tabela
 * direto — só a view read-only da allowlist.
 */
export const referenciaPerfis = pgTable('referencia_perfis', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** @ do Instagram, normalizado: minúsculo e sem "@" (ex.: 'nick_saraev'). */
  handle: text('handle').notNull().unique(),
  /** Nome da pessoa/marca, quando conhecido (só o que foi confirmado). */
  nome: text('nome'),
  /** Por que este perfil vale a pena (anotação de quem adicionou). */
  nota: text('nota'),
  /** Como entrou: 'manual' (alguém adicionou) | 'captura' (veio de referência). */
  origem: text('origem').notNull().default('manual'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

/**
 * Posts de conteúdo (Instagram) exibidos no board "Conteúdo". Cada linha é um
 * card: título, capa, data programada, CTA, link do presente e estado. A view
 * read-only `v_conteudo_posts` (allowlist) é a ÚNICA forma da API ler isto.
 */
export const conteudoPosts = pgTable('conteudo_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Referência que originou este rascunho (null se criado à mão). */
  referenciaId: uuid('referencia_id').references(() => referencias.id, {
    onDelete: 'set null',
  }),
  titulo: text('titulo').notNull(),
  /** URL da imagem de capa do post. */
  capaUrl: text('capa_url'),
  /** Data/hora programada de publicação. */
  dataProgramada: timestamp('data_programada'),
  /** Frase final de CTA. */
  ctaFinal: text('cta_final'),
  /** Link do presente entregue (ex.: página no Notion). */
  linkPresenteNotion: text('link_presente_notion'),
  /** Briefing (planejamento) — link do Notion da postagem. */
  briefingUrl: text('briefing_url'),
  /** Briefing (planejamento) — texto do briefing (alternativa/complemento ao link). */
  briefing: text('briefing'),
  /** Briefing (planejamento) — links de referência, um por linha. */
  refsLinks: text('refs_links'),
  /** Estado no board: 'rascunho' | 'pronto' | 'publicado'. */
  estado: text('estado').notNull().default('rascunho'),
  /** Plataforma: 'instagram' (multi-plataforma no futuro). */
  plataforma: text('plataforma').notNull().default('instagram'),
  /** Formato: 'carrossel' | 'reels'. */
  formato: text('formato').notNull().default('carrossel'),
  /** Gancho aprovado. */
  gancho: text('gancho'),
  /** Pauta/roteiro em AIDA (texto). */
  pauta: text('pauta'),
  /** Legenda (caption) do post. */
  legenda: text('legenda'),
  /** Hashtags. */
  hashtags: text('hashtags'),
  /** Estrutura por formato: slides (carrossel) ou cenas (reels). */
  roteiro: jsonb('roteiro'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

/**
 * Desempenho por conteúdo publicado (Instagram) — a "aba Instagram" da planilha
 * de acompanhamento, dentro do OS. Cada linha é UM post medido: os números crus
 * que hoje a criadora digita na mão (alcance, salvamentos, compartilhamentos…).
 *
 * As TAXAS (curtidas/alcance, retenção…) e a CLASSIFICAÇÃO (Forte/Saudável/
 * Abaixo) NÃO ficam aqui: são derivadas — calculadas na tela a partir destes
 * valores + os benchmarks do manifesto. Guardamos só o sinal cru (Fase 0,
 * entrada manual). Fase 1 preenche estes mesmos campos automaticamente via o
 * token de Insights do Instagram — sem mudar o schema.
 *
 * `permalink`/`media_id` já existem (nullable) para, no futuro, casar a linha
 * com o post real e sincronizar. A view read-only `v_conteudo_desempenho`
 * (allowlist) é a ÚNICA forma da API ler isto.
 */
export const conteudoDesempenho = pgTable('conteudo_desempenho', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Card do cronograma que originou este post (null se medido avulso). */
  postId: uuid('post_id').references(() => conteudoPosts.id, {
    onDelete: 'set null',
  }),
  /** Data de publicação do conteúdo. */
  data: timestamp('data'),
  /** Formato: 'reel' | 'carrossel' | 'post' | 'story'. */
  formato: text('formato').notNull().default('reel'),
  /** Tema/descrição curta do conteúdo (da legenda ou digitado). */
  tema: text('tema'),
  /** Alcance (contas alcançadas) — base das taxas. */
  alcance: integer('alcance'),
  /** Visualizações/plays. */
  visualizacoes: integer('visualizacoes'),
  curtidas: integer('curtidas'),
  comentarios: integer('comentarios'),
  compartilhamentos: integer('compartilhamentos'),
  salvamentos: integer('salvamentos'),
  /** Visitas ao perfil vindas do post. */
  visitasPerfil: integer('visitas_perfil'),
  /** Seguidores ganhos a partir do post. */
  seguidores: integer('seguidores'),
  /** Duração do vídeo em segundos (reels/vídeo). */
  duracaoS: integer('duracao_s'),
  /** Tempo médio assistido em segundos (reels) — base da retenção. */
  tempoMedioS: doublePrecision('tempo_medio_s'),
  /** Permalink do post real (p/ Fase 1 — sync via Insights). */
  permalink: text('permalink'),
  /** ID da mídia no Instagram (p/ Fase 1 — sync via Insights). */
  mediaId: text('media_id'),
  /**
   * Estrutura narrativa do carrossel, classificada por IA (offline). Um de:
   * listicle | tutorial | contrarian | storytelling | noticia | pergunta |
   * venda | conceito | ferramenta. Nullable até a classificação rodar.
   */
  estrutura: text('estrutura'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

/**
 * PREVISÃO da IA por post ("Placar da IA", metade PREVISTO) — o mesmo conteúdo
 * que já aparecia no `briefing` em texto, agora como DADO consultável.
 *
 * Por que tabela separada e não colunas em `conteudo_posts`: um card pode ser
 * previsto MAIS DE UMA VEZ (no rascunho e de novo depois de editado, antes de
 * publicar). Cada previsão é uma linha; `registrada_em` ordena, e a última antes
 * da publicação é a que vale para o placar. Colunas no card só guardariam a
 * primeira ou sobrescreveriam o histórico, que é justamente o que mede se a IA
 * melhorou.
 *
 * As taxas ficam em % (1.2 = 1,2%), do mesmo jeito que o modelo prevê. A CLASSE
 * já vem derivada pela régua de `server/conteudo-previsao.ts` — a mesma da tela
 * de desempenho, para que previsto e real sejam comparáveis.
 *
 * A view read-only `v_conteudo_previsoes` (allowlist) é a ÚNICA forma da API ler.
 */
export const conteudoPrevisoes = pgTable('conteudo_previsoes', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Card previsto. CASCADE: previsão sem card não significa nada. */
  postId: uuid('post_id')
    .references(() => conteudoPosts.id, { onDelete: 'cascade' })
    .notNull(),
  /** Classe esperada, derivada das taxas: 'forte' | 'saudavel' | 'abaixo' | 'na'. */
  classe: text('classe').notNull(),
  /** Confiança da IA na própria previsão: 'alta' | 'media' | 'baixa'. */
  confianca: text('confianca').notNull(),
  /** Taxa prevista de salvamentos sobre alcance, EM % (1.2 = 1,2%). */
  taxaSalvamentosPct: doublePrecision('taxa_salvamentos_pct'),
  /** Taxa prevista de compartilhamentos sobre alcance, EM %. */
  taxaCompartilhamentosPct: doublePrecision('taxa_compartilhamentos_pct'),
  /** Retenção prevista em % (só reels; null em carrossel). */
  retencaoPct: doublePrecision('retencao_pct'),
  /** Sub-classes por métrica, para comparar métrica a métrica com o real. */
  classeSalvamentos: text('classe_salvamentos'),
  classeCompartilhamentos: text('classe_compartilhamentos'),
  classeRetencao: text('classe_retencao'),
  /** A métrica em que a IA apostou, e por causa de qual elemento do post. */
  apostaPrincipal: text('aposta_principal'),
  /** O que pode derrubar o post (array de strings). */
  riscos: jsonb('riscos'),
  /** Nota do sistema "Fura a Bolha": total 0-25 e as 5 notas. */
  furaTotal: integer('fura_total'),
  furaNotas: jsonb('fura_notas'),
  furaJustificativa: text('fura_justificativa'),
  /** Veredito em duas frases. */
  resumo: text('resumo'),
  /** Modelo que fez a previsão (a acurácia é por modelo). */
  modelo: text('modelo'),
  /** Quando a previsão foi registrada — sempre ANTES de publicar. */
  registradaEm: timestamp('registrada_em').notNull(),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
});
