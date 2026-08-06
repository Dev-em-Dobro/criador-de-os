-- apps/dobro — VIEWS read-only (o CONTRATO DE EXPOSIÇÃO, doc 05, §4).
--
-- A allowlist do endpoint /api/query só aceita VIEWS `v_*` explicitamente
-- permitidas. Uma view É "o que o operador pode ver": expõe SÓ as colunas
-- necessárias, já filtradas/agregadas. A API nunca lê a tabela crua.
--
-- Este arquivo é idempotente (CREATE OR REPLACE) e aplicado depois das
-- migrations do Drizzle por `db/migrate.ts`.

-- v_visao_geral: expõe as métricas da tela "Visão geral".
-- Só as colunas que o manifesto consome — a coluna interna `id`/`updated_at`
-- da tabela base NÃO são expostas (contrato mínimo).
CREATE OR REPLACE VIEW v_visao_geral AS
SELECT
  receita,
  receita_prev,
  conversao,
  conversao_prev,
  roas,
  roas_prev,
  leads,
  leads_prev,
  period
FROM metricas_visao_geral;

-- v_conteudo_posts: expõe os cards do board "Conteúdo" (Instagram) por estado.
-- Só as colunas que o card consome; `id` vira text para servir de key estável no
-- front. As colunas internas (referencia_id, gancho, pauta, roteiro, timestamps)
-- NÃO são expostas — contrato mínimo, igual à v_visao_geral.
-- Colunas novas (briefing_*) vão no FINAL: CREATE OR REPLACE VIEW no Postgres só
-- permite ACRESCENTAR colunas ao fim da lista existente, nunca inserir no meio.
CREATE OR REPLACE VIEW v_conteudo_posts AS
SELECT
  id::text AS id,
  titulo,
  capa_url,
  data_programada,
  cta_final,
  link_presente_notion,
  estado,
  formato,
  briefing_url,
  briefing,
  refs_links,
  gancho,
  pauta,
  legenda,
  hashtags,
  roteiro
FROM conteudo_posts;

-- v_referencias_perfis: expõe os PERFIS de referência (a tela "Referências").
-- Uma linha por @ do Instagram, vindo de DUAS origens unidas:
--   · quem já mandou referência — o autor de cada captura vive em
--     `referencias.metricas_ref->>'autor'`, então o perfil aparece sozinho e a
--     lista se alimenta a cada nova referência do Telegram;
--   · a curadoria manual (`referencia_perfis`) — perfil que a gente quer seguir
--     mesmo sem post capturado, mais o nome/nota escritos por gente.
-- Os números (quantas referências, curtidas/comentários médios) descrevem os
-- posts DAQUELE autor que a gente salvou — é o sinal de quem rende, não uma
-- métrica do perfil dele. FULL OUTER JOIN: perfil sem captura e captura sem
-- curadoria, os dois aparecem.
CREATE OR REPLACE VIEW v_referencias_perfis AS
WITH capturas AS (
  SELECT
    lower(trim(BOTH '@' FROM trim(metricas_ref ->> 'autor'))) AS handle,
    formato_ref,
    origem_url,
    created_at,
    NULLIF(metricas_ref ->> 'likes', '')::numeric    AS likes,
    NULLIF(metricas_ref ->> 'comments', '')::numeric AS comentarios
  FROM referencias
  WHERE NULLIF(trim(COALESCE(metricas_ref ->> 'autor', '')), '') IS NOT NULL
),
agregado AS (
  SELECT
    handle,
    count(*)::int                                                   AS refs,
    count(*) FILTER (WHERE formato_ref = 'carrossel')::int           AS carrosseis,
    count(*) FILTER (WHERE formato_ref = 'reels')::int               AS reels,
    round(avg(likes))::int                                           AS media_curtidas,
    round(avg(comentarios))::int                                     AS media_comentarios,
    max(created_at)                                                  AS ultima_ref,
    (array_agg(origem_url ORDER BY created_at DESC))[1]              AS ultima_url
  FROM capturas
  GROUP BY handle
)
SELECT
  COALESCE(a.handle, lower(p.handle))                                AS handle,
  'https://www.instagram.com/' || COALESCE(a.handle, lower(p.handle)) || '/' AS perfil_url,
  p.nome,
  p.nota,
  COALESCE(a.refs, 0)                                                AS refs,
  COALESCE(a.carrosseis, 0)                                          AS carrosseis,
  COALESCE(a.reels, 0)                                               AS reels,
  a.media_curtidas,
  a.media_comentarios,
  a.ultima_ref,
  a.ultima_url
FROM agregado a
FULL OUTER JOIN referencia_perfis p ON lower(p.handle) = a.handle;

-- v_conteudo_desempenho: expõe os números crus de cada post medido (a "aba
-- Instagram" da planilha, dentro do OS). Passthrough magro: SÓ os valores de
-- entrada + permalink. As TAXAS e a CLASSIFICAÇÃO (Forte/Saudável/Abaixo) são
-- DERIVADAS na tela, a partir destes valores + os benchmarks do manifesto —
-- por isso não vivem aqui. `id`/`post_id` viram text (key estável no front).
CREATE OR REPLACE VIEW v_conteudo_desempenho AS
SELECT
  id::text AS id,
  post_id::text AS post_id,
  data,
  formato,
  tema,
  alcance,
  visualizacoes,
  curtidas,
  comentarios,
  compartilhamentos,
  salvamentos,
  visitas_perfil,
  seguidores,
  duracao_s,
  tempo_medio_s,
  permalink,
  estrutura
FROM conteudo_desempenho;
