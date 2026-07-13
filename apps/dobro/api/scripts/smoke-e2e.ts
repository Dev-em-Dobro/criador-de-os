/**
 * apps/dobro — smoke test e2e do RUNTIME com os roles de menor privilégio (Fase 3).
 *
 * Exercita o app Hono de verdade (via app.request, sem abrir porta), contra a
 * Neon real, provando que o hardening NÃO quebrou o caminho feliz:
 *   1. sign-in (Better Auth via `app_auth`) ESCREVE sessão → 200 + cookie;
 *   2. /api/query SEM sessão → 401 (fail-closed);
 *   3. /api/query COM sessão (leitura via `app_query`) → 200 + data.
 *
 * Idempotente: garante o usuário de teste antes (signUpEmail). Efeito colateral
 * aceitável em DEV: cria uma linha em `session`. Credenciais são de DEV (não
 * são segredo real).
 */

import { app } from '../app';
import { auth } from '../auth';

const EMAIL = 'admin@dobro.local';
const PASSWORD = 'dobro-dev-2026';

/** Junta todos os cookies do Set-Cookie num header `cookie` (nome=valor; ...). */
function extractCookies(res: Response): string | null {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] };
  const all =
    typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : [res.headers.get('set-cookie')].filter((v): v is string => !!v);
  const pairs = all.map((c) => c.split(';')[0]).filter(Boolean);
  return pairs.length ? pairs.join('; ') : null;
}

async function ensureUser(): Promise<void> {
  try {
    await auth.api.signUpEmail({ body: { email: EMAIL, password: PASSWORD, name: 'Admin Dobro' } });
  } catch {
    // Já existe (unique) → nada a fazer. Escrita em user/account prova app_auth.
  }
}

async function main(): Promise<void> {
  console.log('[smoke-e2e] runtime com roles de menor privilégio\n');
  await ensureUser();

  // 1) sign-in — Better Auth (app_auth) escreve uma sessão.
  const signIn = await app.request('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const cookie = extractCookies(signIn);
  console.log(`  sign-in (escreve sessão via app_auth) → ${signIn.status} ${cookie ? '· cookie ✓' : '· SEM cookie (!)'}`);

  // 2) /api/query SEM sessão → 401.
  const noAuth = await app.request('/api/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ view: 'v_visao_geral', select: ['receita'], limit: 1 }),
  });
  console.log(`  /api/query sem sessão                 → ${noAuth.status} (esperado 401)`);

  // 3) /api/query COM sessão — leitura via app_query.
  const withAuth = await app.request('/api/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: cookie ?? '' },
    body: JSON.stringify({ view: 'v_visao_geral', select: ['receita', 'conversao'], limit: 1 }),
  });
  const payload = (await withAuth.json()) as { data?: unknown[]; error?: string };
  const rows = Array.isArray(payload.data) ? payload.data.length : 0;
  console.log(`  /api/query com sessão (lê via app_query) → ${withAuth.status} · ${rows} linha(s)`);

  const pass =
    signIn.status === 200 && !!cookie && noAuth.status === 401 && withAuth.status === 200;
  console.log(
    pass
      ? '\n[smoke-e2e] OK — login (app_auth) + query (app_query) funcionam com least privilege.'
      : `\n[smoke-e2e] FALHOU — sign-in=${signIn.status} noAuth=${noAuth.status} withAuth=${withAuth.status}`,
  );
  if (!pass) process.exit(1);
}

main().catch((err) => {
  console.error('[smoke-e2e] erro:', err instanceof Error ? err.message : err);
  process.exit(1);
});
