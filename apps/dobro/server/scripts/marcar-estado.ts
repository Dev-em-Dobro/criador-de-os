/**
 * apps/dobro — muda o estado de um post no board (rascunho / pronto / publicado).
 *
 * Faz o mesmo que arrastar o card entre as colunas do board, mas via OWNER: útil
 * pra fechar um carrossel recém-renderizado sem abrir a tela. Os outros scripts
 * de board (`conteudo:agendar`, `conteudo:remover`) já cobriam data e remoção, e
 * faltava o estado.
 *
 * Uso (de dentro de apps/dobro):
 *   npx tsx server/scripts/marcar-estado.ts <id> <rascunho|pronto|publicado>
 */

import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { conteudoPosts } from '../../db/schema';

/** Os três estados do board (coluna `estado` em conteudo_posts). */
const ESTADOS = ['rascunho', 'pronto', 'publicado'] as const;
type Estado = (typeof ESTADOS)[number];

function ehEstado(v: string): v is Estado {
  return (ESTADOS as readonly string[]).includes(v);
}

async function main(): Promise<void> {
  const id = process.argv[2];
  const estado = process.argv[3];

  if (!id || !estado || !ehEstado(estado)) {
    console.error(`uso: marcar-estado <id> <${ESTADOS.join('|')}>`);
    process.exit(1);
  }

  const [row] = await db
    .update(conteudoPosts)
    .set({ estado, updatedAt: new Date() })
    .where(eq(conteudoPosts.id, id))
    .returning({ id: conteudoPosts.id, titulo: conteudoPosts.titulo, estado: conteudoPosts.estado });

  if (!row) {
    console.error(`[estado] post não encontrado: ${id}`);
    process.exit(1);
  }

  console.log(`[estado] OK — "${row.titulo}" agora está "${row.estado}" (id ${row.id})`);
}

main().catch((err) => {
  console.error('[estado] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
