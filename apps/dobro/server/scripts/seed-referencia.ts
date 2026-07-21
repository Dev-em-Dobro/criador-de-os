/**
 * apps/dobro — semeia UMA referência pendente de exemplo (dev/demo).
 *
 * Simula uma captura do webhook do Telegram, para exercitar o pipeline
 * (`conteudo:processar`) sem precisar do bot ao vivo. Roda como OWNER.
 *
 * Uso: pnpm --filter @app/dobro exec tsx api/scripts/seed-referencia.ts
 */

import { db } from '../../db/client';
import { referencias } from '../../db/schema';

async function main(): Promise<void> {
  // Opcional: passe a URL (e uma nota) por argv para semear uma referência real.
  const url = process.argv[2] || 'https://www.instagram.com/reel/DemoRefDobro01/';
  const nota =
    process.argv[3] || 'Esse reel bombou — o gancho "POV" + a dor de começar prende demais.';
  const formato = /\/(reel|reels|tv)\//i.test(url) ? 'reels' : null;

  const [row] = await db
    .insert(referencias)
    .values({
      canal: 'telegram',
      origemUrl: url,
      tipo: 'link',
      formatoRef: formato,
      conteudoBruto: url,
      notaTime: nota,
      status: 'pendente',
    })
    .returning({ id: referencias.id });

  console.log(`[seed-referencia] referência pendente criada: ${row?.id}`);
}

main().catch((err) => {
  console.error('[seed-referencia] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
