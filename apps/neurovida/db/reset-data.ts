/**
 * apps/neurovida — ZERA os dados do Neon (começar limpo para testar com dados falsos).
 *
 * Apaga os dados de NEGÓCIO e as configurações (BYOK):
 *   invoices, invoice_items, leads, lead_source_rows, app_settings
 * PRESERVA o login (Better Auth: user/session/account/verification) — assim o
 * app continua acessível para testar sem precisar recriar usuário.
 *
 * Operação IRREVERSÍVEL → exige `--yes`. Usa a connection string OWNER (env.ts) e
 * NUNCA a loga.
 *
 * Uso: pnpm -C apps/neurovida db:reset-data -- --yes
 */

import { neon } from '@neondatabase/serverless';
import { getDatabaseUrl } from '../api/env';

// Dados apagados (negócio + settings). Auth NÃO entra aqui de propósito.
const TABLES = ['invoice_items', 'invoices', 'lead_source_rows', 'leads', 'hotmart_metrics', 'app_settings'] as const;
const PRESERVED = ['user', 'session', 'account', 'verification'];

async function main(): Promise<void> {
  if (!process.argv.includes('--yes')) {
    console.error('Operação IRREVERSÍVEL. Vai apagar:', TABLES.join(', '));
    console.error('Preserva o login:', PRESERVED.join(', '));
    console.error('\nConfirme com:  pnpm -C apps/neurovida db:reset-data -- --yes');
    process.exit(1);
  }

  const sql = neon(getDatabaseUrl());
  const list = TABLES.map((t) => `"${t}"`).join(', ');

  console.log('[reset] zerando:', TABLES.join(', '));
  await sql.query(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);

  // Confirma que ficou vazio (e que o login foi preservado).
  for (const t of TABLES) {
    const rows = (await sql.query(`SELECT count(*)::int AS n FROM "${t}"`)) as Array<{ n: number }>;
    console.log(`  ${t.padEnd(18)} → ${rows[0].n} linha(s)`);
  }
  const users = (await sql.query('SELECT count(*)::int AS n FROM "user"')) as Array<{ n: number }>;
  console.log(`[reset] preservado: user → ${users[0].n} login(s) intacto(s).`);
  console.log('[reset] OK — banco limpo para testar com dados falsos.');
}

main().catch((err) => {
  console.error('[reset] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
