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
