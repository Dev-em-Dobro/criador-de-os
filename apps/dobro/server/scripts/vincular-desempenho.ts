/**
 * apps/dobro — casa as MEDIÇÕES do Instagram com os CARDS do board, preenchendo
 * `conteudo_desempenho.post_id` (o elo que faltava entre PREVISTO e REAL).
 *
 * O sync já faz isso sozinho a cada rodada, com teto de gravações por execução.
 * Este script é para o passivo: as medições que já estavam no banco antes de o
 * casamento existir. Roda como OWNER (script admin).
 *
 * SEMPRE rode primeiro em `--dry`: ele mostra o que casaria, com o score de cada
 * par, e lista à parte os "quase" que ficaram de fora. Vincular ao card errado é
 * o erro caro (envenena o placar da IA em silêncio), então vale conferir a lista
 * antes de gravar.
 *
 * Uso:
 *   pnpm --filter @app/dobro conteudo:vincular --dry            → só o relatório
 *   pnpm --filter @app/dobro conteudo:vincular                  → grava os automáticos
 *   pnpm --filter @app/dobro conteudo:vincular --par <med> <post> → força UM par na mão
 */

import { eq, isNull } from 'drizzle-orm';
import { db } from '../../db/client';
import { conteudoDesempenho, conteudoPosts } from '../../db/schema';
import { vincularMedicoes } from '../desempenho-sync';

/** Encurta um texto para caber numa linha do terminal. */
function curto(texto: string | null, max = 60): string {
  const s = (texto ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return '(sem texto)';
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** "72%" a partir de 0.7234. */
function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

/** dd/mm de uma data (ou '??/??'). */
function dia(d: Date | null | undefined): string {
  if (!d) return '??/??';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Vincula UM par escolhido por gente (`--par <medicaoId> <postId>`). É a saída
 * para os casos que o automático deixa de fora de propósito: legenda reescrita,
 * dois cards parecidos, post publicado fora do board.
 */
async function vincularPar(medicaoId: string, postId: string): Promise<void> {
  const [medicao] = await db
    .select({ id: conteudoDesempenho.id, tema: conteudoDesempenho.tema })
    .from(conteudoDesempenho)
    .where(eq(conteudoDesempenho.id, medicaoId))
    .limit(1);
  if (!medicao) throw new Error(`medição ${medicaoId} não encontrada`);

  const [card] = await db
    .select({ id: conteudoPosts.id, titulo: conteudoPosts.titulo })
    .from(conteudoPosts)
    .where(eq(conteudoPosts.id, postId))
    .limit(1);
  if (!card) throw new Error(`card ${postId} não encontrado`);

  await db
    .update(conteudoDesempenho)
    .set({ postId: card.id, updatedAt: new Date() })
    .where(eq(conteudoDesempenho.id, medicao.id));

  console.log(`[vincular] "${curto(medicao.tema, 44)}" → card "${curto(card.titulo, 44)}"`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  const iPar = argv.indexOf('--par');
  if (iPar >= 0) {
    const [medicaoId, postId] = [argv[iPar + 1], argv[iPar + 2]];
    if (!medicaoId || !postId) throw new Error('uso: --par <medicaoId> <postId>');
    await vincularPar(medicaoId, postId);
    return;
  }

  const dryRun = argv.includes('--dry');

  // Rótulos para o relatório (o motor devolve ids; quem lê precisa de texto).
  const medicoes = await db
    .select({ id: conteudoDesempenho.id, tema: conteudoDesempenho.tema, data: conteudoDesempenho.data })
    .from(conteudoDesempenho)
    .where(isNull(conteudoDesempenho.postId));
  const cards = await db
    .select({ id: conteudoPosts.id, titulo: conteudoPosts.titulo, estado: conteudoPosts.estado })
    .from(conteudoPosts);

  const medPorId = new Map(medicoes.map((m) => [m.id, m]));
  const cardPorId = new Map(cards.map((c) => [c.id, c]));

  console.log(
    `[vincular] ${medicoes.length} medição(ões) sem card · ${cards.length} card(s) no board` +
      (dryRun ? ' · MODO DRY (não grava)' : ''),
  );

  const r = await vincularMedicoes(db, { dryRun, max: Number.POSITIVE_INFINITY });
  if (r.candidatas === 0) {
    console.log('[vincular] nada a fazer: toda medição já tem card.');
    return;
  }

  const casados = r.vereditos.filter((v) => v.postId);
  if (casados.length) {
    console.log(`\n=== ${casados.length} casamento(s) ===`);
    for (const v of casados) {
      const card = cardPorId.get(v.postId!);
      const m = medPorId.get(v.medicaoId);
      console.log(
        `  ${pct(v.score).padStart(4)} ${v.via === 'texto+data' ? '(texto+data)' : '(texto)     '} ` +
          `${dia(m?.data)} "${curto(m?.tema ?? null, 40)}"\n` +
          `        → [${card?.estado ?? '?'}] "${curto(card?.titulo ?? null, 52)}"`,
      );
    }
  }

  // Zona cinza: o motor achou um card plausível mas não o bastante para gravar
  // sozinho. Em vez de sumir com isso, mostra o par e o comando para confirmar.
  const sugestoes = r.vereditos.filter((v) => !v.postId && v.candidatoId);
  if (sugestoes.length) {
    console.log(`\n=== ${sugestoes.length} sugestão(ões) para conferir na mão ===`);
    for (const v of sugestoes.sort((a, b) => b.score - a.score).slice(0, 15)) {
      const card = cardPorId.get(v.candidatoId!);
      const m = medPorId.get(v.medicaoId);
      console.log(
        `  ${pct(v.score).padStart(4)} ${dia(m?.data)} "${curto(m?.tema ?? null, 40)}"\n` +
          `        ~ [${card?.estado ?? '?'}] "${curto(card?.titulo ?? null, 52)}"\n` +
          `        confirma: pnpm --filter @app/dobro conteudo:vincular --par ${v.medicaoId} ${v.candidatoId}`,
      );
    }
    if (sugestoes.length > 15) console.log(`  ... e mais ${sugestoes.length - 15}`);
  }

  const semNada = r.vereditos.filter((v) => !v.postId && !v.candidatoId).length;
  if (semNada) console.log(`\n${semNada} medição(ões) sem card parecido (posts anteriores ao board).`);

  console.log(
    dryRun
      ? `\n[vincular] DRY: ${r.vinculadas} vínculo(s) seriam gravados. Rode sem --dry para aplicar.`
      : `\n[vincular] OK — ${r.vinculadas} medição(ões) agora apontam para um card.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[vincular] FALHOU:', err instanceof Error ? (err.stack ?? err.message) : err);
    process.exit(1);
  });
