/**
 * apps/dobro — prova a Defesa 2 no NÍVEL DO BANCO (doc 05, §4).
 *
 * Assume o role `app_readonly` (SET ROLE) e verifica que:
 *   - SELECT na view `v_visao_geral` → OK (é o contrato de exposição);
 *   - SELECT na tabela crua `metricas_visao_geral` → NEGADO (permission denied);
 *   - SELECT na tabela `user` (Better Auth) → NEGADO.
 *
 * Isto demonstra que, se a API conectar com `app_readonly` (produção), o banco
 * bloqueia leitura de tabela crua mesmo que a allowlist da aplicação falhasse.
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

async function main(): Promise<void> {
  console.log('[verify-grants] como app_readonly:');

  const view = await tryAs('app_readonly', 'SELECT * FROM v_visao_geral LIMIT 1');
  console.log(`  view v_visao_geral      → ${view.ok ? 'PERMITIDO ✓' : 'NEGADO'} (${view.detail})`);

  const table = await tryAs('app_readonly', 'SELECT * FROM metricas_visao_geral LIMIT 1');
  console.log(
    `  tabela metricas_visao_geral → ${table.ok ? 'PERMITIDO (!)' : 'NEGADO ✓'} (${table.detail})`,
  );

  const userTbl = await tryAs('app_readonly', 'SELECT * FROM "user" LIMIT 1');
  console.log(`  tabela user (auth)      → ${userTbl.ok ? 'PERMITIDO (!)' : 'NEGADO ✓'} (${userTbl.detail})`);

  const pass = view.ok && !table.ok && !userTbl.ok;
  console.log(pass ? '[verify-grants] OK — DB reforça a allowlist.' : '[verify-grants] FALHOU.');
  if (!pass) process.exit(1);
}

main().catch((err) => {
  console.error('[verify-grants] erro:', err instanceof Error ? err.message : err);
  process.exit(1);
});
