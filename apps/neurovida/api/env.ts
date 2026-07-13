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
const repoRoot = resolve(appRoot, '..', '..'); // raiz do monorepo

for (const dir of [appRoot, repoRoot]) {
  const envPath = resolve(dir, '.env');
  if (existsSync(envPath)) loadDotenv({ path: envPath, override: false });
}

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

/** Chave da Claude API (Anthropic). Segredo REAL — só server-side. */
export function getAnthropicKey(): string {
  return requireEnv('ANTHROPIC_API_KEY');
}

/** Porta local da API Hono (dev). O Vite faz proxy de /api → esta porta. */
export function getApiPort(): number {
  const raw = process.env.NEUROVIDA_API_PORT?.trim();
  const port = raw ? Number(raw) : 8788;
  return Number.isFinite(port) && port > 0 ? port : 8788;
}
