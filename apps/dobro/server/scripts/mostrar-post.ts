/**
 * apps/dobro — mostra UM post do board inteiro no terminal (slides, legenda,
 * CTA, previsão). Serve pra revisar um rascunho sem abrir a tela.
 *
 * Uso (de dentro de apps/dobro):
 *   npx tsx server/scripts/mostrar-post.ts <id-ou-pedaço-do-título>
 */

import { desc, eq, like } from 'drizzle-orm';
import { db } from '../../db/client';
import { conteudoPosts } from '../../db/schema';

function ehUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

async function main(): Promise<void> {
  const alvo = process.argv[2];
  if (!alvo) {
    console.error('uso: mostrar-post <id-ou-pedaço-do-título>');
    process.exit(1);
  }

  const posts = ehUuid(alvo)
    ? await db.select().from(conteudoPosts).where(eq(conteudoPosts.id, alvo)).limit(1)
    : await db
        .select()
        .from(conteudoPosts)
        .where(like(conteudoPosts.titulo, `%${alvo}%`))
        .orderBy(desc(conteudoPosts.createdAt))
        .limit(1);

  const p = posts[0];
  if (!p) throw new Error(`nenhum post com "${alvo}"`);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`[${p.estado}] ${p.titulo}  (${p.formato})`);
  console.log(`data programada: ${p.dataProgramada ? String(p.dataProgramada) : '(sem data)'}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`\nGANCHO: ${p.gancho ?? ''}`);
  console.log(`\nPAUTA:\n${p.pauta ?? '(vazia)'}`);
  console.log(`\nLEGENDA: ${p.legenda ?? ''}`);
  console.log(`CTA: ${p.ctaFinal ?? ''}`);
  console.log(`HASHTAGS: ${p.hashtags ?? ''}`);
  if (p.refsLinks) console.log(`\nREFERÊNCIAS:\n${p.refsLinks}`);
  if (p.briefing) console.log(`\nBRIEFING:\n${p.briefing}`);
}

main().catch((err) => {
  console.error('[mostrar-post] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
