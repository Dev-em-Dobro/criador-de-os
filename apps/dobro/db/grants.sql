-- apps/dobro — role de LEITURA restrita para a API (doc 05, §4, Defesa 2 no DB).
--
-- Reforço no nível do BANCO da allowlist de views: um role `app_readonly` que
-- só pode SELECT nas views `v_*` (o contrato de exposição) e NUNCA nas tabelas
-- base (metricas_visao_geral, user, session, ...). Se a API conectar com este
-- role, mesmo um bug na allowlist da aplicação não expõe tabela crua.
--
-- NOTA DE HONESTIDADE (Fase 1C): a connection string atual (NEON_DATABASE_URL)
-- usa o role OWNER (neondb_owner), que lê tudo. Para ATIVAR esta defesa em
-- produção, provisione uma connection string separada para `app_readonly` e
-- aponte a API a ela. Enquanto isso, a defesa ENFORCED é a allowlist na
-- aplicação (query-allowlist.ts). Este arquivo deixa o DB pronto para a troca.
--
-- Idempotente: pode rodar múltiplas vezes.

-- Cria o role sem login por padrão (a senha/login é adicionada no provisioning).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_readonly') THEN
    CREATE ROLE app_readonly NOLOGIN;
  END IF;
END
$$;

-- Sem privilégios herdados amplos: revoga tudo no schema public primeiro.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_readonly;
REVOKE ALL ON SCHEMA public FROM app_readonly;

-- CRÍTICO: o Neon concede SELECT ao pseudo-role PUBLIC nas tabelas por padrão,
-- então QUALQUER role (inclusive app_readonly) leria as tabelas base a menos que
-- revoguemos de PUBLIC. Revogamos das TABELAS BASE (não das views) — assim a
-- tabela crua fica inacessível por qualquer role não-owner, e a view (que é o
-- contrato) continua legível via o GRANT explícito abaixo.
REVOKE SELECT ON metricas_visao_geral FROM PUBLIC;
REVOKE SELECT ON "user" FROM PUBLIC;
REVOKE SELECT ON "session" FROM PUBLIC;
REVOKE SELECT ON account FROM PUBLIC;
REVOKE SELECT ON verification FROM PUBLIC;

-- Concede só o mínimo: USAGE no schema + SELECT SÓ nas views de exposição.
GRANT USAGE ON SCHEMA public TO app_readonly;
GRANT SELECT ON v_visao_geral TO app_readonly;

-- Permite ao owner assumir o role (SET ROLE) — necessário para TESTAR a defesa
-- com `db/verify-grants.ts`. Em produção, a API usaria uma connection string
-- própria do `app_readonly`, não o SET ROLE.
GRANT app_readonly TO neondb_owner;
