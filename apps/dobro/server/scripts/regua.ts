/**
 * apps/dobro — passa a RÉGUA DO GANCHO nos cards do board.
 *
 * A mesma régua que o `carrossel:render` imprime a cada render, agora sobre o que
 * já está no cronograma: dá pra ver de uma vez quais cards da semana vão nascer
 * fracos, antes de gastar arte e legenda neles.
 *
 * Uso:
 *   pnpm --filter @app/dobro conteudo:regua                → tudo que não foi publicado
 *   pnpm --filter @app/dobro conteudo:regua 2026-08-19     → só de uma data
 *   pnpm --filter @app/dobro conteudo:regua 2026-08-19 2026-08-23   → intervalo
 *   pnpm --filter @app/dobro conteudo:regua --id <uuid>    → um card, detalhado
 *
 * Sem argumento mostra o RESUMO (uma linha por card, ordenado da pior nota pra
 * melhor). Com `--id`, mostra o veredito inteiro de um card só.
 */

import { and, asc, eq, gte, lte, ne } from 'drizzle-orm';
import { db } from '../../db/client';
import { conteudoPosts } from '../../db/schema';
import { avaliarGancho, formatarVeredito } from '../carrossel/regua';

const DIA_RE = /^\d{4}-\d{2}-\d{2}$/;

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Modo detalhado: um card só, com tudo que falta escrito por extenso.
  const iId = args.indexOf('--id');
  if (iId >= 0) {
    const id = args[iId + 1];
    if (!id) {
      console.error('uso: conteudo:regua --id <uuid>');
      process.exit(1);
    }
    const [p] = await db.select().from(conteudoPosts).where(eq(conteudoPosts.id, id)).limit(1);
    if (!p) {
      console.error(`[régua] nenhum card com id "${id}".`);
      process.exit(1);
    }
    console.log(formatarVeredito(avaliarGancho({ titulo: p.titulo, ctaFinal: p.ctaFinal }), p.titulo));
    process.exit(0);
  }

  const datas = args.filter((a) => DIA_RE.test(a));
  const filtros = [ne(conteudoPosts.estado, 'publicado')];
  if (datas[0]) filtros.push(gte(conteudoPosts.dataProgramada, new Date(`${datas[0]}T00:00:00`)));
  if (datas[0]) filtros.push(lte(conteudoPosts.dataProgramada, new Date(`${datas[1] ?? datas[0]}T23:59:59.999`)));

  const posts = await db
    .select()
    .from(conteudoPosts)
    .where(and(...filtros))
    .orderBy(asc(conteudoPosts.dataProgramada));

  const linhas = posts.map((p) => ({
    data: p.dataProgramada ? new Date(p.dataProgramada).toISOString().slice(0, 10) : 'sem data',
    id: p.id,
    titulo: p.titulo.replace(/\s+/g, ' '),
    v: avaliarGancho({ titulo: p.titulo, ctaFinal: p.ctaFinal }),
  }));

  if (!linhas.length) {
    console.log('[régua] nenhum card não publicado no filtro.');
    process.exit(0);
  }

  const selo = (f: string) => (f === 'forte' ? '✅' : f === 'ok' ? '🟡' : '🔴');

  console.log(`\n${linhas.length} card(s), da pior nota pra melhor:\n`);
  console.log('     data        nota  o que falta                                    titulo');
  console.log('─'.repeat(112));
  for (const l of [...linhas].sort((a, b) => a.v.nota - b.v.nota)) {
    // Os nomes curtos do que falta, pra caber na linha do resumo.
    const falta = l.v.faltando.map((t) => t.chave).join(' ') || '(nada)';
    console.log(
      `  ${selo(l.v.faixa)} ${l.data}  ${String(l.v.nota).padStart(3)}/100  ${falta.slice(0, 44).padEnd(44)}  ${l.titulo.slice(0, 44)}`,
    );
    for (const a of l.v.alertas) console.log(`       ! ${a.texto.slice(0, 100)}`);
  }
  console.log('─'.repeat(112));

  const media = Math.round(linhas.reduce((s, l) => s + l.v.nota, 0) / linhas.length);
  const fracos = linhas.filter((l) => l.v.faixa === 'fraco').length;
  console.log(`média ${media}/100 · ${fracos} card(s) na faixa vermelha`);
  console.log('\nPra ver o que fazer em um deles: conteudo:regua --id <uuid>\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('[régua] FALHOU:', err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
