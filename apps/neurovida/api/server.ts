/**
 * apps/neurovida — servidor local da API (dev).
 *
 * Serve o app Hono via @hono/node-server. O Vite faz proxy de /api → esta porta,
 * então o front e a API compartilham a origem no browser (sem CORS).
 */

import { serve } from '@hono/node-server';
import { app } from './app';
import { getApiPort } from './env';

const port = getApiPort();

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[api] Neurovida API ouvindo em http://localhost:${info.port}`);
});
