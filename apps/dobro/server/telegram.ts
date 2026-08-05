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
 *  - a CAPTURA usa o client `dbIngest` (role `app_ingest`, INSERT só em
 *    `referencias`). A GERAÇÃO do rascunho na hora usa `dbPipeline` (role
 *    `app_pipeline`: SELECT/INSERT/UPDATE em `referencias` + `conteudo_posts`), a
 *    mesma da rota `/api/conteudo/gerar` — menor privilégio que o owner.
 *
 * GATILHO IMEDIATO: ao capturar um link, já geramos o rascunho aqui (não espera o
 * cron diário). É best-effort: se falhar ou estourar o tempo da function, a
 * referência fica 'pendente' e o cron `/api/cron/processar-referencias` é a rede
 * de segurança que a pega no próximo ciclo.
 *
 * Devolvemos 200 mesmo em "não capturei" (sem link / erro de banco): o Telegram
 * re-tenta em cima de status != 2xx, e não queremos loop de retry. O que deu
 * errado fica no log do servidor, não vira tempestade de requests.
 */

import type { Context } from 'hono';
import { and, eq } from 'drizzle-orm';
import { dbIngest, dbPipeline } from '../db/client.js';
import { referencias } from '../db/schema.js';
import { criarRascunho, criarEsqueletoDoCard } from './conteudo-pipeline.js';
import { getAgencyAnthropicKey, getTelegramBotToken, getTelegramWebhookSecret } from './env.js';

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
    // DEDUP — se já existe uma referência PENDENTE com este link (re-entrega do
    // mesmo update pelo Telegram, ou link colado 2x antes de processar), não cria
    // outra nem gera rascunho de novo. Evita post duplicado no board.
    const [dup] = await dbPipeline
      .select({ id: referencias.id })
      .from(referencias)
      .where(and(eq(referencias.origemUrl, link), eq(referencias.status, 'pendente')))
      .limit(1);
    if (dup) {
      await maybeReply(chatId, 'Esse link já tá na fila ✅ O esboço já vem.');
      return c.json({ ok: true, captured: true, duplicate: true, id: dup.id });
    }

    // Captura (INSERT via role de menor privilégio, app_ingest).
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

    // CARD NA HORA — antes de qualquer trabalho pesado, cria o card-esqueleto no
    // board. É o que responde "será que entrou?": você manda o link e o card já
    // está lá, com o link dentro. A geração COMPLETA esse mesmo card depois, em
    // vez de criar outro (ver `salvarRascunhoPost`).
    if (row?.id) await criarEsqueletoDoCard(dbPipeline, row.id, link, nota);

    // Feedback imediato antes do trabalho pesado (a geração leva ~20-30s).
    await maybeReply(chatId, 'Referência capturada ✅ Já tá no board. Gerando o esboço...');

    // GATILHO — gera o rascunho JÁ, sem esperar o cron diário. Best-effort: sem a
    // chave da Claude no server, ou se a geração falhar, a referência segue
    // 'pendente' e o cron `/api/cron/processar-referencias` pega no próximo ciclo.
    //
    // NÃO passa `permitirSemSlides`: aqui é automação rodando na Vercel, onde não
    // dá pra ler os slides. Carrossel é ADIADO (fica `aguardando_slides`) e o card
    // continua esqueleto até o processamento local completar. Melhor um card
    // esperando do que um carrossel escrito sobre o tema errado.
    let generated: { id?: string; titulo?: string; formato?: string } | null = null;
    const apiKey = getAgencyAnthropicKey();
    if (apiKey && row?.id) {
      try {
        const r = await criarRascunho(dbPipeline, apiKey, { referenciaId: row.id });
        if (r.created) {
          generated = { id: r.id, titulo: r.titulo, formato: r.formato };
          await maybeReply(chatId, `Esboço pronto ✅ "${r.titulo}" (${r.formato}). Tá no board como rascunho.`);
        } else if (r.adiada) {
          await maybeReply(
            chatId,
            'Carrossel ✅ O card já tá no board. Pra escrever direito eu preciso LER os slides, ' +
              'e isso só roda no PC. Me peça "processa" quando quiser.',
          );
        } else {
          await maybeReply(chatId, 'Capturei, mas não gerei agora. Fica pro processamento automático.');
        }
      } catch (genErr) {
        console.error('[telegram] geração inline falhou:', genErr instanceof Error ? genErr.message : genErr);
        await maybeReply(chatId, 'Capturei ✅ O esboço sai no processamento automático (deu um erro agora).');
      }
    }

    return c.json({ ok: true, captured: true, id: row?.id, generated });
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
