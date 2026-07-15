/**
 * apps/neurovida — app Hono.
 *
 * As capacidades genéricas (Configurações/BYOK, leads, faturas por IA) vêm do
 * pacote de fábrica @os/server via `mountApi` — a lógica vive lá, uma vez. Aqui
 * ficam só: health, Better Auth, e o que é ESPECÍFICO da neurovida (o Estúdio IA
 * de carrossel). Todas as rotas de negócio são auth-first.
 */

import { Hono } from 'hono';
import { mountApi, mountAssistant, makeFinanceAssistant, type ServerDb } from '@os/server';
import { auth } from './auth';
import { dbAuth } from '../db/client';
import { generateCarousel } from './carousel';
import { getAgencyAnthropicKey, getSettingsEncKey } from './env';

export const app = new Hono();

app.get('/api/health', (c) => c.json({ ok: true }));

// Better Auth: todas as rotas /api/auth/**.
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

// Capacidades de fábrica: /api/settings, /api/leads/*, /api/invoices/*.
const api = mountApi(app, {
  auth,
  db: dbAuth as unknown as ServerDb,
  settingsEncKey: getSettingsEncKey,
  agencyAnthropicKey: getAgencyAnthropicKey,
});

/** Resolve a chave BYOK do cliente (Configurações) com fallback DEV da agência. */
async function resolveAnthropicKey(): Promise<string | null> {
  return (await api.getSettingValue('anthropic_api_key')) ?? getAgencyAnthropicKey();
}

// Copilotos flutuantes (assistentes de IA por seção) — /api/assistant/:key/*.
// O analista financeiro vem PRONTO da fábrica (@os/server); o front só declara
// `assistant` no menu Financeiro com contextKey: 'financas'. Auth-first + BYOK.
mountAssistant(app, {
  auth,
  resolveApiKey: resolveAnthropicKey,
  providers: {
    financas: makeFinanceAssistant(dbAuth as unknown as ServerDb),
  },
});

// --- Estúdio IA (carrossel) — específico da neurovida; usa a chave BYOK ---
app.post('/api/agents/carousel', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'Não autenticado' }, 401);

  let body: { tema?: unknown; slides?: unknown };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ error: 'JSON inválido no corpo' }, 400);
  }
  const tema = typeof body.tema === 'string' ? body.tema.trim() : '';
  if (tema.length < 3) return c.json({ error: 'Informe um tema (mínimo 3 caracteres).' }, 400);
  const slides =
    typeof body.slides === 'number' && body.slides >= 3 && body.slides <= 10 ? Math.floor(body.slides) : 6;

  const apiKey = (await api.getSettingValue('anthropic_api_key')) ?? getAgencyAnthropicKey();
  if (!apiKey) {
    return c.json({ error: 'Nenhuma chave de API configurada. Adicione a sua em Configurações.' }, 400);
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
