/**
 * apps/dobro — aplica as migrations do Drizzle + as views SQL na Neon.
 *
 * 1) roda as migrations geradas em `db/migrations/` (tabelas do Better Auth +
 *    `metricas_visao_geral`) via o migrator do neon-http;
 * 2) aplica `db/views.sql` (idempotente) — a view read-only `v_visao_geral`,
 *    que é o contrato de exposição da allowlist.
 *
 * A connection string vem SÓ do ambiente (env.ts). Nada é impresso além de
 * status; a connection string NUNCA é logada.
 */

import { neon } from '@neondatabase/serverless';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabaseUrl } from '../api/env';

const here = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const sql = neon(getDatabaseUrl());
  const db = drizzle(sql);

  console.log('[migrate] aplicando migrations do Drizzle...');
  await migrate(db, { migrationsFolder: resolve(here, 'migrations') });
  console.log('[migrate] migrations aplicadas.');

  console.log('[migrate] aplicando views (db/views.sql)...');
  await applySqlFile(sql, resolve(here, 'views.sql'), 'view');

  console.log('[migrate] aplicando grants (db/grants.sql)...');
  await applySqlFile(sql, resolve(here, 'grants.sql'), 'grant');

  console.log('[migrate] OK.');
}

/**
 * Executa um arquivo .sql statement-por-statement no driver HTTP.
 * Respeita blocos `$$ ... $$` (funções/DO) para não dividir no `;` interno.
 * Remove linhas de comentário (`-- ...`) antes de dividir.
 */
async function applySqlFile(
  sql: NeonQueryFunction<false, false>,
  path: string,
  label: string,
): Promise<void> {
  const raw = readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  const statements: string[] = [];
  let dollar = false;
  let cur = '';
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '$' && raw[i + 1] === '$') {
      dollar = !dollar;
      cur += '$$';
      i++;
      continue;
    }
    if (raw[i] === ';' && !dollar) {
      if (cur.trim()) statements.push(cur.trim());
      cur = '';
      continue;
    }
    cur += raw[i];
  }
  if (cur.trim()) statements.push(cur.trim());

  for (const stmt of statements) {
    await sql.query(stmt);
  }
  console.log(`[migrate] ${statements.length} ${label} statement(s) aplicado(s).`);
}

main().catch((err) => {
  console.error('[migrate] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
