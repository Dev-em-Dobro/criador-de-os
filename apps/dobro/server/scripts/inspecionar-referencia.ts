/**
 * apps/dobro — inspeciona UMA referência e os rascunhos ligados a ela (diagnóstico).
 *
 * Mostra o que o pipeline REALMENTE capturou do post (legenda, formato, métricas) e
 * o que gerou a partir disso. Serve pra responder "por que o rascunho saiu com um
 * tema que não tem nada a ver com a referência?".
 *
 * Uso (de dentro de apps/dobro): npx tsx server/scripts/inspecionar-referencia.ts <pedaço-da-url>
 *   ex.: npx tsx server/scripts/inspecionar-referencia.ts DapyEAakgTO
 */

import { desc, eq, like } from 'drizzle-orm';
import { db } from '../../db/client';
import { referencias, conteudoPosts } from '../../db/schema';

/** Corta texto longo pra caber no terminal, sem esconder que foi cortado. */
function trecho(s: string | null, max = 600): string {
  if (!s) return '(vazio)';
  const t = s.trim();
    return t.length > max ? `${t.slice(0, max)}\n       [...] (+${t.length - max} caracteres)` : t;
}

async function main(): Promise<void> {
  const alvo = process.argv[2];
  if (!alvo) throw new Error('passe um pedaço da URL (ex.: DapyEAakgTO) ou o id da referência');

  const refs = await db
    .select()
    .from(referencias)
    .where(like(referencias.origemUrl, `%${alvo}%`))
    .orderBy(desc(referencias.createdAt));

  if (!refs.length) {
    console.log(`Nenhuma referência com "${alvo}" na origem_url.`);
    return;
  }

  for (const r of refs) {
    console.log('='.repeat(70));
    console.log(`REFERÊNCIA ${r.id}`);
    console.log(`  status: ${r.status} · canal: ${r.canal} · tipo: ${r.tipo}`);
    console.log(`  url: ${r.origemUrl}`);
    console.log(`  formato detectado: ${r.formatoRef ?? '(não detectado)'}`);
    console.log(`  nota de quem mandou: ${r.notaTime ?? '(nenhuma)'}`);
    console.log(`  capa: ${r.capaUrl ? 'sim' : '(nenhuma)'}`);
    console.log(`  métricas capturadas: ${r.metricasRef ? JSON.stringify(r.metricasRef) : '(nenhuma)'}`);
    console.log(`\n  --- CONTEÚDO BRUTO (o que a IA leu do post) ---`);
    console.log(`  ${trecho(r.conteudoBruto).split('\n').join('\n  ')}`);
    console.log(`\n  --- ANÁLISE (teardown que a IA escreveu) ---`);
    console.log(`  ${trecho(r.analise, 400).split('\n').join('\n  ')}`);

    const posts = await db
      .select()
      .from(conteudoPosts)
      .where(eq(conteudoPosts.referenciaId, r.id))
      .orderBy(desc(conteudoPosts.createdAt));

    console.log(`\n  --- RASCUNHOS GERADOS (${posts.length}) ---`);
    for (const p of posts) {
      console.log(`  · [${p.estado}] ${p.titulo} (${p.formato})`);
      console.log(`    gancho: ${p.gancho ?? '(sem gancho)'}`);
      console.log(`    previsão no briefing: ${p.briefing ? 'sim' : 'não'}`);
      console.log(`    campo Referências: ${p.refsLinks ? p.refsLinks.split('\n').join(' | ') : '(vazio)'}`);
      // Com --full sai o post inteiro (slides + previsão), pra revisar no terminal.
      if (process.argv.includes('--full')) {
        console.log(`\n    PAUTA:\n      ${(p.pauta ?? '').split('\n').join('\n      ')}`);
        console.log(`\n    LEGENDA: ${p.legenda ?? ''}`);
        console.log(`    CTA: ${p.ctaFinal ?? ''}`);
        console.log(`    HASHTAGS: ${p.hashtags ?? ''}`);
        if (p.briefing) console.log(`\n    BRIEFING:\n      ${p.briefing.split('\n').join('\n      ')}`);
        console.log('');
      }
    }
  }

  // Últimos rascunhos no geral — pra achar um post que não esteja ligado à referência.
  const ultimos = await db
    .select()
    .from(conteudoPosts)
    .orderBy(desc(conteudoPosts.createdAt))
    .limit(8);
  console.log(`\n${'='.repeat(70)}\nÚLTIMOS RASCUNHOS DO BOARD (independente da referência):`);
  for (const p of ultimos) {
    const when = p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt);
    console.log(`  [${p.estado}] ${p.titulo} · ref=${p.referenciaId ?? '(sem referência)'} · ${when}`);
  }
}

main().catch((err) => {
  console.error('[inspecionar-referencia] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
