/**
 * Testa o Estrategista (Story 2) de ponta a ponta com dados REAIS:
 * lê o desempenho → monta o briefing (igual à tela fará) → chama a IA.
 * Uso:  npx tsx apps/dobro/scripts/test-estrategista.ts
 */

import { desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { conteudoDesempenho } from '../db/schema.js';
import { getAgencyAnthropicKey } from '../server/env.js';
import { estrategistaFromInput, type ModoId } from '../server/conteudo-estrategista.js';
import {
  construirContexto,
  rankear,
  agregarPorFormato,
  agregarPorDiaSemana,
  nivelConfianca,
  OBJETIVO_LABEL,
  SINAL_LABEL,
  type PostMetrics,
} from '../src/blocks/social-analise';

const FL: Record<string, string> = { reel: 'Reels', carrossel: 'Carrossel', post: 'Post', story: 'Story' };
const fl = (f: string) => FL[f] ?? f;

const rows = await db.select().from(conteudoDesempenho).orderBy(desc(conteudoDesempenho.data));
const posts: PostMetrics[] = rows.map((r, i) => ({
  id: String(r.id ?? i),
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

const ctx = construirContexto(posts, 'lead');
const { ranked } = rankear(posts, ctx);
const conf = nivelConfianca(posts);
const tit = (p: PostMetrics) => (p.tema?.trim() || `${fl(p.formato)}`).slice(0, 120);

const briefing = {
  objetivoLabel: OBJETIVO_LABEL.lead,
  confianca: conf.nivel,
  totalPosts: conf.n,
  porFormato: agregarPorFormato(posts, ctx).map((a) => ({ chave: fl(a.formato), scoreMedio: a.scoreMedio, n: a.n })),
  porDia: agregarPorDiaSemana(posts, ctx).map((a) => ({ chave: a.label, scoreMedio: a.scoreMedio, n: a.n })),
  campeoes: ranked.slice(0, 10).map((sp) => ({
    score: sp.score,
    rotulo: sp.rotulo,
    formato: fl(sp.post.formato),
    taxaTop: sp.taxaTop ? SINAL_LABEL[sp.taxaTop] : null,
    tema: tit(sp.post),
  })),
  piores: ranked.slice(-5).reverse().map((sp) => ({
    score: sp.score,
    rotulo: sp.rotulo,
    formato: fl(sp.post.formato),
    taxaTop: sp.taxaTop ? SINAL_LABEL[sp.taxaTop] : null,
    tema: tit(sp.post),
  })),
};

const apiKey = getAgencyAnthropicKey();
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY ausente — não dá pra testar a IA.');
  process.exit(1);
}

// Perfil de exemplo (o que a tela vai preencher). Vazio testa o "não informado".
const perfil = {
  direcao:
    'Estamos pivotando: de ensino de programação para leigos para ensinar IA e automações para quem já ' +
    'tem conhecimento mínimo de tecnologia (conteúdo para leigos não converte mais). No último mês os ' +
    'carrosséis performaram muito melhor que os Reels, então estamos priorizando CARROSSEL agora.',
  bio: 'Dev em Dobro | Aprenda a programar do zero com IA',
  destaques: 'Curso, Depoimentos, Ferramentas, IA',
  produto: 'Curso de programação do zero com IA',
  ticket: 'R$ 997',
  comoVende: 'Lançamento mensal por WhatsApp/DM após captar leads no feed',
  objecao: 'Acho que sou velho demais / não tenho base de exatas',
  tempoDia: '2 horas',
  publico: 'Quem quer migrar de carreira pra programação e trava no começo',
};

const modo = (process.argv[2] as ModoId) || 'conteudo';
console.log(`Modo: ${modo} · base: ${briefing.totalPosts} posts\n`);
const { analise } = await estrategistaFromInput({ modo, briefing, perfil }, apiKey);

console.log('===== RESUMO =====\n' + analise.resumo + '\n');
for (const sec of analise.secoes) {
  console.log(`\n### ${sec.titulo}\n${sec.conteudo}`);
}
if (analise.entregavel) {
  console.log(`\n===== ENTREGÁVEL: ${analise.entregavel.titulo} =====\n${analise.entregavel.texto}`);
}
process.exit(0);
