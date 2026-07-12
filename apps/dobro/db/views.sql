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
