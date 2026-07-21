/**
 * apps/dobro — reseta uma referência para 'pendente' (dev/teste do pipeline).
 *
 * Uso: pnpm --filter @app/dobro referencias:reset <id>
 */

import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { referencias } from '../../db/schema';

async function main(): Promise<void> {
  const id = process.argv[2];
  if (!id) {
    console.error('uso: referencias:reset <id>');
    process.exit(1);
  }
  const res = await db
    .update(referencias)
    .set({ status: 'pendente', analise: null })
    .where(eq(referencias.id, id))
    .returning({ id: referencias.id });
  console.log(res.length ? `[reset] ${id} → pendente` : `[reset] id não encontrado: ${id}`);
}

main().catch((err) => {
  console.error('[reset] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
