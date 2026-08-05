/**
 * apps/dobro — lista os posts do cronograma num intervalo de datas.
 *
 * Uso (de dentro de apps/dobro):
 *   npx tsx server/scripts/listar-cronograma.ts <inicio> [fim]
 *   ex.: npx tsx server/scripts/listar-cronograma.ts 2026-08-05 2026-08-09
 *
 * Datas são interpretadas no fuso LOCAL (dia inteiro), não em UTC: '2026-08-05'
 * pega de 05/08 00:00 a 05/08 23:59 daqui, que é o que a pessoa quer dizer.
 */

import { and, asc, gte, lte } from 'drizzle-orm';
import { db } from '../../db/client';
import { conteudoPosts } from '../../db/schema';

function inicioDoDia(v: string): Date {
  return new Date(`${v}T00:00:00`);
}
function fimDoDia(v: string): Date {
  return new Date(`${v}T23:59:59.999`);
}

async function main(): Promise<void> {
  const inicio = process.argv[2];
  const fim = process.argv[3] ?? inicio;
  if (!inicio) {
    console.error('uso: listar-cronograma <inicio> [fim]   (ex.: 2026-08-05 2026-08-09)');
    process.exit(1);
  }

  const posts = await db
    .select()
    .from(conteudoPosts)
    .where(
      and(
        gte(conteudoPosts.dataProgramada, inicioDoDia(inicio)),
        lte(conteudoPosts.dataProgramada, fimDoDia(fim)),
      ),
    )
    .orderBy(asc(conteudoPosts.dataProgramada));

  console.log(`${posts.length} post(s) programado(s) de ${inicio} a ${fim}:\n`);
  for (const p of posts) {
    const d = p.dataProgramada as Date;
    const dia = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const primeiraLinha = (p.legenda ?? '').split('\n')[0] ?? '';
    console.log(`  ${dia}  [${p.estado}]  ${p.titulo}`);
    console.log(`        id: ${p.id}`);
    console.log(`        1ª linha da legenda: ${primeiraLinha.slice(0, 90)}`);
    console.log(`        hashtags: ${(p.hashtags ?? '(vazio)').slice(0, 90)}`);
    console.log('');
  }
}

main().catch((err) => {
  console.error('[listar-cronograma] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
