/**
 * @os/scaffolder — conteúdo dos arquivos do BACKEND (`api/`, preset full).
 *
 * Espelha 1:1 o backend provado de `apps/dobro` (Hono + Better Auth + endpoint
 * de query seguro com 3 defesas). Os arquivos "invariantes" são idênticos ao
 * dobro (só o slug muda em comentários/defaults); `query-allowlist.ts` é gerado
 * a partir das views do manifesto.
 */

import type { ViewSpec } from './blocks';
import { serializeToTs } from './util';

export function apiEnv(slug: string): string {
  return `/**
 * apps/${slug} — carregamento de ambiente SERVER-SIDE (doc 05, §6).
 *
 * Segredos vivem SÓ aqui (server), NUNCA no bundle. Regra de ouro: nenhuma
 * variável com prefixo \`VITE_\`. Precedência: apps/${slug}/.env → .env da raiz →
 * process.env. A connection string NUNCA é logada.
 */

import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..'); // apps/${slug}
const repoRoot = resolve(appRoot, '..', '..'); // raiz do monorepo

for (const dir of [appRoot, repoRoot]) {
  const envPath = resolve(dir, '.env');
  if (existsSync(envPath)) {
    loadDotenv({ path: envPath, override: false });
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      \`[env] Variável obrigatória "\${name}" ausente ou vazia. \` +
        \`Defina-a em apps/${slug}/.env ou no .env da raiz (nunca com prefixo VITE_).\`,
    );
  }
  return value;
}

/**
 * Connection string OWNER (segredo real). Use SÓ em scripts admin
 * (migrate/grants/provision). O RUNTIME da API usa os roles de menor privilégio.
 */
export function getDatabaseUrl(): string {
  return process.env.NEON_DATABASE_URL?.trim() || requireEnv('DATABASE_URL');
}

let warnedAuthUrl = false;
let warnedQueryUrl = false;

/** Role \`app_auth\` (R/W só nas tabelas do Better Auth). Fallback DEV: owner (WARN). */
export function getAuthDatabaseUrl(): string {
  const url = process.env.AUTH_DATABASE_URL?.trim();
  if (url) return url;
  if (!warnedAuthUrl) {
    console.warn(
      '[env] AUTH_DATABASE_URL ausente — Better Auth usará a connection string OWNER ' +
        '(fallback de DEV). Defina AUTH_DATABASE_URL em produção.',
    );
    warnedAuthUrl = true;
  }
  return getDatabaseUrl();
}

/** Role \`app_query\` (SELECT só nas views v_*). Fallback DEV: owner (WARN). */
export function getQueryDatabaseUrl(): string {
  const url = process.env.QUERY_DATABASE_URL?.trim();
  if (url) return url;
  if (!warnedQueryUrl) {
    console.warn(
      '[env] QUERY_DATABASE_URL ausente — /api/query usará a connection string OWNER ' +
        '(fallback de DEV). Defina QUERY_DATABASE_URL em produção.',
    );
    warnedQueryUrl = true;
  }
  return getDatabaseUrl();
}

export function getAuthSecret(): string {
  return requireEnv('BETTER_AUTH_SECRET');
}

export function getAuthUrl(): string {
  return process.env.BETTER_AUTH_URL?.trim() || 'http://localhost:5173';
}

export function getApiPort(): number {
  const raw = process.env.API_PORT?.trim();
  const port = raw ? Number(raw) : 8787;
  return Number.isFinite(port) && port > 0 ? port : 8787;
}
`;
}

export function apiAuth(slug: string): string {
  return `/**
 * apps/${slug} — Better Auth (doc 05, §5). Email + senha, adapter Drizzle
 * (provider "pg") sobre o Neon do cliente. O segredo (\`BETTER_AUTH_SECRET\`) é
 * server-side; nunca vai ao bundle. \`dbAuth\` = role \`app_auth\`.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { dbAuth, schema } from '../db/client';
import { getAuthSecret, getAuthUrl } from './env';

export const auth = betterAuth({
  secret: getAuthSecret(),
  baseURL: getAuthUrl(),
  basePath: '/api/auth',
  database: drizzleAdapter(dbAuth, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  trustedOrigins: [getAuthUrl()],
});

export type Auth = typeof auth;
`;
}

/** Idêntico ao dobro — construção segura de SQL (allowlist + bind params). */
export function apiQueryBuilder(): string {
  return `/**
 * Construção SEGURA de SQL para /api/query (doc 05, §4, Defesa 3).
 *
 * - VIEW e COLUNAS são IDENTIFICADORES → passam pela allowlist e são citados via
 *   \`sql.identifier(...)\`, NUNCA interpolados crus.
 * - VALORES (where[].value, limit) → SEMPRE bind params via o template \`sql\`.
 * - \`op\`/\`dir\` → validados contra conjuntos FECHADOS. \`limit\` → coerção + teto.
 */

import { sql, type SQL } from 'drizzle-orm';
import { getAllowedView, isKnownColumn, type AllowedView } from './query-allowlist';

const ALLOWED_OPS = ['=', '!=', '>', '>=', '<', '<=', 'in', 'like'] as const;
type AllowedOp = (typeof ALLOWED_OPS)[number];

const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 100;

export class QueryValidationError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'QueryValidationError';
    this.status = status;
  }
}

export interface QueryRequest {
  view?: string;
  table?: string;
  select?: string[];
  where?: Array<{ field: string; op: string; value: unknown }>;
  orderBy?: Array<{ field: string; dir: string }>;
  limit?: number;
}

export interface QueryVars {
  period: string;
  clientId: string;
}

function resolveValue(value: unknown, vars: QueryVars): unknown {
  if (value && typeof value === 'object' && 'ref' in value) {
    const ref = (value as { ref: string }).ref;
    if (ref === 'period') return vars.period;
    if (ref === 'clientId') return vars.clientId;
    throw new QueryValidationError(\`ref desconhecida: "\${ref}"\`, 400);
  }
  return value;
}

function assertOp(op: string): AllowedOp {
  if (!(ALLOWED_OPS as readonly string[]).includes(op)) {
    throw new QueryValidationError(\`operador não permitido: "\${op}"\`, 400);
  }
  return op as AllowedOp;
}

function assertDir(dir: string): 'asc' | 'desc' {
  if (dir !== 'asc' && dir !== 'desc') {
    throw new QueryValidationError(\`direção inválida: "\${dir}"\`, 400);
  }
  return dir;
}

function assertColumn(view: AllowedView, field: string): string {
  if (!isKnownColumn(view, field)) {
    throw new QueryValidationError(\`coluna "\${field}" não é conhecida da view "\${view.view}"\`, 400);
  }
  return field;
}

export function buildSecureQuery(req: QueryRequest, vars: QueryVars): SQL {
  if (req.table) {
    throw new QueryValidationError(
      'leitura de tabela crua não é permitida — use uma view da allowlist',
      403,
    );
  }
  const allowed = getAllowedView(req.view);
  if (!allowed) {
    throw new QueryValidationError(\`view "\${req.view ?? '(ausente)'}" não está na allowlist\`, 403);
  }

  const selectCols =
    req.select && req.select.length > 0
      ? req.select.map((c) => assertColumn(allowed, c))
      : [...allowed.columns];
  const selectSql = sql.join(
    selectCols.map((c) => sql.identifier(c)),
    sql\`, \`,
  );

  let query = sql\`SELECT \${selectSql} FROM \${sql.identifier(allowed.view)}\`;

  if (req.where && req.where.length > 0) {
    const conditions = req.where.map((clause) => {
      const col = assertColumn(allowed, clause.field);
      const op = assertOp(clause.op);
      const value = resolveValue(clause.value, vars);

      if (op === 'in') {
        if (!Array.isArray(value)) {
          throw new QueryValidationError("operador 'in' exige um array", 400);
        }
        const list = sql.join(
          value.map((v) => sql\`\${v}\`),
          sql\`, \`,
        );
        return sql\`\${sql.identifier(col)} IN (\${list})\`;
      }

      return sql\`\${sql.identifier(col)} \${sql.raw(op)} \${value}\`;
    });
    query = sql\`\${query} WHERE \${sql.join(conditions, sql\` AND \`)}\`;
  }

  if (req.orderBy && req.orderBy.length > 0) {
    const orders = req.orderBy.map((o) => {
      const col = assertColumn(allowed, o.field);
      const dir = assertDir(o.dir);
      return sql\`\${sql.identifier(col)} \${sql.raw(dir.toUpperCase())}\`;
    });
    query = sql\`\${query} ORDER BY \${sql.join(orders, sql\`, \`)}\`;
  }

  const rawLimit = Number(req.limit);
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), MAX_LIMIT) : DEFAULT_LIMIT;
  query = sql\`\${query} LIMIT \${limit}\`;

  return query;
}
`;
}

export function apiQueryAllowlist(views: ViewSpec[]): string {
  const entries = views
    .map((v) => `  ${v.view}: {\n    view: '${v.view}',\n    columns: ${serializeToTs(v.exposed, 2).replace(/\n/g, '\n    ')},\n  },`)
    .join('\n');

  return `/**
 * ALLOWLIST de views para /api/query (doc 05, §4, Defesa 2).
 *
 * O manifesto só referencia VIEWS \`v_*\` read-only listadas AQUI, com o conjunto
 * FECHADO de colunas. View fora da lista → 403; coluna fora → 400. Reforçado no
 * banco pelo GRANT (o role da API lê só as views, nunca as tabelas base).
 *
 * Gerado pelo scaffolder a partir dos menus \`kind:'query'\` do manifesto. Uma
 * tela nova = uma view read-only nova aqui + no banco (db/views.sql + grants).
 */

export interface AllowedView {
  /** Nome exato da view no Postgres (DEVE começar com \`v_\`). */
  view: string;
  /** Conjunto FECHADO de colunas consultáveis (select/where/orderBy). */
  columns: readonly string[];
}

const ALLOWED_VIEWS: Record<string, AllowedView> = {
${entries}
};

export function getAllowedView(name: string | undefined): AllowedView | undefined {
  if (!name) return undefined;
  return ALLOWED_VIEWS[name];
}

export function isKnownColumn(view: AllowedView, column: string): boolean {
  return view.columns.includes(column);
}
`;
}

export function apiApp(slug: string): string {
  return `/**
 * apps/${slug} — app Hono: Better Auth + /api/query genérico e SEGURO.
 *
 * Defesas: (1) auth-first (401 sem sessão antes de tocar o banco);
 * (2) allowlist de views (403/400); (3) SQL parametrizado (bind).
 */

import { Hono } from 'hono';
import { auth } from './auth';
import { dbQuery } from '../db/client';
import { buildSecureQuery, QueryValidationError, type QueryRequest } from './query-builder';

export const app = new Hono();

app.get('/api/health', (c) => c.json({ ok: true }));

app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

app.post('/api/query', async (c) => {
  // DEFESA 1 — auth-first (fail-closed).
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: 'Não autenticado' }, 401);
  }

  let body: QueryRequest;
  try {
    body = (await c.req.json()) as QueryRequest;
  } catch {
    return c.json({ error: 'JSON inválido no corpo' }, 400);
  }

  const vars = {
    period:
      typeof body === 'object' && body && 'period' in body
        ? String((body as Record<string, unknown>).period ?? 'monthly')
        : 'monthly',
    clientId: session.user.id,
  };

  try {
    // DEFESAS 2 + 3 — allowlist + bind. Executa como app_query (SELECT só nas views).
    const query = buildSecureQuery(body, vars);
    const rows = await dbQuery.execute(query);
    const data = Array.isArray(rows) ? rows : (rows as { rows?: unknown[] }).rows ?? [];
    return c.json({ data });
  } catch (err) {
    if (err instanceof QueryValidationError) {
      return c.json({ error: err.message }, err.status as 400 | 403);
    }
    console.error('[query] erro inesperado:', err instanceof Error ? err.message : err);
    return c.json({ error: 'Erro ao resolver a query' }, 500);
  }
});
`;
}

export function apiServer(slug: string): string {
  return `/**
 * apps/${slug} — servidor de DEV da API (Hono via @hono/node-server).
 * O Vite (dev) faz proxy de /api → esta porta (default 8787). Em produção o
 * mesmo \`app\` vira funções serverless.
 */

import { serve } from '@hono/node-server';
import { app } from './app';
import { getApiPort } from './env';

const port = getApiPort();

serve({ fetch: app.fetch, port }, (info) => {
  console.log(\`[api] Hono ouvindo em http://localhost:\${info.port} (proxied via Vite /api)\`);
});
`;
}

export function apiCreateUser(slug: string, displayName: string): string {
  return `/**
 * apps/${slug} — provisiona um usuário via Better Auth (signUpEmail).
 * Idempotente: se o email já existir, apenas reporta.
 *
 * Uso:
 *   pnpm auth:create-user                     # cria o admin default (DEV)
 *   pnpm auth:create-user email senha nome    # customizado
 */

import { auth } from '../auth';

const [, , emailArg, passwordArg, nameArg] = process.argv;

const email = emailArg ?? 'admin@${slug}.local';
const password = passwordArg ?? '${slug}-dev-2026';
const name = nameArg ?? 'Admin ${displayName.replace(/'/g, "\\'")}';

async function main(): Promise<void> {
  try {
    await auth.api.signUpEmail({ body: { email, password, name } });
    console.log(\`[create-user] usuário criado: \${email}\`);
    console.log(\`[create-user] senha (DEV, não é segredo real): \${password}\`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/exist|already|unique|duplicate/i.test(msg)) {
      console.log(\`[create-user] usuário \${email} já existe — nada a fazer.\`);
      return;
    }
    console.error('[create-user] FALHOU:', msg);
    process.exit(1);
  }
}

main();
`;
}
