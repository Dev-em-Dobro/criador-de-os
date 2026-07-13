/**
 * apps/dobro — prova a defesa de LEAST PRIVILEGE no nível do BANCO (doc 05, §4/§6).
 *
 * Assume cada role (SET ROLE) a partir do owner e verifica o isolamento por
 * caminho da Fase 3:
 *
 *   app_query (endpoint /api/query — só views):
 *     - SELECT view `v_visao_geral`        → PERMITIDO (é o contrato de exposição)
 *     - SELECT tabela crua `metricas_...`   → NEGADO
 *     - SELECT tabela `user` (auth)         → NEGADO
 *
 *   app_auth (Better Auth — só tabelas de auth):
 *     - SELECT tabela `user` (auth)         → PERMITIDO (escreve/lê sessão)
 *     - SELECT tabela crua `metricas_...`   → NEGADO
 *     - SELECT view `v_visao_geral` (negócio) → NEGADO
 *
 * Se a API conectar com esses roles (produção), o banco reforça a allowlist da
 * aplicação: um caminho jamais alcança os dados do outro nem a tabela crua.
 *
 * Roda como OWNER + SET ROLE, então NÃO exige que as connection strings dos
 * roles (AUTH/QUERY_DATABASE_URL) já estejam provisionadas — testa os GRANTs.
 */

import { neon } from '@neondatabase/serverless';
import { getDatabaseUrl } from '../api/env';

const sql = neon(getDatabaseUrl());

/**
 * Roda `SET ROLE {role}` + a query na MESMA sessão. O driver HTTP do Neon faz
 * uma requisição por `sql.query()` (sessões não sobrevivem entre requests —
 * doc 05, §3), então `SET ROLE` e o SELECT precisam ir juntos em UM
 * `transaction()` (um único request atômico) para o role valer no SELECT.
 */
async function tryAs(role: string, query: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const results = await sql.transaction([sql.query(`SET ROLE ${role}`), sql.query(query)]);
    const rows = results[1] as unknown[];
    return { ok: true, detail: `${rows.length} linha(s)` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

/** Formata uma expectativa: `expected` = o role DEVERIA conseguir? */
function line(label: string, r: { ok: boolean; detail: string }, expected: boolean): boolean {
  const pass = r.ok === expected;
  const verdict = r.ok ? 'PERMITIDO' : 'NEGADO';
  const mark = pass ? '✓' : '(!)';
  console.log(`  ${label.padEnd(30)} → ${verdict} ${mark} (${r.detail})`);
  return pass;
}

async function main(): Promise<void> {
  console.log('[verify-grants] Fase 3 — least privilege por caminho\n');

  console.log('app_query (endpoint /api/query — só views):');
  const qView = line('view v_visao_geral', await tryAs('app_query', 'SELECT * FROM v_visao_geral LIMIT 1'), true);
  const qTable = line('tabela crua metricas_...', await tryAs('app_query', 'SELECT * FROM metricas_visao_geral LIMIT 1'), false);
  const qUser = line('tabela user (auth)', await tryAs('app_query', 'SELECT * FROM "user" LIMIT 1'), false);

  console.log('\napp_auth (Better Auth — só tabelas de auth):');
  const aUser = line('tabela user (auth)', await tryAs('app_auth', 'SELECT * FROM "user" LIMIT 1'), true);
  const aTable = line('tabela crua metricas_...', await tryAs('app_auth', 'SELECT * FROM metricas_visao_geral LIMIT 1'), false);
  const aView = line('view v_visao_geral (negócio)', await tryAs('app_auth', 'SELECT * FROM v_visao_geral LIMIT 1'), false);

  const pass = qView && qTable && qUser && aUser && aTable && aView;
  console.log(
    pass
      ? '\n[verify-grants] OK — isolamento por caminho reforçado no banco.'
      : '\n[verify-grants] FALHOU — algum grant não está como esperado.',
  );
  if (!pass) process.exit(1);
}

main().catch((err) => {
  console.error('[verify-grants] erro:', err instanceof Error ? err.message : err);
  process.exit(1);
});
