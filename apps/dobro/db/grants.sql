-- apps/dobro — roles de MENOR PRIVILÉGIO para a API (doc 05, §4/§6 — Fase 3 hardening).
--
-- A API NÃO deve conectar como owner (neondb_owner lê/escreve/DROP tudo). Dois
-- caminhos, dois roles (least privilege por caminho):
--   • app_auth  → Better Auth (/api/auth/*): R/W SÓ nas tabelas de auth.
--   • app_query → /api/query: SELECT SÓ nas views v_* (nunca tabela crua/auth).
--
-- Se a API conectar com esses roles, mesmo um bug na allowlist da aplicação
-- (query-allowlist.ts) não expõe tabela crua, e o caminho de auth jamais lê
-- dados de negócio. É a defesa em profundidade no nível do BANCO.
--
-- ATIVAÇÃO: este arquivo cuida só dos PRIVILÉGIOS (versionável, não-secreto). O
-- LOGIN/senha de cada role e as connection strings (AUTH_DATABASE_URL /
-- QUERY_DATABASE_URL) são provisionados FORA daqui — no Console Neon, ou via
-- `ALTER ROLE app_auth LOGIN PASSWORD '...'` com a senha escolhida pelo dono.
-- Ver apps/dobro/.env.example e doc 05, §6. Enquanto não provisionados, a API
-- cai no fallback OWNER (com WARN) e esta defesa fica pronta mas inativa.
--
-- Idempotente: pode rodar múltiplas vezes (aplicado por db/migrate.ts).

-- 1) Garante que os roles existem. NOLOGIN aqui: o login/senha é adicionado no
--    provisioning sem tocar neste arquivo versionado. Se o role já existir
--    (criado com LOGIN no Console Neon), o CREATE é pulado — nada muda.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_auth') THEN
    CREATE ROLE app_auth NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_query') THEN
    CREATE ROLE app_query NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_ingest') THEN
    CREATE ROLE app_ingest NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_content') THEN
    CREATE ROLE app_content NOLOGIN;
  END IF;
END
$$;

-- 2) Zera privilégios herdados amplos de ambos os roles no schema public.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_auth;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_query;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_ingest;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_content;
REVOKE ALL ON SCHEMA public FROM app_auth;
REVOKE ALL ON SCHEMA public FROM app_query;
REVOKE ALL ON SCHEMA public FROM app_ingest;
REVOKE ALL ON SCHEMA public FROM app_content;

-- 3) O Neon concede SELECT ao pseudo-role PUBLIC nas tabelas/views por padrão.
--    Revogamos de PUBLIC para que só os GRANTs explícitos abaixo valham — senão
--    QUALQUER role leria tudo. Cobre tabelas base (auth + negócio) E a view.
REVOKE SELECT ON metricas_visao_geral FROM PUBLIC;
REVOKE SELECT ON "user" FROM PUBLIC;
REVOKE SELECT ON "session" FROM PUBLIC;
REVOKE SELECT ON account FROM PUBLIC;
REVOKE SELECT ON verification FROM PUBLIC;
REVOKE SELECT ON v_visao_geral FROM PUBLIC;
REVOKE SELECT ON conteudo_posts FROM PUBLIC;
REVOKE SELECT ON referencias FROM PUBLIC;
REVOKE SELECT ON v_conteudo_posts FROM PUBLIC;

-- 4) USAGE no schema para todos (sem isto não enxergam nenhum objeto).
GRANT USAGE ON SCHEMA public TO app_auth;
GRANT USAGE ON SCHEMA public TO app_query;
GRANT USAGE ON SCHEMA public TO app_ingest;
GRANT USAGE ON SCHEMA public TO app_content;

-- 5) app_auth: CRUD SÓ nas tabelas do Better Auth (login escreve sessão/conta).
--    Sem acesso a v_* nem à tabela de negócio.
GRANT SELECT, INSERT, UPDATE, DELETE ON "user"       TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON "session"    TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON account      TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON verification TO app_auth;

-- 6) app_query: SELECT SÓ nas views de exposição (o contrato da allowlist).
--    A view roda com o privilégio do OWNER dela para ler a tabela base, então
--    app_query lê a view SEM ter acesso à tabela crua `metricas_visao_geral`.
GRANT SELECT ON v_visao_geral TO app_query;
GRANT SELECT ON v_conteudo_posts TO app_query;

-- 6b) app_ingest: escreve SÓ na tabela `referencias` (o webhook do Telegram grava
--     as inspirações). SELECT junto para dedupe futuro por origem_url. Nada mais —
--     não lê negócio (conteudo_posts/views) nem auth.
GRANT SELECT, INSERT ON referencias TO app_ingest;

-- 6c) app_content: CRUD SÓ na tabela `conteudo_posts` (o criador cadastra/edita o
--     cronograma pelas rotas autenticadas /api/conteudo). SELECT junto para o
--     RETURNING/echo do que gravou. Não lê auth nem referencias, não toca as views.
GRANT SELECT, INSERT, UPDATE, DELETE ON conteudo_posts TO app_content;

-- 7) Permite ao owner assumir cada role (SET ROLE) — necessário para TESTAR a
--    defesa com db/verify-grants.ts. Em produção, a API usa a connection string
--    própria de cada role (não SET ROLE).
GRANT app_auth    TO neondb_owner;
GRANT app_query   TO neondb_owner;
GRANT app_ingest  TO neondb_owner;
GRANT app_content TO neondb_owner;
