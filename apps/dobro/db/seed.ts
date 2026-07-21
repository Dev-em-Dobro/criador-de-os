/**
 * apps/dobro — seed de dados de EXEMPLO em `metricas_visao_geral`.
 *
 * Popula uma linha por período (weekly/monthly/quarterly) para que o filtro de
 * período do shell tenha algo para mostrar. Idempotente: limpa a tabela antes.
 * Os valores espelham o mock que a tela usava na fatia 1B (agora vindos do banco).
 */

import { db } from './client';
import { conteudoPosts, metricasVisaoGeral } from './schema';

const rows = [
  {
    period: 'monthly',
    receita: 128400,
    receitaPrev: 112300,
    conversao: 3.8,
    conversaoPrev: 3.2,
    roas: 2.6,
    roasPrev: 2.9,
    leads: 1840,
    leadsPrev: 1520,
  },
  {
    period: 'weekly',
    receita: 31200,
    receitaPrev: 28900,
    conversao: 3.5,
    conversaoPrev: 3.3,
    roas: 2.4,
    roasPrev: 2.5,
    leads: 470,
    leadsPrev: 410,
  },
  {
    period: 'quarterly',
    receita: 402800,
    receitaPrev: 356100,
    conversao: 4.1,
    conversaoPrev: 3.6,
    roas: 2.8,
    roasPrev: 2.7,
    leads: 5720,
    leadsPrev: 4880,
  },
];

/** Posts de EXEMPLO do board "Conteúdo" — cobrem os 3 estados e os 2 formatos. */
const conteudoRows = [
  {
    titulo: '5 erros que travam sua evolução como dev',
    formato: 'reels',
    estado: 'rascunho',
    capaUrl: 'https://picsum.photos/seed/dev-erros/400/300',
    dataProgramada: new Date('2026-07-21T09:00:00'),
    ctaFinal: 'Salva esse pra não esquecer 👇',
    linkPresenteNotion: 'https://www.notion.so/devemdobro/checklist-dev',
  },
  {
    titulo: 'Roadmap Full Stack 2026 (do zero ao primeiro emprego)',
    formato: 'carrossel',
    estado: 'rascunho',
    capaUrl: 'https://picsum.photos/seed/roadmap/400/300',
    dataProgramada: new Date('2026-07-23T18:30:00'),
    ctaFinal: 'Comenta "ROADMAP" que eu te envio o guia completo',
    linkPresenteNotion: 'https://www.notion.so/devemdobro/roadmap-fullstack',
  },
  {
    titulo: 'Como sair do júnior em 12 meses',
    formato: 'carrossel',
    estado: 'pronto',
    capaUrl: 'https://picsum.photos/seed/junior/400/300',
    dataProgramada: new Date('2026-07-19T12:00:00'),
    ctaFinal: 'Compartilha com quem tá começando agora',
    linkPresenteNotion: 'https://www.notion.so/devemdobro/plano-12-meses',
  },
  {
    titulo: 'O que ninguém te conta sobre ser freelancer dev',
    formato: 'reels',
    estado: 'pronto',
    capaUrl: 'https://picsum.photos/seed/freela/400/300',
    dataProgramada: new Date('2026-07-20T20:00:00'),
    ctaFinal: 'Segue pra parte 2 amanhã 🔥',
    linkPresenteNotion: 'https://www.notion.so/devemdobro/kit-freelancer',
  },
  {
    titulo: '7 projetos pra bombar seu portfólio',
    formato: 'carrossel',
    estado: 'publicado',
    capaUrl: 'https://picsum.photos/seed/portfolio/400/300',
    dataProgramada: new Date('2026-07-14T09:00:00'),
    ctaFinal: 'Salva e começa hoje 🚀',
    linkPresenteNotion: 'https://www.notion.so/devemdobro/ideias-projetos',
  },
  {
    titulo: 'React vs Vue em 2026: qual escolher?',
    formato: 'reels',
    estado: 'publicado',
    capaUrl: 'https://picsum.photos/seed/react-vue/400/300',
    dataProgramada: new Date('2026-07-11T17:00:00'),
    ctaFinal: 'Qual é o seu? Comenta aí 👇',
    linkPresenteNotion: 'https://www.notion.so/devemdobro/comparativo-frameworks',
  },
];

async function main(): Promise<void> {
  console.log('[seed] limpando metricas_visao_geral...');
  await db.delete(metricasVisaoGeral);

  console.log(`[seed] inserindo ${rows.length} linha(s)...`);
  await db.insert(metricasVisaoGeral).values(rows);

  console.log('[seed] limpando conteudo_posts...');
  await db.delete(conteudoPosts);

  console.log(`[seed] inserindo ${conteudoRows.length} post(s) de conteúdo...`);
  await db.insert(conteudoPosts).values(conteudoRows);

  console.log('[seed] OK.');
}

main().catch((err) => {
  console.error('[seed] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
