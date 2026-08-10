/**
 * apps/dobro — confronta a RÉGUA (Forte/Saudável/Abaixo) com a distribuição real
 * dos posts e sugere faixas novas.
 *
 * Por que RELATÓRIO e não ajuste automático: se a régua for recalculada sozinha a
 * partir dos próprios posts, ela vira relativa. Com "saudável = mediana", metade
 * do que se publica fica eternamente "Abaixo", por melhor que o perfil esteja, e
 * o histórico do Placar muda de significado a cada sync — previsões antigas
 * passariam a ser julgadas por uma régua que não existia quando foram feitas.
 *
 * Então a régua continua sendo uma decisão humana, escrita à mão em dois lugares
 * (`src/manifest.ts` e `src/blocks/regua-desempenho.ts`, espelhados em
 * `server/conteudo-previsao.ts`). O que este script faz é dar o dado para essa
 * decisão: onde estão os percentis hoje e quantos posts cada faixa classifica.
 *
 * Critério da sugestão:
 *   · SAUDÁVEL = mediana (p50) — metade dos posts entra, é o "normal da casa";
 *   · FORTE    = p85 — exceção de verdade, cerca de 1 em 7.
 *
 * Uso: pnpm --filter @app/dobro conteudo:calibrar-regua
 */

import { isNotNull } from 'drizzle-orm';
import { db } from '../../db/client';
import { conteudoDesempenho } from '../../db/schema';

/** Régua em vigor (espelha `regua-desempenho.ts` — a comparação é contra ela). */
const ATUAL: Record<string, { salv: [number, number]; comp: [number, number] }> = {
  reel: { salv: [0.003, 0.01], comp: [0.005, 0.015] },
  carrossel: { salv: [0.005, 0.02], comp: [0.003, 0.01] },
  post: { salv: [0.002, 0.007], comp: [0.002, 0.007] },
};

/** Alcance mínimo: taxa de post com alcance ínfimo é ruído, não sinal. */
const ALCANCE_MINIMO = 500;

/** Percentil "nearest rank" (sem interpolação: o valor é sempre um post real). */
function percentil(valores: number[], p: number): number {
  if (!valores.length) return 0;
  const a = [...valores].sort((x, y) => x - y);
  const i = Math.min(a.length - 1, Math.max(0, Math.round((p / 100) * (a.length - 1))));
  return a[i];
}

/** Decimal → "1,31%". */
function pct(v: number): string {
  return `${(v * 100).toFixed(2).replace('.', ',')}%`;
}

/** Quantos posts cada faixa pega, com a régua informada. */
function distribuir(valores: number[], faixa: [number, number]): string {
  const forte = valores.filter((v) => v >= faixa[1]).length;
  const abaixo = valores.filter((v) => v < faixa[0]).length;
  const saud = valores.length - forte - abaixo;
  const p = (n: number) => `${Math.round((n / valores.length) * 100)}%`;
  return `forte ${forte} (${p(forte)}) · saudável ${saud} (${p(saud)}) · abaixo ${abaixo} (${p(abaixo)})`;
}

function analisar(nome: string, valores: number[], atual: [number, number]): void {
  if (!valores.length) return;
  const sugestao: [number, number] = [percentil(valores, 50), percentil(valores, 85)];

  console.log(`  ${nome}`);
  console.log(
    `    percentis: p25 ${pct(percentil(valores, 25))} · p50 ${pct(percentil(valores, 50))} · ` +
      `p75 ${pct(percentil(valores, 75))} · p85 ${pct(percentil(valores, 85))} · p90 ${pct(percentil(valores, 90))}`,
  );
  console.log(`    régua atual  [${pct(atual[0])}, ${pct(atual[1])}] → ${distribuir(valores, atual)}`);
  console.log(
    `    sugestão     [${pct(sugestao[0])}, ${pct(sugestao[1])}] → ${distribuir(valores, sugestao)}`,
  );
  console.log(
    `    no formato do código: [${sugestao[0].toFixed(4)}, ${sugestao[1].toFixed(4)}]\n`,
  );
}

async function main(): Promise<void> {
  const linhas = await db
    .select()
    .from(conteudoDesempenho)
    .where(isNotNull(conteudoDesempenho.alcance));

  const validas = linhas.filter((r) => (r.alcance ?? 0) >= ALCANCE_MINIMO);
  console.log(
    `[calibrar] ${validas.length} posts com alcance >= ${ALCANCE_MINIMO} (de ${linhas.length} medidos)\n`,
  );

  for (const formato of Object.keys(ATUAL)) {
    const g = validas.filter((r) => r.formato === formato);
    if (!g.length) continue;
    console.log(`=== ${formato.toUpperCase()} (${g.length} posts)`);
    analisar(
      'salvamentos / alcance',
      g.map((r) => (r.salvamentos ?? 0) / (r.alcance ?? 1)),
      ATUAL[formato].salv,
    );
    analisar(
      'compartilhamentos / alcance',
      g.map((r) => (r.compartilhamentos ?? 0) / (r.alcance ?? 1)),
      ATUAL[formato].comp,
    );
  }

  console.log('[calibrar] Isto é um RELATÓRIO: nada foi alterado.');
  console.log('[calibrar] Para adotar uma sugestão, edite os TRÊS lugares (eles têm de bater):');
  console.log('  · src/manifest.ts            → abas "desempenho" e "placar", config.benchmarks');
  console.log('  · src/blocks/regua-desempenho.ts → DEFAULT_BENCH');
  console.log('  · server/conteudo-previsao.ts    → BENCHMARKS (a cópia do servidor)');
  console.log('[calibrar] Mudar a régua reclassifica o histórico, inclusive as previsões já feitas.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[calibrar] FALHOU:', err instanceof Error ? (err.stack ?? err.message) : err);
    process.exit(1);
  });
