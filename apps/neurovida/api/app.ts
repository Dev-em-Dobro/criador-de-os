/**
 * apps/neurovida — app Hono.
 *
 * Rotas:
 *  - GET  /api/health              → sonda simples (sem segredo, sem auth).
 *  - *    /api/auth/*              → Better Auth (login/sessão/logout).
 *  - GET  /api/settings           → status das configurações (BYOK) — auth.
 *  - PUT  /api/settings/:key       → grava uma configuração cifrada — auth.
 *  - DELETE /api/settings/:key     → remove uma configuração — auth.
 *  - POST /api/agents/carousel     → Estúdio IA (usa a chave BYOK do cliente) — auth.
 *
 * Segredos vivem SÓ server-side. As settings do cliente ficam CIFRADAS no Neon;
 * o valor cru nunca volta ao browser.
 */

import { Hono } from 'hono';
import { auth } from './auth';
import { generateCarousel } from './carousel';
import { getAgencyAnthropicKey } from './env';
import {
  KNOWN_SETTINGS,
  deleteSetting,
  getSettingValue,
  getSettingsStatus,
  setSetting,
} from './settings';

export const app = new Hono();

app.get('/api/health', (c) => c.json({ ok: true }));

// --- Better Auth: todas as rotas /api/auth/** ---
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

/** Exige sessão; retorna o userId ou null (o handler decide o 401). */
async function requireSession(headers: Headers): Promise<string | null> {
  const session = await auth.api.getSession({ headers });
  return session?.user.id ?? null;
}

// --- Configurações (BYOK) ---
app.get('/api/settings', async (c) => {
  if (!(await requireSession(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
  return c.json({ settings: await getSettingsStatus() });
});

app.put('/api/settings/:key', async (c) => {
  if (!(await requireSession(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
  const key = c.req.param('key');
  const spec = KNOWN_SETTINGS[key];
  if (!spec) return c.json({ error: 'Configuração desconhecida' }, 404);

  let body: { value?: unknown };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ error: 'JSON inválido no corpo' }, 400);
  }
  const value = typeof body.value === 'string' ? body.value.trim() : '';
  if (value.length < 8) return c.json({ error: 'Valor inválido (muito curto).' }, 400);
  if (spec.prefix && !value.startsWith(spec.prefix)) {
    return c.json({ error: `A chave deve começar com "${spec.prefix}".` }, 400);
  }

  const hint = await setSetting(key, value);
  return c.json({ configured: true, hint });
});

app.delete('/api/settings/:key', async (c) => {
  if (!(await requireSession(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
  const key = c.req.param('key');
  if (!KNOWN_SETTINGS[key]) return c.json({ error: 'Configuração desconhecida' }, 404);
  await deleteSetting(key);
  return c.json({ configured: false });
});

// --- Estúdio IA: gerador de carrossel (usa a chave BYOK do cliente) ---
app.post('/api/agents/carousel', async (c) => {
  if (!(await requireSession(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);

  let body: { tema?: unknown; slides?: unknown };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ error: 'JSON inválido no corpo' }, 400);
  }

  const tema = typeof body.tema === 'string' ? body.tema.trim() : '';
  if (tema.length < 3) {
    return c.json({ error: 'Informe um tema (mínimo 3 caracteres).' }, 400);
  }
  const slides =
    typeof body.slides === 'number' && body.slides >= 3 && body.slides <= 10
      ? Math.floor(body.slides)
      : 6;

  // BYOK: usa a chave do cliente (Configurações); fallback DEV = chave da agência.
  const apiKey = (await getSettingValue('anthropic_api_key')) ?? getAgencyAnthropicKey();
  if (!apiKey) {
    return c.json(
      { error: 'Nenhuma chave de API configurada. Adicione a sua em Configurações.' },
      400,
    );
  }

  try {
    const carousel = await generateCarousel(tema, slides, apiKey);
    return c.json(carousel);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[carousel] erro:', msg); // não vaza a key
    return c.json({ error: msg }, 500);
  }
});
