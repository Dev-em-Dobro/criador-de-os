/**
 * apps/dobro — resgata as PREVISÕES que só existem como TEXTO no `briefing` do
 * card e grava cada uma como linha em `conteudo_previsoes`.
 *
 * Antes de a previsão virar dado, ela era formatada por
 * `formatarPrevisaoBriefing()` e colada no briefing. Esse histórico é a base
 * inicial do placar da IA (previsto x real): jogá-lo fora seria começar o placar
 * do zero tendo material medido na mão.
 *
 * O parser lê o formato que o próprio código escreveu, ancorado na linha do 🔮 —
 * o bloco nem sempre está no começo do briefing (há cards com anotação de teste
 * de capa antes). O que não casar com o formato é REPORTADO, nunca adivinhado.
 *
 * Idempotente: pula o que já foi gravado (mesmo post + mesma data de registro).
 * Roda como OWNER (script admin).
 *
 * Uso:
 *   pnpm --filter @app/dobro conteudo:previsoes-backfill --dry   → só o relatório
 *   pnpm --filter @app/dobro conteudo:previsoes-backfill         → grava
 */

import { db } from '../../db/client';
import { conteudoPosts, conteudoPrevisoes } from '../../db/schema';
import { classificarPorRegua, type Confianca } from '../conteudo-previsao';

/** O que se consegue extrair de um bloco de previsão em texto. */
interface PrevisaoDoTexto {
  registradaEm: Date;
  confianca: Confianca;
  taxaSalvamentosPct: number;
  taxaCompartilhamentosPct: number;
  retencaoPct: number | null;
  furaTotal: number | null;
  furaNotas: Record<string, number> | null;
  apostaPrincipal: string | null;
  riscos: string[];
  furaJustificativa: string | null;
  resumo: string | null;
  modelo: string | null;
}

/** "1,8" → 1.8 (os números foram escritos em português). */
function numBr(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** "05/08/2026" → Date ao meio-dia local (hora não foi gravada no texto). */
function dataBr(s: string | undefined): Date | null {
  if (!s) return null;
  const [d, m, a] = s.split('/').map(Number);
  if (!d || !m || !a) return null;
  const dt = new Date(a, m - 1, d, 12, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Pega o resto da linha que começa com `rotulo`. */
function linhaDepoisDe(bloco: string, rotulo: string): string | null {
  const re = new RegExp(`^${rotulo}:\\s*(.+)$`, 'im');
  return bloco.match(re)?.[1]?.trim() || null;
}

/** Ou a previsão extraída, ou o motivo de não dar. */
export type LeituraPrevisao =
  | { ok: true; previsao: PrevisaoDoTexto }
  | { ok: false; motivo: string };

/**
 * Extrai a previsão do briefing.
 *
 * Falha com motivo quando falta o essencial: as DUAS taxas. A primeira previsão
 * do perfil foi escrita à mão, em prosa ("alta chance de performar"), sem número
 * nenhum — não há como classificá-la pela régua, e chutar uma taxa para ela
 * entrar na tabela contaminaria justamente a medida de acurácia que a tabela
 * existe para calcular.
 */
export function lerPrevisaoDoBriefing(briefing: string | null): LeituraPrevisao {
  if (!briefing) return { ok: false, motivo: 'sem briefing' };
  const inicio = briefing.indexOf('🔮');
  if (inicio < 0) return { ok: false, motivo: 'sem bloco de previsão' };
  const bloco = briefing.slice(inicio);

  const registradaEm = dataBr(bloco.match(/registrada em (\d{2}\/\d{2}\/\d{4})/i)?.[1]);
  if (!registradaEm) return { ok: false, motivo: 'sem data de registro' };

  const salv = numBr(bloco.match(/salvamentos\s+([\d,]+)%/i)?.[1]);
  const comp = numBr(bloco.match(/compartilhamentos\s+([\d,]+)%/i)?.[1]);
  if (salv == null || comp == null) {
    return { ok: false, motivo: 'previsão sem as taxas (escrita à mão, só em prosa)' };
  }

  const conf = bloco.match(/confian[çc]a\s+(alta|media|média|baixa)\)/i)?.[1]?.toLowerCase();
  const confianca: Confianca =
    conf === 'alta' ? 'alta' : conf === 'baixa' ? 'baixa' : 'media';

  const fura = bloco.match(
    /Fura a Bolha:\s*(\d+)\/25\s*\(capa (\d+), slide 2 (\d+), slide sozinho (\d+), salv[áa]vel (\d+), CTA (\d+)\)/i,
  );

  const previsao: PrevisaoDoTexto = {
    registradaEm,
    confianca,
    taxaSalvamentosPct: salv,
    taxaCompartilhamentosPct: comp,
    retencaoPct: numBr(bloco.match(/reten[çc][ãa]o\s+([\d,]+)%/i)?.[1]),
    furaTotal: fura ? Number(fura[1]) : null,
    furaNotas: fura
      ? {
          capaParaODedo: Number(fura[2]),
          slide2Confirma: Number(fura[3]),
          slideSozinho: Number(fura[4]),
          slideSalvavel: Number(fura[5]),
          ctaUnico: Number(fura[6]),
        }
      : null,
    apostaPrincipal: linhaDepoisDe(bloco, 'Aposta principal'),
    riscos: (linhaDepoisDe(bloco, 'Riscos') ?? '')
      .split('|')
      .map((r) => r.trim())
      .filter(Boolean),
    furaJustificativa: linhaDepoisDe(bloco, 'Notas'),
    resumo: linhaDepoisDe(bloco, 'Veredito'),
    modelo: bloco.match(/modelo\s+([a-z0-9.\-_]+)/i)?.[1] ?? null,
  };
  return { ok: true, previsao };
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry');

  const cards = await db
    .select({
      id: conteudoPosts.id,
      titulo: conteudoPosts.titulo,
      formato: conteudoPosts.formato,
      briefing: conteudoPosts.briefing,
    })
    .from(conteudoPosts);

  // Idempotência: (post, data de registro) que já está na tabela não entra de novo.
  const jaGravadas = await db
    .select({ postId: conteudoPrevisoes.postId, registradaEm: conteudoPrevisoes.registradaEm })
    .from(conteudoPrevisoes);
  const chaveExistente = new Set(
    jaGravadas.map((p) => `${p.postId}|${p.registradaEm.toISOString().slice(0, 10)}`),
  );

  const comBloco = cards.filter((c) => (c.briefing ?? '').includes('🔮'));
  console.log(
    `[backfill] ${cards.length} card(s) · ${comBloco.length} com previsão em texto` +
      (dryRun ? ' · MODO DRY (não grava)' : ''),
  );

  let gravadas = 0;
  let puladas = 0;
  const falhas: { titulo: string; motivo: string }[] = [];

  for (const card of comBloco) {
    const leitura = lerPrevisaoDoBriefing(card.briefing);
    if (!leitura.ok) {
      falhas.push({ titulo: card.titulo ?? card.id, motivo: leitura.motivo });
      continue;
    }
    const p = leitura.previsao;

    const chave = `${card.id}|${p.registradaEm.toISOString().slice(0, 10)}`;
    if (chaveExistente.has(chave)) {
      puladas++;
      continue;
    }

    const formato = card.formato === 'reels' ? 'reels' : 'carrossel';
    const { classe, subClasses } = classificarPorRegua(
      formato,
      p.taxaSalvamentosPct,
      p.taxaCompartilhamentosPct,
      p.retencaoPct,
    );

    console.log(
      `  ${p.registradaEm.toLocaleDateString('pt-BR')} ${classe.padEnd(8)} ` +
        `salv ${p.taxaSalvamentosPct}% comp ${p.taxaCompartilhamentosPct}% ` +
        `fura ${p.furaTotal ?? '?'}/25 — ${(card.titulo ?? '').slice(0, 46)}`,
    );

    if (!dryRun) {
      await db.insert(conteudoPrevisoes).values({
        postId: card.id,
        classe,
        confianca: p.confianca,
        taxaSalvamentosPct: p.taxaSalvamentosPct,
        taxaCompartilhamentosPct: p.taxaCompartilhamentosPct,
        retencaoPct: p.retencaoPct,
        classeSalvamentos: subClasses.salvamentos,
        classeCompartilhamentos: subClasses.compartilhamentos,
        classeRetencao: subClasses.retencao,
        apostaPrincipal: p.apostaPrincipal,
        riscos: p.riscos,
        furaTotal: p.furaTotal,
        furaNotas: p.furaNotas,
        furaJustificativa: p.furaJustificativa,
        resumo: p.resumo,
        modelo: p.modelo,
        registradaEm: p.registradaEm,
      });
    }
    chaveExistente.add(chave);
    gravadas++;
  }

  if (falhas.length) {
    console.log(`\n[backfill] ${falhas.length} bloco(s) não gravados:`);
    for (const f of falhas) console.log(`  · ${f.titulo.slice(0, 52)} — ${f.motivo}`);
  }
  console.log(
    dryRun
      ? `\n[backfill] DRY: ${gravadas} previsão(ões) seriam gravadas, ${puladas} já existiam.`
      : `\n[backfill] OK — ${gravadas} gravada(s), ${puladas} já existiam.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[backfill] FALHOU:', err instanceof Error ? (err.stack ?? err.message) : err);
    process.exit(1);
  });
