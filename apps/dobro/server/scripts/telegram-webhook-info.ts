/**
 * apps/dobro — mostra o estado do webhook no Telegram (getWebhookInfo).
 *
 * Diagnóstico: URL registrada, updates pendentes e último erro de entrega (se
 * houver). Não expõe token nem secret. Uso: pnpm telegram:webhook-info
 */

import { getTelegramBotToken } from '../env';

async function main(): Promise<void> {
  const token = getTelegramBotToken();
  if (!token) {
    console.error('[telegram] TELEGRAM_BOT_TOKEN ausente no .env.');
    process.exit(1);
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const body = (await res.json()) as { ok: boolean; result?: unknown; description?: string };
  if (!body.ok) {
    console.error(`[telegram] FALHOU: ${body.description}`);
    process.exit(1);
  }
  console.log(JSON.stringify(body.result, null, 2));
}

main().catch((err) => {
  console.error('[telegram] erro:', err instanceof Error ? err.message : err);
  process.exit(1);
});
