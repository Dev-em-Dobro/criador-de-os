/**
 * apps/neurovida — provisiona LOGIN+senha do role `app_auth` e grava a connection
 * string dele no .env da raiz (hardening). Roda como OWNER. Gera senha forte
 * (crypto) → ALTER ROLE LOGIN → monta a URL (troca só user:senha) → testa a
 * conexão REAL → grava AUTH_DATABASE_URL. NUNCA imprime segredo.
 *
 * Pré-requisito: pnpm db:migrate (cria o role + privilégios via grants.sql).
 * Idempotente: re-rodar rotaciona a senha.
 */

import { neon } from '@neondatabase/serverless';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabaseUrl } from '../api/env';

const here = dirname(fileURLToPath(import.meta.url));
// Grava no .env DESTE app (isolamento por cliente), não no da raiz.
const appRoot = resolve(here, '..'); // apps/neurovida
const envPath = resolve(appRoot, '.env');

function buildRoleUrl(ownerUrl: string, role: string, password: string): string {
  const u = new URL(ownerUrl);
  u.username = role;
  u.password = password;
  return u.toString();
}

function upsertEnv(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(content)) return content.replace(re, line);
  const sep = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
  return `${content}${sep}${line}\n`;
}

async function main(): Promise<void> {
  const ownerUrl = getDatabaseUrl();
  const owner = neon(ownerUrl);

  let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';

  const password = randomBytes(24).toString('hex');
  await owner.query(`ALTER ROLE app_auth LOGIN PASSWORD '${password}'`);

  const roleUrl = buildRoleUrl(ownerUrl, 'app_auth', password);
  const roleClient = neon(roleUrl);
  await roleClient.query('SELECT count(*) FROM "user"');

  envContent = upsertEnv(envContent, 'AUTH_DATABASE_URL', roleUrl);
  writeFileSync(envPath, envContent, 'utf8');
  console.log('[provision] app_auth: LOGIN definido · conexão testada ✓ · AUTH_DATABASE_URL gravado.');
  console.log('[provision] OK — nenhum segredo foi impresso.');
}

main().catch((err) => {
  console.error('[provision] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
