/**
 * apps/dobro — ingestão do Telegram (a PRIMEIRA rota de ESCRITA do app).
 *
 * O bot do Telegram é adicionado a um canal/grupo "inbox"; a cada mensagem, o
 * Telegram faz POST aqui. Se a mensagem contém um link de post do Instagram,
 * gravamos uma linha em `referencias` (status 'pendente') — o pipeline depois
 * analisa "por que foi bem" e gera um rascunho de carrossel/reels.
 *
 * SEGURANÇA (esta rota é PÚBLICA — não passa pela sessão do Better Auth):
 *  - a única credencial é o `secret_token` que configuramos no setWebhook. O
 *    Telegram o devolve no header `X-Telegram-Bot-Api-Secret-Token` em TODO
 *    request. Sem secret configurado ou header divergente → 401 (fail-closed).
 *  - a escrita usa o client `dbIngest` (role `app_ingest`): INSERT só em
 *    `referencias`, nada mais. Defesa em profundidade no nível do banco.
 *
 * Devolvemos 200 mesmo em "não capturei" (sem link / erro de banco): o Telegram
 * re-tenta em cima de status != 2xx, e não queremos loop de retry. O que deu
 * errado fica no log do servidor, não vira tempestade de requests.
 */

import type { Context } from 'hono';
import { dbIngest } from '../db/client.js';
import { referencias } from '../db/schema.js';
import { getTelegramBotToken, getTelegramWebhookSecret } from './env.js';

/** Casca mínima de um update do Telegram (só o que usamos). */
interface TelegramMessage {
  text?: string;
  caption?: string;
  chat?: { id?: number };
}
interface TelegramUpdate {
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
}

/** Captura o 1º link de post do Instagram (reel/reels/p/tv), incluindo query string. */
const IG_URL_RE =
  /https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels|p|tv)\/[A-Za-z0-9_-]+\/?(?:\?[^\s]*)?/i;

/** Deduz o formato pelo formato da URL. `/p/` é ambíguo (carrossel|imagem) → null. */
function detectFormato(url: string): 'reels' | null {
  return /\/(reel|reels|tv)\//i.test(url) ? 'reels' : null;
}

/** Extrai a mensagem relevante de um update (mensagem, edição ou post de canal). */
function pickMessage(update: TelegramUpdate): TelegramMessage | undefined {
  return update.message ?? update.channel_post ?? update.edited_message;
}

export async function handleTelegramWebhook(c: Context): Promise<Response> {
  // DEFESA — secret token do setWebhook. Sem secret configurado → ninguém entra.
  const secret = getTelegramWebhookSecret();
  const got = c.req.header('x-telegram-bot-api-secret-token');
  if (!secret || got !== secret) {
    return c.json({ ok: false, error: 'unauthorized' }, 401);
  }

  let update: TelegramUpdate;
  try {
    update = (await c.req.json()) as TelegramUpdate;
  } catch {
    return c.json({ ok: false, error: 'json inválido' }, 400);
  }

  const msg = pickMessage(update);
  const text = (msg?.text ?? msg?.caption ?? '').trim();
  const chatId = msg?.chat?.id;

  const link = text.match(IG_URL_RE)?.[0];
  if (!link) {
    await maybeReply(chatId, 'Manda um *link de post do Instagram* que eu capturo a referência 🙂');
    return c.json({ ok: true, captured: false });
  }

  // Nota do time = o que a pessoa escreveu junto do link (sinal valioso).
  const nota = text.replace(link, '').trim() || null;

  try {
    const [row] = await dbIngest
      .insert(referencias)
      .values({
        canal: 'telegram',
        origemUrl: link,
        tipo: 'link',
        formatoRef: detectFormato(link),
        conteudoBruto: text || null,
        notaTime: nota,
        status: 'pendente',
      })
      .returning({ id: referencias.id });

    await maybeReply(chatId, `Referência capturada ✅ Vou gerar um esboço a partir dela.`);
    return c.json({ ok: true, captured: true, id: row?.id });
  } catch (err) {
    console.error('[telegram] falha ao gravar referência:', err instanceof Error ? err.message : err);
    // 200 de propósito (evita retry-storm do Telegram); erro fica no log.
    return c.json({ ok: true, captured: false, error: 'db' });
  }
}

/**
 * Responde no chat do Telegram (best-effort). Só roda se o bot token está
 * configurado; falha de rede NUNCA derruba o webhook (o insert já aconteceu).
 */
async function maybeReply(chatId: number | undefined, text: string): Promise<void> {
  const token = getTelegramBotToken();
  if (!token || chatId == null) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  } catch {
    // best-effort — silêncio proposital.
  }
}
