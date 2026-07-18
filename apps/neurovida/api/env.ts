/**
 * apps/neurovida — carregamento de ambiente SERVER-SIDE.
 *
 * Segredos vivem SÓ aqui (server), NUNCA no bundle do client. Lê o `.env` do
 * app primeiro e o `.env` da RAIZ do monorepo como fallback. NUNCA loga valores.
 */

import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..'); // apps/neurovida

// Carrega SÓ o .env DESTE app (isolamento por cliente). Neurovida NÃO herda o
// .env da RAIZ de propósito: a raiz tem a connection string de OUTRO cliente
// (dobro) — herdá-la faria as migrations do neurovida irem para o banco errado.
// Cada cliente = 1 Neon; cada app carrega só os próprios segredos.
const envPath = resolve(appRoot, '.env');
if (existsSync(envPath)) loadDotenv({ path: envPath, override: false });

/** Lê uma variável obrigatória; erro claro (sem vazar o valor) se ausente. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `[env] Variável obrigatória "${name}" ausente. Defina-a em apps/neurovida/.env ` +
        `ou no .env da raiz (nunca com prefixo VITE_).`,
    );
  }
  return value.trim();
}

// ============================================================
// Neon (Postgres) — connection strings server-side
// ============================================================

/**
 * Connection string OWNER do PRÓPRIO Neon do neurovida (apps/neurovida/.env).
 * Segredo real — use SÓ em scripts admin (migrate/grants/provision). O RUNTIME
 * da API usa o role de menor privilégio (getAuthDatabaseUrl). NÃO lê
 * `NEON_DATABASE_URL` (essa é a canônica de OUTRO cliente na raiz) — isolamento.
 */
export function getDatabaseUrl(): string {
  return requireEnv('DATABASE_URL');
}

let warnedAuthUrl = false;

/** true quando rodando em produção (deploy real). */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Connection string do role `app_auth` (R/W nas tabelas de auth + app_settings).
 * Usada pelo runtime (Better Auth + /api/settings). Produção: fail-closed. Fallback DEV: owner (WARN único).
 */
export function getAuthDatabaseUrl(): string {
  const url = process.env.AUTH_DATABASE_URL?.trim();
  if (url) return url;
  // Fail-closed: em produção JAMAIS cair no owner. Sem o role, aborta o boot.
  if (isProduction()) {
    throw new Error(
      '[env] AUTH_DATABASE_URL ausente em produção. O runtime NÃO pode usar a ' +
        'connection string OWNER (a defesa de role app_auth ficaria inativa). ' +
        'Rode `pnpm db:provision-roles` e defina AUTH_DATABASE_URL.',
    );
  }
  if (!warnedAuthUrl) {
    console.warn(
      '[env] AUTH_DATABASE_URL ausente — o runtime usará a connection string OWNER ' +
        '(fallback de DEV). Defina AUTH_DATABASE_URL em produção (pnpm db:provision-roles).',
    );
    warnedAuthUrl = true;
  }
  return getDatabaseUrl();
}

// ============================================================
// Better Auth
// ============================================================

/** Segredo que assina as sessões do Better Auth. Server-side. */
export function getAuthSecret(): string {
  return requireEnv('BETTER_AUTH_SECRET');
}

/** URL base pública do app (para o Better Auth). Não é segredo. */
export function getAuthUrl(): string {
  return process.env.BETTER_AUTH_URL?.trim() || 'http://localhost:5173';
}

// ============================================================
// Configurações do cliente (BYOK) — cifra em repouso
// ============================================================

/**
 * Chave de cifra (server-side) usada para criptografar os segredos que o CLIENTE
 * salva em Configurações (ex.: a própria chave da Anthropic — modelo BYOK). NÃO é
 * a chave de API do cliente; é o segredo que protege o armazenamento dela no Neon.
 * Default seguro: deriva do `BETTER_AUTH_SECRET` (já obrigatório) se não houver
 * `SETTINGS_ENC_KEY` própria.
 */
export function getSettingsEncKey(): string {
  return process.env.SETTINGS_ENC_KEY?.trim() || getAuthSecret();
}

/**
 * Chave da Anthropic da AGÊNCIA (fallback de DEV para o Estúdio IA quando o
 * cliente ainda não configurou a própria em Configurações). Opcional: retorna
 * null se ausente — o caminho BYOK (chave do cliente) é o primário.
 */
export function getAgencyAnthropicKey(): string | null {
  return process.env.ANTHROPIC_API_KEY?.trim() || null;
}

/** Porta local da API Hono (dev). O Vite faz proxy de /api → esta porta. */
export function getApiPort(): number {
  const raw = process.env.NEUROVIDA_API_PORT?.trim();
  const port = raw ? Number(raw) : 8788;
  return Number.isFinite(port) && port > 0 ? port : 8788;
}
