/**
 * apps/dobro — entrypoint SERVERLESS da API (Vercel Function, runtime Node).
 *
 * O mesmo app Hono definido em `server/app.ts` roda aqui como UMA função
 * serverless. O `vercel.json` reescreve `/api/*` para esta função; o Hono casa a
 * rota internamente pelo path original, que o Vercel preserva.
 *
 * Em DEV isto NÃO roda — o Vite faz proxy de `/api` para `server/server.ts`
 * (@hono/node-server). Este arquivo é o adaptador de PRODUÇÃO (Vercel).
 *
 * IMPORTANTE (estrutura): o Vercel trata cada arquivo em `api/` como uma função.
 * Por isso os módulos da API vivem em `server/` (não em `api/`) e `api/` contém
 * SÓ este entry — senão `api/conteudo.ts`, `api/query`, etc. virariam rotas
 * soltas e atropelariam as rotas do Hono.
 *
 * ADAPTER (por que manual): o runtime Node do Vercel entrega o handler no estilo
 * legado `(req, res)` E já consome/parseia o corpo em `req.body`. Adapters que
 * releem o stream cru (`getRequestListener`, `hono/vercel`) travam em POST porque
 * o stream já acabou. Aqui reconstruímos o `Request` (Web) a partir do `req.body`
 * já parseado e escrevemos a `Response` na `res` — tratando `set-cookie` com
 * `getSetCookie()` para não colapsar múltiplos cookies (essencial pro Better Auth).
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { app } from '../server/app.js';

export const runtime = 'nodejs';

type VercelRequest = IncomingMessage & { body?: unknown };

export default async function handler(req: VercelRequest, res: ServerResponse): Promise<void> {
  const host = req.headers.host ?? 'localhost';
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
  const url = `${proto}://${host}${req.url ?? '/'}`;
  const method = req.method ?? 'GET';

  // Headers Node → Web Headers. `content-length` é recomputado a partir do body.
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (key === 'content-length') continue;
    if (Array.isArray(value)) for (const v of value) headers.append(key, v);
    else if (value != null) headers.set(key, value);
  }

  // Corpo: usa o `req.body` já entregue pelo Vercel (evita reler o stream cru,
  // que trava). Fallback lê o stream quando o Vercel não populou o body.
  let body: BodyInit | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    const parsed = req.body;
    if (parsed !== undefined && parsed !== null) {
      if (typeof parsed === 'string' || Buffer.isBuffer(parsed)) {
        body = parsed as BodyInit;
      } else {
        body = JSON.stringify(parsed);
        if (!headers.has('content-type')) headers.set('content-type', 'application/json');
      }
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      if (chunks.length > 0) body = Buffer.concat(chunks);
    }
  }

  const response = await app.fetch(new Request(url, { method, headers, body }));

  res.statusCode = response.status;
  // set-cookie precisa ir como múltiplos headers (não colapsado por vírgula).
  const setCookies =
    (response.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') res.setHeader(key, value);
  });
  if (setCookies.length > 0) res.setHeader('set-cookie', setCookies);

  if (response.body) {
    res.end(Buffer.from(await response.arrayBuffer()));
  } else {
    res.end();
  }
}
