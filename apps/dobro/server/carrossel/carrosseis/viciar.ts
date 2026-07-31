/**
 * apps/dobro — definição do carrossel "Como se viciar em programar" (adaptação do
 * NOSSO reels), no padrão "JARVIS" (novo design). Fonte única do conteúdo;
 * `carrossel:render viciar` gera a arte (PNG 1080×1350) + grava o card no board.
 *
 * Regras de copy (ver memória copy-carrossel-convencoes): SEM travessão; nunca
 * inventar nome de método/produto. Estrutura em AIDA, 8 slides.
 *
 * Brief (Ricardo): adaptar o reel mantendo o gancho que já foi bem. Tese: o que
 * mais vicia em programar é construir PROJETO legal (não decorar sintaxe / ver
 * aula). Fecha no MESMO CTA da campanha do GTA 6. ÚLTIMO slide = placeholder de
 * VÍDEO da tela do projeto do GTA scrollando + CTA "comenta GTA".
 */
import type { Carrossel } from '../types';

export const viciar: Carrossel = {
  slug: 'viciar',
  // Mesmo título do card placeholder no board — o render remove e recria (idempotente).
  titulo: 'Como se viciar em programar (carrossel do nosso reels)',
  gancho: 'Como eu me viciei em programar (e como você faz o mesmo)',
  dataProgramada: '2026-07-29T00:00:00.000Z',
  refsLinks: 'https://www.instagram.com/devemdobro/reel/DYfdos8p49S/\nhttps://dev-em-dobro.github.io/szpc-gta-6/',
  slides: [
    {
      variant: 'photo',
      cover: true,
      titulo: 'Como eu me\n**viciei** em programar',
      corpo: 'Passa pro lado: não foi disciplina, foi achar o gatilho certo.',
    },
    {
      variant: 'dark',
      eyebrow: 'A real',
      titulo: 'Ninguém se vicia\ndecorando **sintaxe**',
      corpo:
        'Começar por teoria solta e exercício sem sentido é o que faz a maioria achar que "não é pra mim" e largar.',
      calloutLabel: 'O que vira a chave:',
      callout:
        '"A primeira vez que algo que VOCÊ escreveu funciona na tela, dá um estalo. E o cérebro já quer o próximo."',
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'follow',
      titulo: 'Segue pra receber\nmais conteúdo',
      corpo: 'Sobre como criar os melhores projetos com IA e construir uma carreira sólida em tecnologia.',
    },
    {
      variant: 'purple',
      eyebrow: 'Por que vicia',
      titulo: 'O que prende\nde verdade',
      itens: [
        { icone: 'code', titulo: 'Resultado na hora', sub: 'Você escreve, roda e vê funcionando na mesma hora. Feedback imediato.' },
        { icone: 'globe', titulo: 'Projeto de verdade', sub: 'Algo no ar que dá orgulho de mostrar, não "olá mundo".' },
        { icone: 'ai', titulo: 'IA como alavanca', sub: 'Você constrói em horas e entende o porquê no caminho.' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Como começar',
      titulo: 'Como se viciar\nde propósito',
      steps: [
        { n: '01', titulo: 'Escolhe um projeto que te empolga', sub: 'Um clone de algo que você curte já serve' },
        { n: '02', titulo: 'Começa pequeno e roda', sub: 'Vê funcionando rápido, nem que esteja feio' },
        { n: '03', titulo: 'IA do seu lado', sub: 'Ela executa junto e você entende o porquê' },
        { n: '04', titulo: 'Termina e mostra', sub: 'Publica, manda pra alguém, parte pro próximo' },
      ],
    },
    {
      variant: 'dark',
      eyebrow: 'Um projeto que vicia',
      titulo: 'A gente clonou o\n**site desse jogo**',
      terminal: ['✓ do zero, em 2 horas', '✓ HTML, CSS, JS e IA no fluxo'],
      corpo: 'Hero animada, scroll de cinema. Um projeto que dá vontade de mostrar, e de já começar o próximo.',
    },
    {
      variant: 'light',
      eyebrow: 'A ideia',
      titulo: 'O jeito mais legal\nde se viciar é fazer\n**projeto legal**',
      corpo: 'E esse aqui está pronto pra você construir junto com a gente, do zero e ao vivo.',
    },
    {
      variant: 'photo',
      video: true,
      tipo: 'cta',
      logo: 'DEV EM DOBRO',
      titulo: 'Comenta **QUERO** e eu\nte ensino a fazer',
    },
  ],
  legenda:
    'Ninguém se vicia em programar decorando sintaxe. Vicia construindo coisa que dá orgulho de mostrar.\n\n' +
    'Comigo foi assim: o dia que um projeto MEU apareceu funcionando na tela, virou chave. Cada "tentei e deu ' +
    'certo" puxava o próximo. É dopamina, não força de vontade.\n\n' +
    'Com IA no fluxo, esse ciclo ficou mais rápido: você constrói projeto de verdade em horas e aprende no ' +
    'processo. Foi assim que a gente clonou o site desse jogo em 2 horas.\n\n' +
    'Quer construir ESSE projeto junto com a gente, do zero e ao vivo? Comenta QUERO e eu te ensino a fazer. 👇',
  hashtags:
    'programação aprenderaprogramar projetodev desenvolvimentoweb inteligenciaartificial devemdobro programadoriniciante htmlcssjs primeiroprojeto gta6',
  ctaFinal: 'Comenta QUERO e eu te ensino a construir o projeto do zero com IA.',
  briefing:
    'Adaptação do NOSSO reels "como se viciar em programar" no padrão JARVIS (novo design). Tese: o que mais ' +
    'vicia é construir PROJETO legal (não decorar sintaxe / ver aula). Fecha no CTA da campanha do GTA 6. ' +
    'ÚLTIMO slide = placeholder de VÍDEO (tela do projeto do GTA scrollando) + CTA comenta GTA. Sem imagem de ' +
    'fundo externa (capa em preto). Renderizado por carrossel:render viciar; arte em public/carrosseis/viciar/.',
};
