/**
 * apps/dobro — imprime o rascunho mais recente (dev/demo): conteúdo gerado pelo
 * pipeline + a análise "por que foi bem" salva na referência de origem.
 *
 * Uso: pnpm --filter @app/dobro exec tsx api/scripts/show-rascunhos.ts
 */

import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { conteudoPosts, referencias } from '../../db/schema';

async function main(): Promise<void> {
  const [post] = await db
    .select()
    .from(conteudoPosts)
    .orderBy(desc(conteudoPosts.createdAt))
    .limit(1);

  if (!post) {
    console.log('nenhum rascunho encontrado.');
    return;
  }

  console.log('==================================================');
  console.log(`TÍTULO:   ${post.titulo}`);
  console.log(`FORMATO:  ${post.formato}   ESTADO: ${post.estado}`);
  console.log(`GANCHO:   ${post.gancho ?? ''}`);
  console.log(`CTA:      ${post.ctaFinal ?? ''}`);
  console.log(`HASHTAGS: ${post.hashtags ?? ''}`);
  console.log('--- PAUTA (AIDA) ---');
  console.log(post.pauta ?? '');
  console.log('--- LEGENDA ---');
  console.log(post.legenda ?? '');
  console.log('--- ROTEIRO (json) ---');
  console.log(JSON.stringify(post.roteiro, null, 2));

  if (post.referenciaId) {
    const [ref] = await db.select().from(referencias).where(eq(referencias.id, post.referenciaId));
    console.log('--- ANÁLISE DA REFERÊNCIA (por que foi bem) ---');
    console.log(ref?.analise ?? '(sem análise)');
    console.log(`(status da referência: ${ref?.status})`);
  }
  console.log('==================================================');
}

main().catch((err) => {
  console.error('[show-rascunhos] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
