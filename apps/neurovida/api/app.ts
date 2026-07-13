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
import { getLeadsSummary, importCsv, isKnownSource, listLeads, mergeLeads, scoreLeads } from './leads';
import { isScoringSpec } from './scoring';

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

// --- Leads: ingestão (CSV por fonte) + consolidação (merge/dedup) ---
app.get('/api/leads/summary', async (c) => {
  if (!(await requireSession(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
  return c.json(await getLeadsSummary());
});

app.post('/api/leads/import/:source', async (c) => {
  if (!(await requireSession(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
  const source = c.req.param('source');
  if (!isKnownSource(source)) return c.json({ error: 'Fonte desconhecida' }, 404);

  let body: { csv?: unknown };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ error: 'JSON inválido no corpo' }, 400);
  }
  const csv = typeof body.csv === 'string' ? body.csv : '';
  if (csv.trim().length === 0) return c.json({ error: 'CSV vazio.' }, 400);

  try {
    const result = await importCsv(source, csv);
    return c.json(result);
  } catch (err) {
    console.error('[leads/import] erro:', err instanceof Error ? err.message : err);
    return c.json({ error: 'Falha ao importar o CSV.' }, 500);
  }
});

app.post('/api/leads/merge', async (c) => {
  if (!(await requireSession(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
  try {
    return c.json(await mergeLeads());
  } catch (err) {
    console.error('[leads/merge] erro:', err instanceof Error ? err.message : err);
    return c.json({ error: 'Falha ao consolidar os leads.' }, 500);
  }
});

app.post('/api/leads/score', async (c) => {
  if (!(await requireSession(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
  let body: { scoring?: unknown };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ error: 'JSON inválido no corpo' }, 400);
  }
  if (!isScoringSpec(body.scoring)) {
    return c.json({ error: 'Régua de pontuação (scoring) ausente ou inválida no manifesto.' }, 400);
  }
  try {
    return c.json(await scoreLeads(body.scoring));
  } catch (err) {
    console.error('[leads/score] erro:', err instanceof Error ? err.message : err);
    return c.json({ error: 'Falha ao pontuar os leads.' }, 500);
  }
});

app.get('/api/leads/list', async (c) => {
  if (!(await requireSession(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
  const segment = c.req.query('segment') || null;
  const limit = Number(c.req.query('limit')) || 100;
  try {
    return c.json({ leads: await listLeads(segment, limit) });
  } catch (err) {
    console.error('[leads/list] erro:', err instanceof Error ? err.message : err);
    return c.json({ error: 'Falha ao listar os leads.' }, 500);
  }
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
