/**
 * apps/dobro — adiciona perfis de referência à curadoria (tela "Referências").
 *
 * Só é preciso para perfil que a gente quer seguir SEM ter mandado post dele:
 * quem já mandou referência pelo Telegram aparece sozinho na tela (a view
 * `v_referencias_perfis` agrega o autor de cada captura).
 *
 * Aceita URL do perfil, "@handle" ou o handle cru — normaliza tudo para
 * minúsculo sem "@". Idempotente: rodar duas vezes não duplica.
 *
 * Uso (de dentro de apps/dobro):
 *   pnpm perfis:add https://www.instagram.com/nick_saraev/ @brun0gpt
 *   pnpm perfis:add nick_saraev --nota "automação com n8n"
 */

import { db } from '../../db/client';
import { referenciaPerfis } from '../../db/schema';

/**
 * Extrai o handle de uma URL do Instagram, de "@handle" ou do handle cru.
 * Retorna null se não sobrar um handle plausível (letras, números, ponto, _).
 */
export function normalizarHandle(entrada: string): string | null {
  let s = entrada.trim();
  if (!s) return null;

  // URL de perfil: pega o primeiro segmento do caminho (ignora query/#).
  const m = s.match(/instagram\.com\/([^/?#\s]+)/i);
  if (m) s = m[1];

  s = s.replace(/^@/, '').replace(/\/+$/, '').toLowerCase();
  // Segmentos que NÃO são perfil (link de post/reel colado por engano).
  if (['p', 'reel', 'reels', 'tv', 'stories', 'explore'].includes(s)) return null;
  return /^[a-z0-9._]{1,30}$/.test(s) ? s : null;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const iNota = argv.indexOf('--nota');
  const nota = iNota >= 0 ? argv[iNota + 1] : undefined;
  const entradas = (iNota >= 0 ? argv.slice(0, iNota) : argv).filter(Boolean);

  if (!entradas.length) {
    throw new Error('passe ao menos um perfil (URL, @handle ou handle)');
  }

  for (const entrada of entradas) {
    const handle = normalizarHandle(entrada);
    if (!handle) {
      console.warn(`[perfis-add] ignorado (não parece um perfil): ${entrada}`);
      continue;
    }
    const [row] = await db
      .insert(referenciaPerfis)
      .values({ handle, nota: nota ?? null, origem: 'manual' })
      .onConflictDoNothing({ target: referenciaPerfis.handle })
      .returning({ id: referenciaPerfis.id });

    console.log(row ? `[perfis-add] adicionado: @${handle}` : `[perfis-add] já existia: @${handle}`);
  }
}

main().catch((err) => {
  console.error('[perfis-add] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
