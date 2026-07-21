/**
 * @os/core — implementação concreta do `OsClient` (doc 03, §4.1 + doc 05).
 *
 * O `OsClient` é um CLIENTE DE API (wrapper de `fetch`), não um "db". Ele:
 *  - `query(binding, vars)` → POST `{baseUrl}{queryPath}` com o dataSource
 *    declarativo + `period/clientId` (o backend resolve com segurança);
 *  - `rest(url, init)` → fetch numa rota custom do app (kind:'rest');
 *  - `getSession()` / `signOut()` → Better Auth via `{baseUrl}{authPath}/*`.
 *
 * NENHUM segredo aqui: só a base URL pública (de `manifest.dataApi`). A
 * connection string da Neon vive server-side. O cookie de sessão (HttpOnly) vai
 * junto via `credentials:'include'` — o core nunca lê nem escreve o cookie.
 */

import type { DataSourceBinding } from '../manifest/types';
import type { OsClient, DataSourceVars } from './DataAdapter';

/** Config pública do cliente de API (vem de `manifest.dataApi`). */
export interface OsClientConfig {
  /** Base URL da API do app (vazio = mesma origem, /api/*). */
  baseUrl: string;
  /** Caminho do endpoint de query genérico. Default: "/api/query". */
  queryPath?: string;
  /** Caminho base de auth (Better Auth). Default: "/api/auth". */
  authPath?: string;
}

/** Sessão mínima que o core precisa conhecer (o resto é opaco). */
export interface OsSession {
  user: { id: string; email?: string; name?: string };
}

/** Junta base URL + path sem barra dupla nem barra faltando. */
function joinUrl(baseUrl: string, path: string): string {
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Extrai uma mensagem de erro legível do corpo da resposta (se houver). */
async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body && typeof body.error === 'string') return body.error;
  } catch {
    /* corpo não-JSON — cai no fallback abaixo */
  }
  return `HTTP ${res.status}`;
}

/**
 * Cria um `OsClient` concreto. O app passa a config (de `manifest.dataApi`) e
 * injeta o cliente no `OsApp`; o core usa `client.query()` no `useDataSource`.
 */
export function createOsClient(config: OsClientConfig): OsClient & {
  getSession(): Promise<OsSession | null>;
  signOut(): Promise<void>;
  signInEmail(email: string, password: string): Promise<void>;
} {
  const queryUrl = joinUrl(config.baseUrl, config.queryPath ?? '/api/query');
  const authBase = joinUrl(config.baseUrl, config.authPath ?? '/api/auth');

  return {
    async query(binding: DataSourceBinding, vars: DataSourceVars): Promise<unknown> {
      // Envia o dataSource declarativo + as vars do shell. O backend valida
      // (allowlist) e monta o SQL parametrizado — o core NUNCA monta SQL.
      const res = await fetch(queryUrl, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...binding, period: vars.period, clientId: vars.clientId }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      const payload = (await res.json()) as { data?: unknown };
      return payload.data ?? [];
    },

    async rest(url: string, init?: RequestInit): Promise<unknown> {
      const res = await fetch(joinUrl(config.baseUrl, url), {
        credentials: 'include',
        ...init,
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      return res.json();
    },

    async getSession(): Promise<OsSession | null> {
      const res = await fetch(joinUrl(authBase, '/get-session'), {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as OsSession | null;
      // Better Auth devolve `null` (ou `{}`) quando não há sessão.
      return data && 'user' in data ? data : null;
    },

    async signInEmail(email: string, password: string): Promise<void> {
      const res = await fetch(joinUrl(authBase, '/sign-in/email'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
    },

    async signOut(): Promise<void> {
      // Corpo `{}` obrigatório: com `Content-Type: application/json` e corpo vazio,
      // o Better Auth tenta parsear JSON do nada e responde 400 ("Invalid JSON in
      // request body"), deixando a sessão ativa. Um objeto vazio satisfaz o parser.
      await fetch(joinUrl(authBase, '/sign-out'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    },
  };
}
