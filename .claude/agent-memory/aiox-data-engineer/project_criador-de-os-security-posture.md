---
name: criador-de-os-security-posture
description: Postura de segurança de dados do Criador de OS — isolamento por banco Neon, roles least-privilege, e as lacunas conhecidas (enc-key acoplada, fallback owner, sem RLS, sem backup externo)
metadata:
  type: project
---

Modelo de segurança de dados do "Criador de OS" (banco Neon isolado por cliente, Better Auth, Drizzle).

**Controles reais (rastreados a código):**
- Isolamento físico: 1 projeto Neon por cliente (`docs/architecture/05-dados-auth-multitenant.md`).
- Least privilege no banco: roles `app_auth` (CRUD só auth) e `app_query` (SELECT só views `v_*`), com `REVOKE SELECT ... FROM PUBLIC` (Neon concede SELECT a PUBLIC por padrão) — `apps/*/db/grants.sql`. Provado por `apps/dobro/db/verify-grants.ts`.
- Cifragem AES-256-GCM de `app_settings` (BYOK) — `packages/server/src/settings.ts:62-118`; valor cru nunca volta ao browser (só hint mascarado).
- `/api/query`: 3 defesas — auth-first (401), allowlist fechada de views, SQL bind-param — `apps/dobro/api/{app,query-builder,query-allowlist}.ts`.
- Scaffolder gera TODOS esses controles por padrão no preset `full` — `packages/scaffolder/src/{generate,templates-db,templates-api}.ts`.

**Lacunas conhecidas (não enforçadas), por risco:**
1. Fallback silencioso p/ OWNER: sem `AUTH_/QUERY_DATABASE_URL`, a API roda como owner com só um WARN (`apps/dobro/api/env.ts:61-96`). Em prod deveria ser fail-closed.
2. Sem RLS por linha (só isolamento por banco + role/view). OK p/ modelo atual; vira lacuna se precisar segregar usuários do mesmo cliente.
3. `SETTINGS_ENC_KEY` cai em `getAuthSecret()` (BETTER_AUTH_SECRET) por default — acopla cifra das credenciais BYOK ao segredo de sessão; rotacionar o auth secret quebra a decifragem (`apps/neurovida/api/env.ts:93-95`).
4. Cifra "at rest" do storage inteiro depende do Neon (só campos BYOK são cifrados pelo app).

**Backup:** NÃO existe automação própria no repo (sem `.github/workflows/`, sem `pg_dump` em `apps/`/`package.json`). Proteção hoje = só PITR/history-retention nativo do Neon. Código do site = git; segredos `.env` NÃO estão no git (o `SETTINGS_ENC_KEY` perdido = credenciais BYOK irrecuperáveis).

**Why:** documentado em `docs/security/seguranca-na-criacao-de-os.md` e `docs/operations/backup-neon.md` (2026-07-17).
**How to apply:** ao trabalhar em DB/segurança deste projeto, tratar essas 4 lacunas como backlog conhecido; não reafirmar que roles/backup estão ativos sem confirmar `.env`/Console Neon. Ver [[criador-de-os-projeto]].
