---
name: neon-driver-gotchas
description: Pegadinhas do driver @neondatabase/serverless (HTTP) e do least-privilege no Neon — evita re-descobrir na Fase 3/deploy
metadata:
  type: project
---

Descobertas ao ligar o `/api/query` seguro à Neon na Fase 1C (`apps/dobro`). Ver [[criador-de-os-phases]].

**1. O driver `neon()` (HTTP one-shot) roda CADA `sql.query()` numa sessão HTTP separada.**
- **Why:** doc 05 §3 avisa "conexões não sobrevivem além de uma requisição". Consequência prática: `SET ROLE x` num `sql.query()` NÃO vale no `sql.query()` seguinte — são sessões diferentes. Testes que dependem de `SET ROLE` + `SELECT` precisam de `sql.transaction([...])` (um único request atômico). Foi assim que `db/verify-grants.ts` passou a provar o least-privilege.
- **How to apply:** para transações interativas / `SET ROLE` / `SET LOCAL`, use `sql.transaction()` ou o `Pool` WebSocket — nunca `sql.query()` sequencial esperando estado de sessão.

**2. Least-privilege real exige connection string SEPARADA do role `app_readonly`.**
- **Why:** a `NEON_DATABASE_URL` conecta como `neondb_owner` (owner, lê tudo). A API hoje usa essa string, então a defesa ENFORCED contra tabela crua é a ALLOWLIST na aplicação (`api/query-allowlist.ts`), não o GRANT. O role `app_readonly` (criado em `db/grants.sql`, com `REVOKE SELECT ... FROM PUBLIC` nas tabelas base) está pronto e PROVADO (nega tabela crua, permite view), mas só entra em vigor quando a API conectar com uma string própria dele.
- **How to apply:** na Fase 3/deploy, provisionar um usuário Neon para `app_readonly` e apontar a API a essa connection string. Aí a allowlist da app + o GRANT viram defesa em profundidade de verdade. Enquanto isso, NÃO afrouxar a allowlist da app achando que o GRANT cobre.

**3. Neon concede SELECT ao pseudo-role PUBLIC nas tabelas por padrão.**
- **Why:** `REVOKE ... FROM app_readonly` não adianta — o privilégio vem de PUBLIC. Tem de `REVOKE SELECT ON <tabela_base> FROM PUBLIC`. Views rodam com direitos do definer (owner), então revogar da tabela base não quebra a view.
- **How to apply:** toda tabela base nova → adicionar `REVOKE SELECT ... FROM PUBLIC` em `db/grants.sql`. Views `v_*` continuam legíveis via GRANT explícito ao `app_readonly`.
