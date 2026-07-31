/**
 * Roda o motor de Lead Score (Story 1) sobre o histórico REAL de
 * `conteudo_desempenho` — mostra o que a seção "Análise" exibiria.
 * Uso:  npx tsx apps/dobro/scripts/analise-real.ts
 */

import { desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { conteudoDesempenho } from '../db/schema.js';
import {
  construirContexto,
  rankear,
  agregarPorFormato,
  agregarPorDiaSemana,
  nivelConfianca,
  OBJETIVO_LABEL,
  SINAL_LABEL,
  type PostMetrics,
  type Objetivo,
} from '../src/blocks/social-analise';

const FLABEL: Record<string, string> = { reel: 'Reels', carrossel: 'Carrossel', post: 'Post', story: 'Story' };
const fl = (f: string) => FLABEL[f] ?? f;

const rows = await db.select().from(conteudoDesempenho).orderBy(desc(conteudoDesempenho.data));

const posts: PostMetrics[] = rows.map((r, i) => ({
  id: String(r.id ?? `row-${i}`),
  formato: (r.formato ?? 'post').toLowerCase(),
  data: r.data ? r.data.toISOString() : null,
  tema: r.tema ?? null,
  alcance: r.alcance,
  comentarios: r.comentarios,
  visitasPerfil: r.visitasPerfil,
  salvamentos: r.salvamentos,
  compartilhamentos: r.compartilhamentos,
  seguidores: r.seguidores,
  curtidas: r.curtidas,
}));

const tit = (p: PostMetrics) => (p.tema?.trim() || `${fl(p.formato)} (sem tema)`).slice(0, 44);

for (const objetivo of ['lead'] as Objetivo[]) {
  const ctx = construirContexto(posts, objetivo);
  const { ranked } = rankear(posts, ctx);
  const porFormato = agregarPorFormato(posts, ctx);
  const porDia = agregarPorDiaSemana(posts, ctx);
  const conf = nivelConfianca(posts);

  console.log(`\n===== OBJETIVO: ${OBJETIVO_LABEL[objetivo]} =====`);
  console.log(`Confiança: ${conf.nivel} (${conf.n} posts com alcance)`);

  console.log(`\nFormato que mais funciona:`);
  for (const f of porFormato) console.log(`  ${fl(f.formato).padEnd(10)} Lead Score médio ${String(f.scoreMedio).padStart(3)}/100 · ${f.n} posts`);

  console.log(`\nMelhores dias:`);
  for (const d of porDia.slice(0, 3)) console.log(`  ${d.label}  ${String(d.scoreMedio).padStart(3)}/100 · ${d.n} posts`);

  console.log(`\nTop 5 campeões:`);
  for (const [i, sp] of ranked.slice(0, 5).entries()) {
    const why = sp.taxaTop ? SINAL_LABEL[sp.taxaTop] : '—';
    console.log(`  #${i + 1} [${String(sp.score).padStart(3)} ${sp.rotulo.padEnd(7)}] ${fl(sp.post.formato).padEnd(9)} · ${why.padEnd(17)} · ${tit(sp.post)}`);
  }

  console.log(`\n5 piores (rever):`);
  for (const sp of ranked.slice(-5).reverse()) {
    console.log(`  [${String(sp.score).padStart(3)} ${sp.rotulo.padEnd(7)}] ${fl(sp.post.formato).padEnd(9)} · ${tit(sp.post)}`);
  }
}
process.exit(0);
