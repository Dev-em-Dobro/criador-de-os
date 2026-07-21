/**
 * apps/dobro — lista as referências capturadas (dev/diagnóstico).
 *
 * Uso: pnpm --filter @app/dobro referencias:list   (ou passe um número: ...list 20)
 */

import { desc } from 'drizzle-orm';
import { db } from '../../db/client';
import { referencias } from '../../db/schema';

async function main(): Promise<void> {
  const limit = Number(process.argv[2]) || 10;
  const rows = await db.select().from(referencias).orderBy(desc(referencias.createdAt)).limit(limit);
  console.log(`${rows.length} referência(s) (mais recentes primeiro):`);
  for (const r of rows) {
    const when = r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt);
    console.log(`  [${r.status}] ${r.canal} · ${r.origemUrl ?? '(sem url)'} · fmt=${r.formatoRef ?? '-'} · ${when}`);
    if (r.notaTime) console.log(`       nota: ${r.notaTime}`);
  }
}

main().catch((err) => {
  console.error('[list-referencias] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
