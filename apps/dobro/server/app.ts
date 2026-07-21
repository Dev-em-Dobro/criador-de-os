/**
 * apps/dobro — app Hono: Better Auth + endpoint de query genérico seguro.
 *
 * Rotas:
 *  - /api/auth/*  → Better Auth (sign-in/up/session/sign-out) via auth.handler.
 *  - POST /api/query → endpoint genérico SEGURO (doc 05, §4), com as 3 defesas:
 *      1. auth-first (fail-closed): sem sessão → 401 antes de tocar no banco;
 *      2. allowlist de views: view/coluna fora da lista → 403/400;
 *      3. SQL parametrizado (bind) via query-builder.
 *  - GET /api/health → sonda simples (sem segredo, sem auth).
 *
 * O app é montado aqui e servido por `server.ts` (dev, @hono/node-server) —
 * separar app/servidor deixa o app testável sem abrir uma porta.
 */

import { Hono } from 'hono';
import { auth } from './auth.js';
import { handleTelegramWebhook } from './telegram.js';
import {
  handleCriarConteudo,
  handleAtualizarConteudo,
  handleRemoverConteudo,
} from './conteudo.js';
import { dbQuery } from '../db/client.js';
import {
  buildSecureQuery,
  QueryValidationError,
  type QueryRequest,
} from './query-builder.js';

export const app = new Hono();

// --- Health check (público, sem segredo) ---
app.get('/api/health', (c) => c.json({ ok: true }));

// --- Better Auth: todas as rotas /api/auth/** ---
// O handler do Better Auth cuida de sign-in/up/session/sign-out e dos cookies.
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

// --- Ingestão do Telegram (webhook PÚBLICO, validado por secret token) ---
// Não passa pela sessão do Better Auth: a defesa é o `secret_token` do setWebhook
// (header X-Telegram-Bot-Api-Secret-Token). Grava em `referencias` via app_ingest.
app.post('/api/telegram/webhook', (c) => handleTelegramWebhook(c));

// --- Cronograma de Conteúdo (ESCRITA autenticada) ---
// Auth-first (fail-closed) dentro de cada handler; grava `conteudo_posts` via o
// role app_content. É como o criador cadastra/edita o cronograma pela tela.
app.post('/api/conteudo', (c) => handleCriarConteudo(c));
app.patch('/api/conteudo/:id', (c) => handleAtualizarConteudo(c));
app.delete('/api/conteudo/:id', (c) => handleRemoverConteudo(c));

// --- Endpoint de query genérico SEGURO ---
app.post('/api/query', async (c) => {
  // DEFESA 1 — auth-first (fail-closed). Valida a sessão ANTES de qualquer
  // parse pesado ou acesso ao banco. Sem sessão → 401.
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: 'Não autenticado' }, 401);
  }

  // Corpo = dataSource declarativo do manifesto.
  let body: QueryRequest;
  try {
    body = (await c.req.json()) as QueryRequest;
  } catch {
    return c.json({ error: 'JSON inválido no corpo' }, 400);
  }

  // Variáveis do shell que resolvem refs em bind params.
  // - `period` vem do body (enviado pelo core) — é só um valor de filtro, sempre
  //   parametrizado, nunca um identificador; default seguro se ausente.
  // - `clientId` NÃO é lido do body por segurança: derivamos da SESSÃO
  //   (fonte confiável). Neste modelo (um Neon por app) o isolamento é físico,
  //   então `{ ref:'clientId' }` resolve para o id do usuário autenticado — nunca
  //   um valor arbitrário vindo do cliente.
  const vars = {
    period:
      typeof body === 'object' && body && 'period' in body
        ? String((body as Record<string, unknown>).period ?? 'monthly')
        : 'monthly',
    clientId: session.user.id,
  };

  try {
    // DEFESAS 2 + 3 — allowlist de views + SQL parametrizado (bind).
    // Executa como `app_query` (SELECT só nas views): mesmo que a allowlist
    // falhasse, o banco nega tabela crua/auth (defesa em profundidade).
    const query = buildSecureQuery(body, vars);
    const rows = await dbQuery.execute(query);
    // `db.execute` (neon-http) devolve { rows } ou um array conforme a versão;
    // normalizamos para sempre entregar um array ao core.
    const data = Array.isArray(rows) ? rows : (rows as { rows?: unknown[] }).rows ?? [];
    return c.json({ data });
  } catch (err) {
    if (err instanceof QueryValidationError) {
      return c.json({ error: err.message }, err.status as 400 | 403);
    }
    console.error('[query] erro inesperado:', err instanceof Error ? err.message : err);
    return c.json({ error: 'Erro ao resolver a query' }, 500);
  }
});
