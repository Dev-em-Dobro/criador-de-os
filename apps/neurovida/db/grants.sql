-- apps/neurovida — role de MENOR PRIVILÉGIO para o runtime da API (hardening).
--
-- O runtime (Better Auth + /api/settings) NÃO deve conectar como owner. Um role:
--   • app_auth → R/W SÓ nas tabelas de auth (user/session/account/verification)
--                e em app_settings (as configurações cifradas do cliente).
--
-- Idempotente (aplicado por db/migrate.ts). O LOGIN/senha do role é provisionado
-- à parte (pnpm db:provision-roles). Owner assumido = 'neondb_owner' (default Neon).

-- 1) Garante que o role existe (NOLOGIN aqui; LOGIN é adicionado no provision).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_auth') THEN
    CREATE ROLE app_auth NOLOGIN;
  END IF;
END
$$;

-- 2) Zera privilégios amplos herdados no schema public.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_auth;
REVOKE ALL ON SCHEMA public FROM app_auth;

-- 3) Revoga o SELECT que o Neon concede a PUBLIC (senão qualquer role lê tudo).
REVOKE SELECT ON "user" FROM PUBLIC;
REVOKE SELECT ON "session" FROM PUBLIC;
REVOKE SELECT ON account FROM PUBLIC;
REVOKE SELECT ON verification FROM PUBLIC;
REVOKE SELECT ON app_settings FROM PUBLIC;
REVOKE SELECT ON lead_source_rows FROM PUBLIC;
REVOKE SELECT ON leads FROM PUBLIC;
REVOKE SELECT ON invoices FROM PUBLIC;
REVOKE SELECT ON invoice_items FROM PUBLIC;
REVOKE SELECT ON hotmart_metrics FROM PUBLIC;

-- 4) USAGE no schema.
GRANT USAGE ON SCHEMA public TO app_auth;

-- 5) app_auth: CRUD nas tabelas de auth + nas configurações cifradas.
GRANT SELECT, INSERT, UPDATE, DELETE ON "user"        TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON "session"     TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON account       TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON verification  TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_settings  TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON lead_source_rows TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads           TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON invoices        TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON invoice_items   TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON hotmart_metrics TO app_auth;
-- Colunas IDENTITY (lead_source_rows.id, invoice_items.id) → USAGE nas sequências.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_auth;

-- 6) Permite ao owner (quem roda este script) assumir o role (SET ROLE) p/ testes.
--    CURRENT_USER em vez de nome fixo → funciona em qualquer projeto Neon.
GRANT app_auth TO CURRENT_USER;
