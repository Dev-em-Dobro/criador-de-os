/**
 * apps/dobro — smoke test do webhook do Telegram (hermético, sem rede externa).
 *
 * Exercita o app Hono de verdade (via app.request, sem abrir porta) contra a
 * Neon real, provando o caminho de ESCRITA da ingestão:
 *   1. POST sem o secret token           → 401 (fail-closed);
 *   2. POST com secret + link do Instagram → 200 + captured:true + linha gravada;
 *   3. limpa a linha criada (não deixa lixo em `referencias`).
 *
 * Força um secret conhecido e remove o bot token ANTES de importar o app, para
 * (a) validar a defesa sem depender do .env e (b) não disparar sendMessage real.
 */

process.env.TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || 'smoke-secret';
delete process.env.TELEGRAM_BOT_TOKEN;

import { eq } from 'drizzle-orm';
import { app } from '../app';
import { db } from '../../db/client';
import { referencias } from '../../db/schema';

const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET as string;
const LINK = 'https://www.instagram.com/reel/CzSmokeTest01/';

async function post(headers: Record<string, string>): Promise<Response> {
  return app.request('/api/telegram/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({
      message: { text: `Esse foi muito bem, olha o gancho\n${LINK}`, chat: { id: 999 } },
    }),
  });
}

async function main(): Promise<void> {
  console.log('[smoke-telegram] webhook de ingestão\n');

  // 1) sem secret → 401.
  const noSecret = await post({});
  console.log(`  sem secret token            → ${noSecret.status} (esperado 401)`);

  // 2) com secret → 200 + captured.
  const ok = await post({ 'x-telegram-bot-api-secret-token': SECRET });
  const payload = (await ok.json()) as { captured?: boolean; id?: string };
  console.log(`  com secret + link IG        → ${ok.status} · captured=${payload.captured} · id=${payload.id?.slice(0, 8)}`);

  // 3) confirma a linha e limpa.
  let rowsFound = 0;
  if (payload.id) {
    const rows = await db.select().from(referencias).where(eq(referencias.id, payload.id));
    rowsFound = rows.length;
    await db.delete(referencias).where(eq(referencias.id, payload.id));
    console.log(`  linha gravada e removida    → ${rowsFound} (limpo)`);
  }

  const pass = noSecret.status === 401 && ok.status === 200 && payload.captured === true && rowsFound === 1;
  console.log(pass ? '\n[smoke-telegram] OK — ingestão grava referência com defesa por secret.' : '\n[smoke-telegram] FALHOU.');
  if (!pass) process.exit(1);
}

main().catch((err) => {
  console.error('[smoke-telegram] erro:', err instanceof Error ? err.message : err);
  process.exit(1);
});
