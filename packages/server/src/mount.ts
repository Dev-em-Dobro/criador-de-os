/**
 * @os/server — monta as rotas das capacidades genéricas num app Hono.
 *
 * O app injeta `auth` (Better Auth), `db` (client Drizzle do runtime), o segredo
 * de cifra e a chave da agência (fallback DEV). Todas as rotas são auth-first.
 * Retorna `getSettingValue` para o app usar em rotas próprias (ex.: um agente de
 * IA que precisa da chave BYOK).
 */

import type { Hono } from 'hono';
import type { ServerDb } from './db';
import { KNOWN_SETTINGS, makeSettings } from './settings';
import { isKnownSource, makeLeads } from './leads';
import { makeInvoices } from './invoices';
import { extractInvoice } from './invoice-extract';
import { isScoringSpec } from './scoring';
import { makeHotmart } from './hotmart';

/** Forma mínima do Better Auth que usamos (evita depender do pacote nos tipos). */
export interface AuthLike {
  api: { getSession(args: { headers: Headers }): Promise<{ user: { id: string } } | null> };
}

export interface ServerDeps {
  auth: AuthLike;
  db: ServerDb;
  /** Segredo server-side que cifra as settings (BYOK) em repouso. */
  settingsEncKey: () => string;
  /** Chave da agência (fallback DEV quando o cliente não configurou a própria). */
  agencyAnthropicKey: () => string | null;
}

export interface MountedApi {
  getSettingValue(key: string): Promise<string | null>;
}

/** Monta /api/settings, /api/leads/*, /api/invoices/* no app. Auth-first. */
export function mountApi(app: Hono, deps: ServerDeps): MountedApi {
  const settings = makeSettings(deps.db, deps.settingsEncKey);
  const leads = makeLeads(deps.db);
  const invoices = makeInvoices(deps.db);
  const hotmart = makeHotmart(deps.db, settings.getSettingValue);

  const uid = async (headers: Headers): Promise<string | null> =>
    (await deps.auth.api.getSession({ headers }))?.user.id ?? null;

  // ---- Configurações (BYOK) ----
  app.get('/api/settings', async (c) => {
    if (!(await uid(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
    return c.json({ settings: await settings.getSettingsStatus() });
  });

  app.put('/api/settings/:key', async (c) => {
    if (!(await uid(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
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
    const hint = await settings.setSetting(key, value);
    return c.json({ configured: true, hint });
  });

  app.delete('/api/settings/:key', async (c) => {
    if (!(await uid(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
    const key = c.req.param('key');
    if (!KNOWN_SETTINGS[key]) return c.json({ error: 'Configuração desconhecida' }, 404);
    await settings.deleteSetting(key);
    return c.json({ configured: false });
  });

  // ---- Leads ----
  app.get('/api/leads/summary', async (c) => {
    if (!(await uid(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
    return c.json(await leads.getLeadsSummary());
  });

  app.post('/api/leads/import/:source', async (c) => {
    if (!(await uid(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
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
      return c.json(await leads.importCsv(source, csv));
    } catch (err) {
      console.error('[leads/import] erro:', err instanceof Error ? err.message : err);
      return c.json({ error: 'Falha ao importar o CSV.' }, 500);
    }
  });

  app.post('/api/leads/merge', async (c) => {
    if (!(await uid(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
    try {
      return c.json(await leads.mergeLeads());
    } catch (err) {
      console.error('[leads/merge] erro:', err instanceof Error ? err.message : err);
      return c.json({ error: 'Falha ao consolidar os leads.' }, 500);
    }
  });

  app.post('/api/leads/score', async (c) => {
    if (!(await uid(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
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
      return c.json(await leads.scoreLeads(body.scoring));
    } catch (err) {
      console.error('[leads/score] erro:', err instanceof Error ? err.message : err);
      return c.json({ error: 'Falha ao pontuar os leads.' }, 500);
    }
  });

  app.get('/api/leads/list', async (c) => {
    if (!(await uid(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
    const segment = c.req.query('segment') || null;
    const limit = Number(c.req.query('limit')) || 100;
    try {
      return c.json({ leads: await leads.listLeads(segment, limit) });
    } catch (err) {
      console.error('[leads/list] erro:', err instanceof Error ? err.message : err);
      return c.json({ error: 'Falha ao listar os leads.' }, 500);
    }
  });

  // ---- Faturas (PDF por IA) ----
  app.get('/api/invoices', async (c) => {
    if (!(await uid(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
    return c.json(await invoices.getInvoices());
  });

  app.post('/api/invoices/upload', async (c) => {
    if (!(await uid(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
    let body: { filename?: unknown; pdfBase64?: unknown };
    try {
      body = (await c.req.json()) as typeof body;
    } catch {
      return c.json({ error: 'JSON inválido no corpo' }, 400);
    }
    const filename = typeof body.filename === 'string' && body.filename.trim() ? body.filename.trim() : 'fatura.pdf';
    const pdfBase64 = typeof body.pdfBase64 === 'string' ? body.pdfBase64 : '';
    if (pdfBase64.length < 100) return c.json({ error: 'PDF ausente ou inválido.' }, 400);

    const apiKey = (await settings.getSettingValue('anthropic_api_key')) ?? deps.agencyAnthropicKey();
    if (!apiKey) return c.json({ error: 'Nenhuma chave de API configurada. Adicione a sua em Configurações.' }, 400);

    try {
      const extracted = await extractInvoice(apiKey, pdfBase64);
      if (extracted.items.length === 0) {
        return c.json({ error: 'Não encontrei lançamentos neste PDF. Confira se é uma fatura de cartão.' }, 422);
      }
      return c.json(await invoices.saveInvoice(filename, extracted));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[invoices/upload] erro:', msg);
      return c.json({ error: msg }, 500);
    }
  });

  app.delete('/api/invoices/:id', async (c) => {
    if (!(await uid(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
    await invoices.deleteInvoice(c.req.param('id'));
    return c.json({ ok: true });
  });

  // ---- Faturamento (Hotmart) — só agregados ----
  app.get('/api/hotmart/metrics', async (c) => {
    if (!(await uid(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
    return c.json(await hotmart.getMetrics());
  });

  app.post('/api/hotmart/sync', async (c) => {
    if (!(await uid(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
    let months = 12;
    try {
      const body = (await c.req.json()) as { months?: unknown };
      if (typeof body.months === 'number' && body.months >= 1 && body.months <= 24) {
        months = Math.floor(body.months);
      }
    } catch {
      /* corpo opcional — usa o default de 12 meses */
    }
    try {
      const report = await hotmart.sync({ months });
      const metrics = await hotmart.getMetrics();
      return c.json({ report, ...metrics });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[hotmart/sync] erro:', msg); // não vaza credencial
      return c.json({ error: msg }, 400);
    }
  });

  return { getSettingValue: settings.getSettingValue };
}
