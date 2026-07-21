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
  refs_links
FROM conteudo_posts;
