/**
 * apps/dobro — servidor de DEV da API (Hono via @hono/node-server).
 *
 * Sobe o app Hono numa porta local (default 8787). O Vite (dev) faz proxy de
 * `/api` → esta porta (ver vite.config.ts), então o front e a API compartilham
 * a mesma origem no browser (cookies de sessão funcionam sem CORS).
 *
 * Em produção (Vercel/Cloudflare), o mesmo `app` vira funções serverless — este
 * arquivo é só o adaptador de DEV.
 */

import { serve } from '@hono/node-server';
import { app } from './app';
import { getApiPort } from './env';

const port = getApiPort();

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[api] Hono ouvindo em http://localhost:${info.port} (proxied via Vite /api)`);
});
