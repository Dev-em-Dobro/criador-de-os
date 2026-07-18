/**
 * apps/dobro — carregamento de ambiente SERVER-SIDE (doc 05, §6).
 *
 * Segredos vivem SÓ aqui (server), NUNCA no bundle do client. Regra de ouro:
 * nenhuma variável com prefixo `VITE_` — o Vite injeta `VITE_*` no bundle.
 *
 * Fonte dos segredos, em ordem de precedência:
 *   1. `apps/dobro/.env`   (por app — placeholders versionados em .env.example)
 *   2. `.env` da RAIZ do monorepo (onde vive `NEON_DATABASE_URL` neste projeto)
 *   3. `process.env` já populado pelo shell/CI
 *
 * NUNCA logamos o valor da connection string. Só expomos se está presente.
 */

import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..'); // apps/dobro
const repoRoot = resolve(appRoot, '..', '..'); // raiz do monorepo

// Carrega o .env do app primeiro (se existir), depois o da raiz como fallback.
// `override: false` garante que o primeiro que definir uma chave vence.
for (const dir of [appRoot, repoRoot]) {
  const envPath = resolve(dir, '.env');
  if (existsSync(envPath)) {
    loadDotenv({ path: envPath, override: false });
  }
}

/** Lê uma variável obrigatória; lança erro CLARO (sem vazar o valor) se ausente. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `[env] Variável obrigatória "${name}" ausente ou vazia. ` +
        `Defina-a em apps/dobro/.env ou no .env da raiz do repo (nunca com prefixo VITE_).`,
    );
  }
  return value;
}

/**
 * Connection string da Neon com privilégio de OWNER. Segredo REAL — só server-side.
 * Neste projeto a chave canônica é `NEON_DATABASE_URL` (no .env da raiz);
 * aceitamos também `DATABASE_URL` como alias por app (doc 05 usa esse nome).
 *
 * ⚠️ OWNER lê/escreve/DROP tudo — use SÓ em scripts admin (migrate/seed/grants).
 * O RUNTIME da API exposta usa os roles de menor privilégio abaixo.
 */
export function getDatabaseUrl(): string {
  return process.env.NEON_DATABASE_URL?.trim() || requireEnv('DATABASE_URL');
}

// Fase 3 — hardening (doc 05, §4/§6): a API não conecta como owner. Dois
// caminhos, dois roles de menor privilégio, cada um com sua connection string.
// FALLBACK de DEV: sem a var do papel, cai no owner e AVISA (uma vez) que a
// defesa no nível do banco não está ativa. Em PRODUÇÃO é FAIL-CLOSED: sem o
// role, o boot ABORTA — JAMAIS caímos no owner num deploy real.
let warnedAuthUrl = false;
let warnedQueryUrl = false;

/** true quando rodando em produção (deploy real). */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Connection string do role `app_auth` (R/W só nas tabelas do Better Auth).
 * Usada pelo handler `/api/auth/*`. Produção: fail-closed. Fallback DEV: owner (WARN único).
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
      '[env] AUTH_DATABASE_URL ausente — Better Auth usará a connection string OWNER ' +
        '(fallback de DEV). A defesa de role (app_auth) NÃO está ativa; defina AUTH_DATABASE_URL em produção.',
    );
    warnedAuthUrl = true;
  }
  return getDatabaseUrl();
}

/**
 * Connection string do role `app_query` (SELECT só nas views `v_*`).
 * Usada pelo endpoint `/api/query`. Produção: fail-closed. Fallback DEV: owner (WARN único).
 */
export function getQueryDatabaseUrl(): string {
  const url = process.env.QUERY_DATABASE_URL?.trim();
  if (url) return url;
  // Fail-closed: em produção JAMAIS cair no owner. Sem o role, aborta o boot.
  if (isProduction()) {
    throw new Error(
      '[env] QUERY_DATABASE_URL ausente em produção. O /api/query NÃO pode usar a ' +
        'connection string OWNER (a defesa de role app_query ficaria inativa). ' +
        'Rode `pnpm db:provision-roles` e defina QUERY_DATABASE_URL.',
    );
  }
  if (!warnedQueryUrl) {
    console.warn(
      '[env] QUERY_DATABASE_URL ausente — /api/query usará a connection string OWNER ' +
        '(fallback de DEV). A defesa de role (app_query) NÃO está ativa; defina QUERY_DATABASE_URL em produção.',
    );
    warnedQueryUrl = true;
  }
  return getDatabaseUrl();
}

/** Segredo que assina as sessões do Better Auth. Server-side. */
export function getAuthSecret(): string {
  return requireEnv('BETTER_AUTH_SECRET');
}

/** URL base pública da API (para o Better Auth). Não é segredo. */
export function getAuthUrl(): string {
  return process.env.BETTER_AUTH_URL?.trim() || 'http://localhost:5173';
}

/** Porta local da API Hono (dev). Não é segredo. */
export function getApiPort(): number {
  const raw = process.env.API_PORT?.trim();
  const port = raw ? Number(raw) : 8787;
  return Number.isFinite(port) && port > 0 ? port : 8787;
}
