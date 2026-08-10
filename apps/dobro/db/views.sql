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
  roteiro,
  objetivo
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

-- v_conteudo_previsoes: expõe a PREVISÃO da IA por post (o "previsto" do placar).
-- Passthrough magro, no mesmo espírito da v_conteudo_desempenho: os números que a
-- IA apostou + as notas do Fura a Bolha. Quem compara previsto x real é a tela (ou
-- a análise), cruzando `post_id` com a v_conteudo_desempenho. `id`/`post_id` viram
-- text (key estável no front). A justificativa/resumo vêm junto porque é o que
-- explica um erro de previsão quando ele aparece.
CREATE OR REPLACE VIEW v_conteudo_previsoes AS
SELECT
  id::text AS id,
  post_id::text AS post_id,
  classe,
  confianca,
  taxa_salvamentos_pct,
  taxa_compartilhamentos_pct,
  retencao_pct,
  classe_salvamentos,
  classe_compartilhamentos,
  classe_retencao,
  aposta_principal,
  riscos,
  fura_total,
  fura_notas,
  fura_justificativa,
  resumo,
  modelo,
  registrada_em
FROM conteudo_previsoes;

-- v_conteudo_placar: o PLACAR DA IA — uma linha por post PREVISTO, com o
-- resultado real ao lado quando ele já existe.
--
-- É LEFT JOIN de propósito: previsão sem resultado ainda é informação ("4 posts
-- previstos esperando ir ao ar"). Se fosse INNER, a tela ficaria vazia enquanto
-- nada foi publicado e pareceria quebrada.
--
-- Duas escolhas de "qual linha vale":
--   · MEDIÇÃO — um card pode ter mais de uma medição (repostagem, correção): fica
--     a mais recente.
--   · PREVISÃO — um card pode ser previsto várias vezes (o rascunho, e de novo
--     depois de editado). Vale a ÚLTIMA feita ANTES de publicar: prever depois do
--     resultado não é previsão. O `DESC` no teste booleano põe as elegíveis na
--     frente; entre elas, a mais recente. Sem nenhuma elegível (previsão só
--     depois da publicação), sobra a mais recente mesmo, e a tela mostra as duas
--     datas para quem quiser conferir.
--
-- As TAXAS e a CLASSIFICAÇÃO do resultado real NÃO saem daqui: a tela as deriva
-- destes valores crus com a mesma régua da aba Desempenho. Uma régua só.
CREATE OR REPLACE VIEW v_conteudo_placar AS
WITH medicao AS (
  SELECT DISTINCT ON (post_id)
    post_id, data, formato, alcance, visualizacoes, curtidas, comentarios,
    compartilhamentos, salvamentos, visitas_perfil, seguidores, duracao_s,
    tempo_medio_s, permalink, estrutura
  FROM conteudo_desempenho
  WHERE post_id IS NOT NULL
  ORDER BY post_id, data DESC NULLS LAST
),
escolhida AS (
  SELECT DISTINCT ON (p.post_id) p.*
  FROM conteudo_previsoes p
  LEFT JOIN medicao m ON m.post_id = p.post_id
  ORDER BY
    p.post_id,
    (m.data IS NULL OR p.registrada_em <= m.data + interval '1 day') DESC,
    p.registrada_em DESC
)
SELECT
  e.post_id::text                       AS post_id,
  c.titulo,
  c.estado,
  -- Formato na chave dos benchmarks ('reel', não 'reels'): o medido manda, e o
  -- card serve de reserva enquanto o post não foi publicado.
  COALESCE(m.formato, CASE WHEN c.formato = 'reels' THEN 'reel' ELSE c.formato END) AS formato,
  e.classe                              AS classe_prevista,
  e.confianca,
  e.taxa_salvamentos_pct                AS prev_salvamentos_pct,
  e.taxa_compartilhamentos_pct          AS prev_compartilhamentos_pct,
  e.retencao_pct                        AS prev_retencao_pct,
  e.fura_total,
  e.aposta_principal,
  e.resumo,
  e.modelo,
  e.registrada_em,
  m.data                                AS publicado_em,
  m.alcance,
  m.visualizacoes,
  m.curtidas,
  m.comentarios,
  m.compartilhamentos,
  m.salvamentos,
  m.visitas_perfil,
  m.seguidores,
  m.duracao_s,
  m.tempo_medio_s,
  m.permalink,
  m.estrutura
FROM escolhida e
LEFT JOIN medicao m ON m.post_id = e.post_id
LEFT JOIN conteudo_posts c ON c.id = e.post_id;

-- v_relatorio_semanal: as semanas já FECHADAS na reunião de marketing, com os
-- números congelados no fechamento e o registro da decisão. É o que permite
-- comparar semana a semana sem depender de recalcular `conteudo_desempenho`,
-- que muda a cada sincronização.
CREATE OR REPLACE VIEW v_relatorio_semanal AS
SELECT
  id::text AS id,
  semana_inicio,
  alcance,
  visualizacoes,
  interacoes,
  seguidores,
  posts_publicados,
  posts_planejados,
  destaques,
  aprendizado,
  estrutura_vencedora,
  erro_evitar,
  hipoteses,
  responsaveis,
  prazos,
  metrica_esperada,
  fechado_em,
  -- Colunas do CONTEXTO da semana entram no FIM: CREATE OR REPLACE VIEW só
  -- acrescenta ao final da lista, nunca insere no meio (erro "cannot change name
  -- of view column"). A ordem aqui não importa pra tela, que lê por nome.
  fase,
  evento_externo,
  campanha,
  -- A desmontagem do melhor post (seção 5): as oito respostas da equipe, para a
  -- tela reabrir a semana com o que já foi registrado.
  dna
FROM relatorio_semanal;
