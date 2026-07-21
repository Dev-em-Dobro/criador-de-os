/**
 * apps/dobro — testa a busca de conteúdo do Instagram (dev/diagnóstico).
 *
 * Uso: pnpm --filter @app/dobro ig:fetch https://www.instagram.com/p/XXXX/
 */

import { fetchInstagramContent } from '../instagram';

async function main(): Promise<void> {
  const url = process.argv[2];
  if (!url) {
    console.error('uso: ig:fetch <url do post do Instagram>');
    process.exit(1);
  }
  console.log(`[ig:fetch] buscando ${url} ...`);
  const r = await fetchInstagramContent(url);
  console.log(JSON.stringify(r, null, 2));
}

main().catch((err) => {
  console.error('[ig:fetch] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
