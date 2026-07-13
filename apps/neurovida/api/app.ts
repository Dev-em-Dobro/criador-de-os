/**
 * apps/neurovida — app Hono do protótipo.
 *
 * Rotas:
 *  - GET  /api/health           → sonda simples (sem segredo).
 *  - POST /api/agents/carousel  → "agente" gerador de carrossel científico.
 *
 * A API key da Claude vive SÓ aqui (server-side), nunca no bundle do front.
 */

import { Hono } from 'hono';
import { generateCarousel } from './carousel';

export const app = new Hono();

app.get('/api/health', (c) => c.json({ ok: true }));

app.post('/api/agents/carousel', async (c) => {
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

  try {
    const carousel = await generateCarousel(tema, slides);
    return c.json(carousel);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Não vaza a key; só a mensagem de erro (útil p/ diagnóstico do operador).
    console.error('[carousel] erro:', msg);
    return c.json({ error: msg }, 500);
  }
});
