/**
 * @os/scaffolder — conteúdo dos arquivos de DADOS (`db/`, preset full).
 *
 * `client.ts` e `migrate.ts` são idênticos ao dobro (genéricos). `schema.ts`,
 * `views.sql`, `grants.sql`, `provision-roles.ts` e `verify-grants.ts` são
 * DERIVADOS das views do manifesto — cada menu `kind:'query'` gera uma tabela
 * base + uma view read-only (o contrato de exposição, doc 05, §4).
 */

import type { ViewSpec } from './blocks';
import { toCamel } from './util';

export function dbClient(slug: string): string {
  return `/**
 * apps/${slug} — cliente Drizzle sobre a Neon (driver HTTP one-shot, doc 05, §3).
 * Três instâncias por PAPEL (least privilege): owner (scripts admin), app_auth,
 * app_query. A connection string vem SÓ do ambiente server-side.
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { getDatabaseUrl, getAuthDatabaseUrl, getQueryDatabaseUrl } from '../api/env';
import * as schema from './schema';

/** Client OWNER — privilégio total. SÓ scripts admin (migrate/grants/provision). */
export const db = drizzle(neon(getDatabaseUrl()), { schema });

/** Client do Better Auth — role \`app_auth\` (R/W só nas tabelas de auth). */
export const dbAuth = drizzle(neon(getAuthDatabaseUrl()), { schema });

/** Client do /api/query — role \`app_query\` (SELECT só nas views v_*). */
export const dbQuery = drizzle(neon(getQueryDatabaseUrl()), { schema });

export type Db = typeof db;
export { schema };
`;
}

export function dbSchema(slug: string, views: ViewSpec[]): string {
  const hasBusiness = views.length > 0;
  const imports = ['boolean', ...(hasBusiness ? ['doublePrecision', 'integer'] : []), 'pgTable', 'text', 'timestamp'];

  const businessBlocks = views
    .map((v) => {
      const cols = v.businessColumns
        .map((c) => {
          if (c.name === 'period') return `  period: text('period').notNull(),`;
          if (c.kind === 'int') return `  ${c.name}: integer('${c.name}').notNull(),`;
          if (c.kind === 'text') return `  ${c.name}: text('${c.name}'),`;
          return `  ${c.name}: doublePrecision('${c.name}').notNull(),`;
        })
        .join('\n');
      return `/**
 * Tabela base do menu \`${v.view.replace(/^v_/, '')}\`. A API NUNCA a lê direto —
 * só a view \`${v.view}\` (allowlist). Colunas espelham os KPIs do manifesto.
 */
export const ${toCamel(v.table)} = pgTable('${v.table}', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
${cols}
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});`;
    })
    .join('\n\n');

  return `/**
 * apps/${slug} — Schema Drizzle (schema-as-code) do Neon do cliente.
 *
 *  1) Better Auth (user/session/account/verification) — colunas conforme o core
 *     schema do Better Auth 1.6.x (o adapter mapeia por nome).
 *  2) Negócio — uma tabela por menu \`kind:'query'\`. As views read-only \`v_*\`
 *     (contrato de exposição) vivem em db/views.sql (Drizzle não modela views).
 */

import {
  ${imports.join(',\n  ')},
} from 'drizzle-orm/pg-core';

// ============================================================
// Better Auth — tabelas de autenticação
// ============================================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
});
${hasBusiness ? `
// ============================================================
// Negócio — uma tabela por menu \`kind:'query'\`
// ============================================================

${businessBlocks}
` : ''}`;
}

export function dbMigrate(slug: string): string {
  return `/**
 * apps/${slug} — aplica migrations do Drizzle + views + grants na Neon.
 *
 * 1) migrations de db/migrations/ (tabelas Better Auth + negócio);
 * 2) db/views.sql (idempotente — as views read-only da allowlist);
 * 3) db/grants.sql (idempotente — roles de menor privilégio).
 *
 * A connection string vem SÓ do ambiente (env.ts) e NUNCA é logada.
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

/** Executa um .sql statement-por-statement (respeita blocos \`$$ ... $$\`). */
async function applySqlFile(
  sql: NeonQueryFunction<false, false>,
  path: string,
  label: string,
): Promise<void> {
  const raw = readFileSync(path, 'utf8')
    .split('\\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\\n');

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
  console.log(\`[migrate] \${statements.length} \${label} statement(s) aplicado(s).\`);
}

main().catch((err) => {
  console.error('[migrate] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
`;
}

export function dbViewsSql(views: ViewSpec[]): string {
  const header = `-- Views read-only (o CONTRATO DE EXPOSIÇÃO, doc 05, §4).
-- A allowlist de /api/query só aceita VIEWS \`v_*\`. Idempotente (CREATE OR REPLACE),
-- aplicado após as migrations por db/migrate.ts.
`;
  if (views.length === 0) {
    return header + '\n-- Nenhum menu kind:\'query\' no manifesto — nenhuma view a criar ainda.\n-- Ao promover um menu para dados reais, adicione a view aqui + na allowlist + nos grants.\n';
  }
  const blocks = views
    .map((v) => {
      const cols = v.exposed.join(',\n  ');
      return `-- ${v.view}: expõe só as colunas que o manifesto consome (contrato mínimo).
CREATE OR REPLACE VIEW ${v.view} AS
SELECT
  ${cols}
FROM ${v.table};`;
    })
    .join('\n\n');
  return header + '\n' + blocks + '\n';
}

export function dbGrantsSql(views: ViewSpec[]): string {
  const revokeBusiness = views.map((v) => `REVOKE SELECT ON ${v.table} FROM PUBLIC;`).join('\n');
  const revokeViews = views.map((v) => `REVOKE SELECT ON ${v.view} FROM PUBLIC;`).join('\n');
  const grantViews = views.map((v) => `GRANT SELECT ON ${v.view} TO app_query;`).join('\n');

  return `-- Roles de MENOR PRIVILÉGIO para a API (doc 05, §4/§6 — hardening).
--   • app_auth  → Better Auth (/api/auth/*): R/W SÓ nas tabelas de auth.
--   • app_query → /api/query: SELECT SÓ nas views v_* (nunca tabela crua/auth).
-- Idempotente (aplicado por db/migrate.ts). O LOGIN/senha de cada role é
-- provisionado à parte (pnpm db:provision-roles). O owner assumido é 'neondb_owner'
-- (default do Neon) — ajuste se o seu projeto usar outro nome de owner.

-- 1) Garante que os roles existem (NOLOGIN aqui; LOGIN é adicionado no provision).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_auth') THEN
    CREATE ROLE app_auth NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_query') THEN
    CREATE ROLE app_query NOLOGIN;
  END IF;
END
$$;

-- 2) Zera privilégios amplos herdados no schema public.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_auth;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_query;
REVOKE ALL ON SCHEMA public FROM app_auth;
REVOKE ALL ON SCHEMA public FROM app_query;

-- 3) Revoga o SELECT que o Neon concede a PUBLIC (senão qualquer role lê tudo).
REVOKE SELECT ON "user" FROM PUBLIC;
REVOKE SELECT ON "session" FROM PUBLIC;
REVOKE SELECT ON account FROM PUBLIC;
REVOKE SELECT ON verification FROM PUBLIC;
${revokeBusiness ? revokeBusiness + '\n' : ''}${revokeViews ? revokeViews + '\n' : ''}
-- 4) USAGE no schema para ambos.
GRANT USAGE ON SCHEMA public TO app_auth;
GRANT USAGE ON SCHEMA public TO app_query;

-- 5) app_auth: CRUD SÓ nas tabelas do Better Auth.
GRANT SELECT, INSERT, UPDATE, DELETE ON "user"       TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON "session"    TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON account      TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON verification TO app_auth;

-- 6) app_query: SELECT SÓ nas views de exposição (a view roda com privilégio do
--    owner dela, então lê a tabela base sem app_query ter acesso à tabela crua).
${grantViews || '-- (nenhuma view ainda — nada a conceder a app_query)'}

-- 7) Permite ao owner assumir cada role (SET ROLE) para testar com db:verify-grants.
GRANT app_auth  TO neondb_owner;
GRANT app_query TO neondb_owner;
`;
}

export function dbProvisionRoles(slug: string, views: ViewSpec[]): string {
  const querySmoke = views.length > 0 ? `SELECT count(*) FROM ${views[0].view}` : 'SELECT 1';
  return `/**
 * apps/${slug} — provisiona LOGIN+senha dos roles de menor privilégio e grava as
 * connection strings por papel no .env (hardening, doc 05, §4/§6).
 *
 * Roda como OWNER. Para cada role: gera senha forte (crypto) → ALTER ROLE LOGIN →
 * monta a connection string (troca só user:senha) → testa a conexão REAL → grava
 * AUTH_DATABASE_URL / QUERY_DATABASE_URL no .env da raiz. NUNCA imprime segredo.
 * Pré-requisito: pnpm db:migrate (cria roles + privilégios). Idempotente.
 */

import { neon } from '@neondatabase/serverless';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabaseUrl } from '../api/env';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
const envPath = resolve(repoRoot, '.env');

interface RoleSpec {
  role: string;
  envVar: string;
  smokeTest: string;
}

const ROLES: RoleSpec[] = [
  { role: 'app_auth', envVar: 'AUTH_DATABASE_URL', smokeTest: 'SELECT count(*) FROM "user"' },
  { role: 'app_query', envVar: 'QUERY_DATABASE_URL', smokeTest: '${querySmoke}' },
];

function buildRoleUrl(ownerUrl: string, role: string, password: string): string {
  const u = new URL(ownerUrl);
  u.username = role;
  u.password = password;
  return u.toString();
}

function upsertEnv(content: string, key: string, value: string): string {
  const line = \`\${key}=\${value}\`;
  const re = new RegExp(\`^\${key}=.*$\`, 'm');
  if (re.test(content)) return content.replace(re, line);
  const sep = content.length > 0 && !content.endsWith('\\n') ? '\\n' : '';
  return \`\${content}\${sep}\${line}\\n\`;
}

async function main(): Promise<void> {
  const ownerUrl = getDatabaseUrl();
  const owner = neon(ownerUrl);

  let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';

  for (const { role, envVar, smokeTest } of ROLES) {
    const password = randomBytes(24).toString('hex');
    await owner.query(\`ALTER ROLE \${role} LOGIN PASSWORD '\${password}'\`);

    const roleUrl = buildRoleUrl(ownerUrl, role, password);

    const roleClient = neon(roleUrl);
    await roleClient.query(smokeTest);

    envContent = upsertEnv(envContent, envVar, roleUrl);
    console.log(\`[provision] \${role}: LOGIN definido · conexão testada ✓ · \${envVar} gravado\`);
  }

  writeFileSync(envPath, envContent, 'utf8');
  console.log('[provision] OK — .env atualizado. Nenhum segredo foi impresso.');
}

main().catch((err) => {
  console.error('[provision] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
`;
}

export function dbVerifyGrants(slug: string, views: ViewSpec[]): string {
  const hasView = views.length > 0;
  const firstView = hasView ? views[0].view : '';
  const firstTable = hasView ? views[0].table : '';

  const queryChecks = hasView
    ? `  console.log('app_query (endpoint /api/query — só views):');
  const qView = line('view ${firstView}', await tryAs('app_query', 'SELECT * FROM ${firstView} LIMIT 1'), true);
  const qTable = line('tabela crua ${firstTable}', await tryAs('app_query', 'SELECT * FROM ${firstTable} LIMIT 1'), false);
  const qUser = line('tabela user (auth)', await tryAs('app_query', 'SELECT * FROM "user" LIMIT 1'), false);
`
    : `  console.log('app_query (endpoint /api/query — só views):');
  const qUser = line('tabela user (auth)', await tryAs('app_query', 'SELECT * FROM "user" LIMIT 1'), false);
`;

  const authChecks = hasView
    ? `  const aUser = line('tabela user (auth)', await tryAs('app_auth', 'SELECT * FROM "user" LIMIT 1'), true);
  const aView = line('view ${firstView} (negócio)', await tryAs('app_auth', 'SELECT * FROM ${firstView} LIMIT 1'), false);
`
    : `  const aUser = line('tabela user (auth)', await tryAs('app_auth', 'SELECT * FROM "user" LIMIT 1'), true);
`;

  const passExpr = hasView ? 'qView && qTable && qUser && aUser && aView' : 'qUser && aUser';

  return `/**
 * apps/${slug} — prova a defesa de LEAST PRIVILEGE no nível do BANCO (doc 05, §4/§6).
 *
 * Assume cada role (SET ROLE) a partir do owner e verifica o isolamento por
 * caminho: app_query lê só views (nega tabela crua/auth); app_auth lê só auth
 * (nega negócio). Roda como OWNER + SET ROLE — não exige as connection strings
 * dos roles já provisionadas; testa os GRANTs.
 */

import { neon } from '@neondatabase/serverless';
import { getDatabaseUrl } from '../api/env';

const sql = neon(getDatabaseUrl());

async function tryAs(role: string, query: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const results = await sql.transaction([sql.query(\`SET ROLE \${role}\`), sql.query(query)]);
    const rows = results[1] as unknown[];
    return { ok: true, detail: \`\${rows.length} linha(s)\` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

function line(label: string, r: { ok: boolean; detail: string }, expected: boolean): boolean {
  const pass = r.ok === expected;
  const verdict = r.ok ? 'PERMITIDO' : 'NEGADO';
  const mark = pass ? '✓' : '(!)';
  console.log(\`  \${label.padEnd(30)} → \${verdict} \${mark} (\${r.detail})\`);
  return pass;
}

async function main(): Promise<void> {
  console.log('[verify-grants] least privilege por caminho\\n');

${queryChecks}
  console.log('\\napp_auth (Better Auth — só tabelas de auth):');
${authChecks}
  const pass = ${passExpr};
  console.log(
    pass
      ? '\\n[verify-grants] OK — isolamento por caminho reforçado no banco.'
      : '\\n[verify-grants] FALHOU — algum grant não está como esperado.',
  );
  if (!pass) process.exit(1);
}

main().catch((err) => {
  console.error('[verify-grants] erro:', err instanceof Error ? err.message : err);
  process.exit(1);
});
`;
}
