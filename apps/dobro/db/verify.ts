/**
 * apps/dobro — verificação: SELECT na view read-only `v_visao_geral`.
 *
 * Prova que as migrations + a view + o seed funcionaram, imprimindo APENAS as
 * linhas (nunca a connection string). Usado no Passo 1 da Fase 1C.
 */

import { neon } from '@neondatabase/serverless';
import { getDatabaseUrl } from '../server/env';

async function main(): Promise<void> {
  const sql = neon(getDatabaseUrl());
  const rows = await sql.query('SELECT * FROM v_visao_geral ORDER BY period');
  console.log('[verify] SELECT * FROM v_visao_geral →');
  console.table(rows);
  console.log(`[verify] ${rows.length} linha(s).`);
}

main().catch((err) => {
  console.error('[verify] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
