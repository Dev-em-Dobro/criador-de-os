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
 * Connection string da Neon. Segredo REAL — só server-side.
 * Neste projeto a chave canônica é `NEON_DATABASE_URL` (no .env da raiz);
 * aceitamos também `DATABASE_URL` como alias por app (doc 05 usa esse nome).
 */
export function getDatabaseUrl(): string {
  return process.env.NEON_DATABASE_URL?.trim() || requireEnv('DATABASE_URL');
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
