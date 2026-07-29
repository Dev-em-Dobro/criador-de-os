/**
 * apps/dobro — agenda um post do board numa data (grava `data_programada`).
 *
 * Faz o mesmo que o painel "Atualizar cronograma" faria (PATCH /api/conteudo/:id
 * com dataProgramada), mas via OWNER — útil para agendar um rascunho recém-gerado
 * pelo pipeline sem abrir a tela. Roda como script admin.
 *
 * Uso:
 *   pnpm --filter @app/dobro conteudo:agendar <id|latest> <YYYY-MM-DD>
 *   ex.: pnpm --filter @app/dobro conteudo:agendar latest 2026-07-28
 *
 * A data é gravada como o app grava (meia-noite UTC do dia escolhido), então o
 * board a exibe no dia certo, sem drift de fuso.
 */

import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { conteudoPosts } from '../../db/schema';

const DIA_RE = /^\d{4}-\d{2}-\d{2}$/;

async function main(): Promise<void> {
  const idArg = process.argv[2];
  const dia = process.argv[3];

  if (!idArg || !dia || !DIA_RE.test(dia)) {
    console.error('uso: conteudo:agendar <id|latest> <YYYY-MM-DD>');
    process.exit(1);
  }

  // Resolve o alvo: um id explícito ou o post mais recente ('latest').
  let id = idArg;
  if (idArg === 'latest') {
    const [row] = await db
      .select({ id: conteudoPosts.id })
      .from(conteudoPosts)
      .orderBy(desc(conteudoPosts.createdAt))
      .limit(1);
    if (!row) {
      console.error('[agendar] nenhum post encontrado.');
      process.exit(1);
    }
    id = row.id;
  }

  const dataProgramada = new Date(`${dia}T00:00:00.000Z`);
  const [updated] = await db
    .update(conteudoPosts)
    .set({ dataProgramada, updatedAt: new Date() })
    .where(eq(conteudoPosts.id, id))
    .returning({ id: conteudoPosts.id, titulo: conteudoPosts.titulo, dataProgramada: conteudoPosts.dataProgramada });

  if (!updated) {
    console.error(`[agendar] post não encontrado: ${id}`);
    process.exit(1);
  }
  console.log(`[agendar] OK — "${updated.titulo}" agendado para ${dia} (id ${updated.id})`);
}

main().catch((err) => {
  console.error('[agendar] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
