/**
 * apps/dobro — insere o carrossel "objeções reais dos seguidores" no cronograma
 * (conteudo_posts) programado para HOJE, com o roteiro dos slides preenchido para
 * alimentar o PREVIEW do board. Roda como OWNER (script admin).
 *
 * Também (re)aplica a view v_conteudo_posts com as colunas de conteúdo
 * (gancho/pauta/legenda/hashtags/roteiro) — necessárias para o preview ler os
 * slides via /api/query. Idempotente: remove um post anterior de mesmo título.
 *
 * Uso: pnpm --filter @app/dobro exec tsx db/seed-carrossel-objecoes.ts
 */

import { inArray, sql } from 'drizzle-orm';
import { db } from './client';
import { conteudoPosts } from './schema';

const TITULO_ANTIGO = 'As travas reais de vocês (e a virada de cada uma)';
const TITULO = 'Tem medo de estudar programação por meses e não conseguir emprego?';

/** View com as colunas de conteúdo no FINAL (CREATE OR REPLACE só acrescenta ao fim). */
const VIEW_SQL = `
CREATE OR REPLACE VIEW v_conteudo_posts AS
SELECT
  id::text AS id,
  titulo,
  capa_url,
  data_programada,
  cta_final,
  link_presente_notion,
  estado,
  formato,
  briefing_url,
  briefing,
  refs_links,
  gancho,
  pauta,
  legenda,
  hashtags,
  roteiro
FROM conteudo_posts`;

/** Os 12 slides do carrossel, em ordem AIDA (slide 1 = capa/gancho). */
const slides: Array<{ titulo: string; corpo: string; img?: string }> = [
  {
    titulo: 'Tem medo de estudar programação por meses e **não conseguir emprego**?',
    corpo:
      'Eu perguntei nas caixinhas o que mais trava o iniciante e vou te dar um passo a passo pra destravar 👉',
    img: '/capa-objecoes.png',
  },
  {
    titulo: '1. "**Não sei por onde começar**"',
    corpo:
      '"Não sei qual direção seguir." "Muita informação." "Parece inalcançável." Foi a mais repetida de todas. E faz total sentido travar aí.',
  },
  {
    titulo: 'Não falta conteúdo. **Falta ordem**.',
    corpo:
      'Você não trava por falta de aula. Trava por estar sozinho, sem um caminho na frente. O problema é começar no escuro. Não é você.',
  },
  {
    titulo: '2. "E se eu estudar meses e **não conseguir emprego**?"',
    corpo:
      '"Não arrumar emprego mesmo sendo avançado." "As vagas tão exigentes." É o medo do esforço jogado fora. Talvez o mais doído de todos.',
  },
  {
    titulo: 'Quem não consegue quase sempre estudou **sem direção**',
    corpo:
      'E quase sempre sem um projeto real pra mostrar. Recrutador não quer certificado, quer ver algo que você construiu e botou no ar. Com projeto, a conversa muda.',
  },
  {
    titulo: '3. "Será que **já é tarde** pra mim?"',
    corpo:
      'Na nossa enquete, 54% disseram que às vezes acham que já passou da hora. Mais da metade. Se você pensa isso, não está nem perto de estar sozinho.',
  },
  {
    titulo: 'Idade não é atraso. **É vantagem**.',
    corpo:
      'Tudo que você já viveu, lidar com gente, com prazo, com pressão, joga a favor numa transição. Começar mais velho não é chegar tarde. É chegar inteiro.',
  },
  {
    titulo: 'E quando o medo **não é do código**?',
    corpo:
      'Muita resposta era "será que é pra mim?", "medo de fracassar de novo". Isso é real. Ninguém precisa ser destemido pra começar. Só precisa não começar sozinho.',
  },
  {
    titulo: 'Foi por isso que criei a **Semana do Zero ao Programador Contratado**',
    corpo:
      '10 a 16/08, 20h, online e de graça. A gente constrói um projeto real ao vivo (do zero ao deploy) + uma aula só com o mapa passo a passo até a 1ª vaga. Com comunidade e monitores do seu lado.',
  },
  {
    titulo: 'Comenta **CAMINHO** 👇',
    corpo:
      'Eu te chamo na DM pra completar a inscrição gratuita. O caminho pra destravar começa nesse comentário.',
    img: '/capa-final.png',
  },
];

const gancho = 'Tem medo de estudar programação por meses e não conseguir emprego?';

const legenda =
  'Eu perguntei pra vocês, nas caixinhas, o que mais trava na programação, e o que mais assusta quando ' +
  'pensam em virar dev. As respostas foram tão parecidas que dava pra ver: ninguém tá sozinho nisso. Esse ' +
  'carrossel é isso: as suas próprias palavras, com uma virada honesta pra cada trava. Nada de "acredita em ' +
  'você", resposta de verdade. Se você se viu em alguma delas, comenta CAMINHO que eu te chamo na DM pra ' +
  'entrar de graça na Semana do Zero ao Programador Contratado (10 a 16/08, 20h, online). Salva pra reler ' +
  'quando bater a dúvida e marca alguém que precisa ver isso. 💜';

const hashtags =
  'programação aprenderaprogramar transiçãodecarreira primeiroempregodev devemdobro programadoriniciante carreiratech';

const ctaFinal =
  'Comenta CAMINHO que eu te chamo na DM pra entrar de graça na Semana do Zero ao Programador Contratado (10 a 16/08, 20h, online).';

const capaBrief =
  'Fundo escuro no roxo da Dev em Dobro. No centro, a frase real entre aspas em tipografia grande e crua, ' +
  'imitando o print de uma caixinha de pergunta do Instagram (sticker translúcido de "pergunta"). Nada de ' +
  'foto de banco de imagem. O visual É a resposta real. Selo no canto: "respostas reais dos seguidores".';

/** Monta a `pauta` legível (texto AIDA) a partir dos slides. */
function montarPauta(): string {
  const linhas = [`Gancho: ${gancho}`];
  slides.forEach((s, i) => linhas.push(`Slide ${i + 1}: ${s.titulo}. ${s.corpo}`));
  linhas.push(`CTA: ${ctaFinal}`);
  return linhas.join('\n');
}

async function main(): Promise<void> {
  console.log('[carrossel] aplicando view v_conteudo_posts (colunas de conteúdo)...');
  await db.execute(sql.raw(VIEW_SQL));

  console.log('[carrossel] removendo versão anterior (idempotência)...');
  await db.delete(conteudoPosts).where(inArray(conteudoPosts.titulo, [TITULO_ANTIGO, TITULO]));

  console.log('[carrossel] inserindo o post programado para hoje...');
  const [row] = await db
    .insert(conteudoPosts)
    .values({
      titulo: TITULO,
      estado: 'pronto',
      plataforma: 'instagram',
      formato: 'carrossel',
      dataProgramada: new Date(2026, 6, 27, 9, 0, 0), // 27/07/2026 09:00 (local)
      gancho,
      pauta: montarPauta(),
      legenda,
      hashtags,
      ctaFinal,
      roteiro: { formato: 'carrossel', slides, capa_brief: capaBrief },
    })
    .returning({ id: conteudoPosts.id });

  console.log(`[carrossel] OK — post criado: ${row?.id}`);
}

main().catch((err) => {
  console.error('[carrossel] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
