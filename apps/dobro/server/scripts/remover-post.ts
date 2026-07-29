/**
 * apps/dobro — remove um post do board por id (grava nada; DELETE direto).
 *
 * Faz o mesmo que o botão 🗑 do painel "Atualizar cronograma" (DELETE
 * /api/conteudo/:id), mas via OWNER — útil para descartar um rascunho gerado
 * pelo pipeline sem abrir a tela. Roda como script admin.
 *
 * Uso:
 *   pnpm --filter @app/dobro conteudo:remover <id> [--com-referencia]
 *   ex.: pnpm --filter @app/dobro conteudo:remover 1a69… --com-referencia
 *
 * Com `--com-referencia`, remove também a `referencia` de origem (se houver) —
 * bom para limpar uma referência que só existia para gerar este post.
 */

import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { conteudoPosts, referencias } from '../../db/schema';

async function main(): Promise<void> {
  const id = process.argv[2];
  const comReferencia = process.argv.includes('--com-referencia');

  if (!id) {
    console.error('uso: conteudo:remover <id> [--com-referencia]');
    process.exit(1);
  }

  const [post] = await db
    .select({ id: conteudoPosts.id, titulo: conteudoPosts.titulo, referenciaId: conteudoPosts.referenciaId })
    .from(conteudoPosts)
    .where(eq(conteudoPosts.id, id))
    .limit(1);

  if (!post) {
    console.error(`[remover] post não encontrado: ${id}`);
    process.exit(1);
  }

  await db.delete(conteudoPosts).where(eq(conteudoPosts.id, id));
  console.log(`[remover] post removido: "${post.titulo}" (id ${post.id})`);

  if (comReferencia && post.referenciaId) {
    await db.delete(referencias).where(eq(referencias.id, post.referenciaId));
    console.log(`[remover] referência de origem removida: ${post.referenciaId}`);
  }
}

main().catch((err) => {
  console.error('[remover] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
