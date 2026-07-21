/**
 * apps/dobro — registra o webhook do bot no Telegram (setWebhook).
 *
 * O Telegram precisa alcançar a URL pública do webhook. Em DEV, exponha a API
 * local com um túnel (ex.: `cloudflared tunnel --url http://localhost:8787` ou
 * ngrok) e passe a URL pública do túnel. Em produção, a URL do deploy.
 *
 * Uso:
 *   pnpm telegram:set-webhook https://SEU-TUNEL-OU-DOMINIO
 *   # → registra https://SEU-TUNEL-OU-DOMINIO/api/telegram/webhook
 *
 * Pré-requisitos no .env (raiz ou apps/dobro):
 *   TELEGRAM_BOT_TOKEN      (do BotFather)
 *   TELEGRAM_WEBHOOK_SECRET (qualquer string forte — o endpoint valida por ela)
 */

import { getTelegramBotToken, getTelegramWebhookSecret } from '../env';

async function main(): Promise<void> {
  const base = process.argv[2]?.trim();
  if (!base) {
    console.error('[telegram] uso: pnpm telegram:set-webhook <https://url-publica>');
    process.exit(1);
  }
  const token = getTelegramBotToken();
  if (!token) {
    console.error('[telegram] TELEGRAM_BOT_TOKEN ausente no .env.');
    process.exit(1);
  }
  const secret = getTelegramWebhookSecret();
  if (!secret) {
    console.error(
      '[telegram] TELEGRAM_WEBHOOK_SECRET ausente no .env — obrigatório (o endpoint valida por ele).',
    );
    process.exit(1);
  }

  const webhookUrl = `${base.replace(/\/$/, '')}/api/telegram/webhook`;
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ['message', 'edited_message', 'channel_post'],
    }),
  });
  const body = (await res.json()) as { ok: boolean; description?: string };
  if (body.ok) {
    console.log(`[telegram] webhook registrado → ${webhookUrl}`);
  } else {
    console.error(`[telegram] FALHOU: ${body.description ?? res.status}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[telegram] erro:', err instanceof Error ? err.message : err);
  process.exit(1);
});
