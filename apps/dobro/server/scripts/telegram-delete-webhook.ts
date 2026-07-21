/**
 * apps/dobro — remove o webhook registrado no Telegram (deleteWebhook).
 *
 * Útil ao trocar de túnel/domínio ou para voltar ao modo long-polling.
 *
 * Uso: pnpm telegram:delete-webhook
 */

import { getTelegramBotToken } from '../env';

async function main(): Promise<void> {
  const token = getTelegramBotToken();
  if (!token) {
    console.error('[telegram] TELEGRAM_BOT_TOKEN ausente no .env.');
    process.exit(1);
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, { method: 'POST' });
  const body = (await res.json()) as { ok: boolean; description?: string };
  console.log(body.ok ? '[telegram] webhook removido.' : `[telegram] FALHOU: ${body.description}`);
  if (!body.ok) process.exit(1);
}

main().catch((err) => {
  console.error('[telegram] erro:', err instanceof Error ? err.message : err);
  process.exit(1);
});
