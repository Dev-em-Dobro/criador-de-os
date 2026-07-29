/**
 * apps/dobro — coloca no cronograma (conteudo_posts) os carrosséis que o Ricardo
 * quer produzir HOJE. Cada um entra como card em estado 'rascunho', programado
 * para o dia de hoje, com o BRIEFING (a ideia crua dele) e os LINKS de referência
 * preenchidos — pronto pra abrir no board /conteudo e roteirizar.
 *
 * NÃO inventa slides/roteiro: só transcreve fielmente a ideia + referência de cada
 * um (o roteiro é o que o Ricardo escreve hoje). Roda como OWNER (script admin).
 *
 * Idempotente: remove versões anteriores de mesmo título antes de inserir.
 *
 * Uso: pnpm --filter @app/dobro exec tsx db/seed-carrossel-cronograma.ts
 */

import { inArray } from 'drizzle-orm';
import { db } from './client';
import { conteudoPosts } from './schema';

/** Hoje (29/07/2026), meia-noite UTC — mesma convenção do conteudo:agendar, sem drift de fuso. */
const HOJE = new Date('2026-07-29T00:00:00.000Z');

type Card = {
  titulo: string;
  gancho: string | null;
  briefing: string;
  refsLinks: string | null;
};

const cards: Card[] = [
  {
    titulo: 'GPT novo: como ele "hackeou" os sistemas internos da empresa',
    gancho: 'O ChatGPT novo "hackeou" os sistemas internos da própria empresa 👀',
    briefing:
      'Carrossel sobre o modelo novo do ChatGPT e o episódio em que ele burlou/"hackeou" ' +
      'sistemas internos. Ângulo: curiosidade + o que isso revela sobre a capacidade (e os ' +
      'riscos) da IA. Fechar conectando com "por isso entender a máquina/saber programar importa".',
    refsLinks: null,
  },
  {
    titulo: 'Como se viciar em programar (carrossel do nosso reels)',
    gancho: 'Como eu me viciei em programar (e como você faz o mesmo)',
    briefing:
      'Adaptar o NOSSO reels "como se viciar em programar" para o formato carrossel: ' +
      'reaproveitar a estrutura e os ganchos do vídeo, quebrando em slides.',
    refsLinks: 'https://www.instagram.com/devemdobro/reel/DYfdos8p49S/',
  },
  {
    titulo: 'Como o GTA clássico sabotava quem tentava piratear',
    gancho: 'O GTA clássico tinha uma vingança genial contra quem pirateava o jogo',
    briefing:
      'Carrossel sobre proteções anti-pirataria escondidas em jogos clássicos, com o GTA como ' +
      'caso principal (ex.: na cópia pirata a arma atira mas a bala não sai; o jogo sabota o ' +
      'jogador aos poucos). Trazer VÁRIOS outros exemplos interessantes de outros jogos. ' +
      'Ângulo: engenharia criativa por trás dos jogos → gancho pra "isso é programação".',
    refsLinks: null,
  },
  {
    titulo: 'Dica de jogo pra aprender programação',
    gancho: 'Um jogo que ensina programação de verdade (e ainda é divertido)',
    briefing:
      'Decidir: REPOSTAR o carrossel de referência OU criar um novo sobre um jogo que ensina a ' +
      'programar. Se criar novo, usar a referência como base de estrutura.',
    refsLinks: 'https://www.instagram.com/p/DYN1EvkiUVT/?img_index=1',
  },
  {
    titulo: 'Meu maior erro depois de usar IA (não gastar 30 min nessas coisas)',
    gancho: 'Meu maior erro depois de usar IA foi não gastar 30 minutos nessas coisas',
    briefing:
      'Carrossel de lição pessoal/bastidor: o maior erro depois de adotar IA foi não investir ' +
      '~30 min em [DEFINIR "essas coisas": configurar contexto/instruções, aprender os atalhos, ' +
      'organizar prompts…]. Cada slide = uma dessas "coisas" que valem os 30 min. Definir a lista.',
    refsLinks: null,
  },
  {
    titulo: 'Novo ChatGPT: 2º ângulo (definir gancho)',
    gancho: null,
    briefing:
      'Segundo carrossel sobre o ChatGPT novo, com ângulo DIFERENTE do card "hackeou os sistemas ' +
      'internos". DEFINIR o gancho (ex.: o que muda de verdade pra quem programa, novidades do ' +
      'modelo, um caso de uso prático). Nota original: "mais um sobre o novo chatgpt".',
    refsLinks: null,
  },
];

async function main(): Promise<void> {
  const titulos = cards.map((c) => c.titulo);
  // Títulos antigos (com travessão) — removidos junto p/ o rerun não duplicar após o rename.
  const titulosAntigos = [
    'GPT novo — e como ele "hackeou" os sistemas internos da empresa',
    'Novo ChatGPT — 2º ângulo (definir gancho)',
  ];

  console.log('[cronograma] removendo versões anteriores (idempotência)...');
  await db.delete(conteudoPosts).where(inArray(conteudoPosts.titulo, [...titulos, ...titulosAntigos]));

  console.log(`[cronograma] inserindo ${cards.length} carrosséis como rascunho para hoje (29/07)...`);
  const created = await db
    .insert(conteudoPosts)
    .values(
      cards.map((c) => ({
        titulo: c.titulo,
        estado: 'rascunho' as const,
        plataforma: 'instagram' as const,
        formato: 'carrossel' as const,
        dataProgramada: HOJE,
        gancho: c.gancho,
        briefing: c.briefing,
        refsLinks: c.refsLinks,
      })),
    )
    .returning({ id: conteudoPosts.id, titulo: conteudoPosts.titulo });

  created.forEach((r, i) => console.log(`  ${i + 1}. ${r.titulo} (${r.id})`));
  console.log(`[cronograma] OK — ${created.length} cards no board /conteudo.`);
}

main().catch((err) => {
  console.error('[cronograma] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
