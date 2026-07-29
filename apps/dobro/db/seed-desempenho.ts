/**
 * apps/dobro — popula `conteudo_desempenho` com medições de EXEMPLO para visualizar
 * a tela `/conteudo/desempenho` (a "aba Instagram" da planilha, dentro do OS).
 *
 * São números crus plausíveis (alcance, salvamentos, compartilhamentos…) escolhidos
 * de propósito para cair nas 3 classificações — Forte / Saudável / Abaixo — em todos
 * os formatos (reel, carrossel, post), contra os benchmarks default do manifesto:
 *   reel:      compart [0.5%,1.5%]  salv [0.3%,1.0%]  retenção [50%,70%]
 *   carrossel: compart [0.3%,1.0%]  salv [0.5%,2.0%]
 *   post:      compart [0.2%,0.7%]  salv [0.2%,0.7%]
 * As TAXAS e a CLASSIFICAÇÃO são derivadas na tela a partir destes valores — aqui
 * gravamos só o sinal cru.
 *
 * Idempotente: remove medições de seed anteriores (media_id 'seed-desempenho-*')
 * antes de inserir. Roda como OWNER (script admin).
 *
 * Uso: pnpm --filter @app/dobro exec tsx db/seed-desempenho.ts
 */

import { like } from 'drizzle-orm';
import { db } from './client';
import { conteudoDesempenho } from './schema';

type Medicao = typeof conteudoDesempenho.$inferInsert;

/** 27/07/2026 09:00 (local) → helper curto para as datas de publicação. */
function dia(d: number): Date {
  return new Date(2026, 6, d, 9, 0, 0);
}

/** Medições de exemplo — nome do tema reflete a classificação esperada. */
const medicoes: Medicao[] = [
  // ── REELS ──────────────────────────────────────────────────────────────
  {
    mediaId: 'seed-desempenho-01',
    data: dia(27),
    formato: 'reel',
    tema: 'Erro de iniciante que trava sua evolução',
    alcance: 25000,
    visualizacoes: 41000,
    curtidas: 2100,
    comentarios: 180,
    compartilhamentos: 400, // 1,6% ≥ 1,5% → Forte
    salvamentos: 300, //        1,2% ≥ 1,0% → Forte
    visitasPerfil: 620,
    seguidores: 140,
    duracaoS: 30,
    tempoMedioS: 22, //         retenção 73% ≥ 70% → Forte  ⇒ GERAL Forte
    permalink: 'https://instagram.com/reel/exemplo01',
  },
  {
    mediaId: 'seed-desempenho-02',
    data: dia(24),
    formato: 'reel',
    tema: '3 comandos do terminal que todo dev usa',
    alcance: 18000,
    visualizacoes: 27000,
    curtidas: 1250,
    comentarios: 90,
    compartilhamentos: 144, // 0,8% → Saudável
    salvamentos: 90, //        0,5% → Saudável
    visitasPerfil: 300,
    seguidores: 60,
    duracaoS: 45,
    tempoMedioS: 27, //        retenção 60% → Saudável  ⇒ GERAL Saudável
  },
  {
    mediaId: 'seed-desempenho-03',
    data: dia(20),
    formato: 'reel',
    tema: 'Bastidores do meu setup de trabalho',
    alcance: 12000,
    visualizacoes: 15000,
    curtidas: 640,
    comentarios: 32,
    compartilhamentos: 36, //  0,3% < 0,5% → Abaixo
    salvamentos: 24, //        0,2% < 0,3% → Abaixo
    visitasPerfil: 110,
    seguidores: 15,
    duracaoS: 60,
    tempoMedioS: 24, //        retenção 40% < 50% → Abaixo  ⇒ GERAL Abaixo
  },
  {
    mediaId: 'seed-desempenho-04',
    data: dia(15),
    formato: 'reel',
    tema: 'Ao vivo: do zero ao deploy em 20 minutos',
    alcance: 30000,
    visualizacoes: 52000,
    curtidas: 2600,
    comentarios: 210,
    compartilhamentos: 480, // 1,6% → Forte
    salvamentos: 60, //        0,2% → Abaixo
    visitasPerfil: 700,
    seguidores: 130,
    duracaoS: 40,
    tempoMedioS: 24, //        retenção 60% → Saudável  ⇒ GERAL Saudável (misto)
  },

  // ── CARROSSÉIS ─────────────────────────────────────────────────────────
  {
    mediaId: 'seed-desempenho-05',
    data: dia(26),
    formato: 'carrossel',
    tema: 'As travas reais de vocês (e a virada de cada uma)',
    alcance: 20000,
    curtidas: 1600,
    comentarios: 240,
    compartilhamentos: 220, // 1,1% ≥ 1,0% → Forte
    salvamentos: 440, //       2,2% ≥ 2,0% → Forte  ⇒ GERAL Forte
    visitasPerfil: 480,
    seguidores: 160,
    permalink: 'https://instagram.com/p/exemplo05',
  },
  {
    mediaId: 'seed-desempenho-06',
    data: dia(22),
    formato: 'carrossel',
    tema: 'Roadmap front-end 2026 (passo a passo)',
    alcance: 14000,
    curtidas: 900,
    comentarios: 70,
    compartilhamentos: 70, //  0,5% → Saudável
    salvamentos: 140, //       1,0% → Saudável  ⇒ GERAL Saudável
    visitasPerfil: 240,
    seguidores: 55,
  },
  {
    mediaId: 'seed-desempenho-07',
    data: dia(18),
    formato: 'carrossel',
    tema: 'Minhas ferramentas favoritas de dev',
    alcance: 9000,
    curtidas: 380,
    comentarios: 20,
    compartilhamentos: 18, //  0,2% < 0,3% → Abaixo
    salvamentos: 36, //        0,4% < 0,5% → Abaixo  ⇒ GERAL Abaixo
    visitasPerfil: 70,
    seguidores: 8,
  },

  // ── POSTS (imagem única) ───────────────────────────────────────────────
  {
    mediaId: 'seed-desempenho-08',
    data: dia(25),
    formato: 'post',
    tema: 'Vaga aberta: júnior que fez projeto real',
    alcance: 10000,
    curtidas: 720,
    comentarios: 60,
    compartilhamentos: 80, //  0,8% ≥ 0,7% → Forte
    salvamentos: 80, //        0,8% ≥ 0,7% → Forte  ⇒ GERAL Forte
    visitasPerfil: 210,
    seguidores: 45,
  },
  {
    mediaId: 'seed-desempenho-09',
    data: dia(21),
    formato: 'post',
    tema: 'Consistência vence motivação — todo dia',
    alcance: 7000,
    curtidas: 410,
    comentarios: 24,
    compartilhamentos: 28, //  0,4% → Saudável
    salvamentos: 28, //        0,4% → Saudável  ⇒ GERAL Saudável
    visitasPerfil: 90,
    seguidores: 18,
  },
  {
    mediaId: 'seed-desempenho-10',
    data: dia(12),
    formato: 'post',
    tema: 'Bom dia, bora codar ☕',
    alcance: 5000,
    curtidas: 190,
    comentarios: 8,
    compartilhamentos: 5, //   0,1% < 0,2% → Abaixo
    salvamentos: 5, //         0,1% < 0,2% → Abaixo  ⇒ GERAL Abaixo
    visitasPerfil: 30,
    seguidores: 3,
  },
];

async function main(): Promise<void> {
  console.log('[desempenho] removendo medições de seed anteriores (idempotência)...');
  await db.delete(conteudoDesempenho).where(like(conteudoDesempenho.mediaId, 'seed-desempenho-%'));

  console.log(`[desempenho] inserindo ${medicoes.length} medições de exemplo...`);
  const created = await db
    .insert(conteudoDesempenho)
    .values(medicoes)
    .returning({ id: conteudoDesempenho.id, tema: conteudoDesempenho.tema });

  console.log(`[desempenho] OK — ${created.length} medições criadas.`);
}

main().catch((err) => {
  console.error('[desempenho] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
