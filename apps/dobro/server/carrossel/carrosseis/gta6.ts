/**
 * apps/dobro — definição do carrossel "Clone do site do GTA 6 em 2 horas".
 * Única fonte de verdade do conteúdo; `carrossel:render gta6` gera a arte + card.
 * SEM travessão. Estrutura copiando a referência (JARVIS), 8 slides, AIDA.
 */
import type { Carrossel } from '../types';

export const gta6: Carrossel = {
  slug: 'gta6',
  titulo: 'Clone do site do GTA 6 em 2 horas',
  gancho: 'Clone do site do GTA 6 em 2 horas',
  bgImage: 'server/carrossel/assets/gta6-bg.jpg',
  dataProgramada: '2026-07-29T00:00:00.000Z',
  refsLinks: 'https://dev-em-dobro.github.io/szpc-gta-6/',
  slides: [
    {
      variant: 'photo',
      cover: true,
      titulo: 'Clone do site do\nGTA 6 em **2 horas**',
      corpo: 'Passa pro lado que eu te mostro como fazer o seu de graça',
    },
    {
      variant: 'dark',
      topbleed: true,
      eyebrow: 'A ideia',
      titulo: 'A gente recriou o\nsite do GTA 6',
      corpo:
        'O site de divulgação do jogo ficou muito interessante, então montamos a nossa versão do zero pra te ensinar o passo a passo.',
      calloutLabel: 'O melhor:',
      callout:
        '"Dá pra fazer mesmo sem saber programar, em cerca de 2 horas usando IA. O que antes levaria semanas ou meses pra um dev iniciante."',
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'bookmark',
      titulo: 'Salva esse post\npra fazer depois',
      corpo: 'O passo a passo completo vem nos próximos slides. Toca no ícone de salvar aqui embaixo pra não perder.',
    },
    {
      variant: 'purple',
      eyebrow: 'Na prática',
      titulo: 'O que dá pra fazer',
      itens: [
        { icone: 'video', titulo: 'Hero em vídeo', sub: 'Fundo animado em loop, gerado de graça no Meta AI' },
        { icone: 'mouse', titulo: 'Scroll cinematográfico', sub: 'A cena se monta conforme você desce, com GSAP' },
        { icone: 'code', titulo: 'Só HTML, CSS e JS', sub: 'Nada de framework, IA no fluxo do editor' },
        { icone: 'globe', titulo: 'Um site de verdade', sub: 'Pronto pra você mostrar no portfólio' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Pré-requisitos',
      titulo: 'O que você\nprecisa antes',
      itens: [
        { icone: 'laptop', titulo: 'VS Code ou Cursor', sub: 'O editor onde você monta o projeto' },
        { icone: 'ai', titulo: 'Uma IA no editor', sub: 'Cursor ou Claude pra codar junto com você' },
        { icone: 'film', titulo: 'Conta no Meta AI', sub: 'Pra gerar o vídeo da hero, no plano free' },
      ],
      corpo: 'Só isso. Tudo de graça, só ferramenta gratuita.',
    },
    {
      variant: 'dark',
      topbleed: true,
      eyebrow: 'Como a gente fez',
      titulo: 'Passo a passo',
      steps: [
        { n: '01', titulo: 'Monta a hero', sub: 'HTML e CSS pra ocupar a tela inteira' },
        { n: '02', titulo: 'Gera o vídeo', sub: 'Descreve a cena no Meta AI e baixa o loop' },
        { n: '03', titulo: 'Anima o scroll', sub: 'GSAP ScrollTrigger em cada elemento' },
        { n: '04', titulo: 'Refina com IA', sub: 'Colou o erro no Cursor, ele conserta' },
        { n: '05', titulo: 'Deixa redondo', sub: 'Ajusta os detalhes e tá pronto' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'O resultado',
      titulo: 'Ficou pronto em\n~2 horas',
      terminal: ['✓ site com cara de estúdio', '✓ do zero, sem decorar código'],
      corpo: 'Feito ao vivo com IA, sem framework e sem anos de experiência.',
    },
    {
      variant: 'photo',
      video: true,
      tipo: 'cta',
      logo: 'DEV EM DOBRO',
      titulo: 'Comenta **GTA** e te ensino a fazer do zero',
    },
  ],
  legenda:
    'A gente clonou o site do GTA 6. Em 2 horas, do zero, com HTML, CSS e JS e IA no fluxo.\n\n' +
    'O site de divulgação do jogo ficou muito bom, então resolvemos montar a nossa versão pra te ensinar. E o melhor: dá ' +
    'pra fazer mesmo sem saber programar, em umas 2 horas usando IA. O que antes levaria semanas ou meses pra um dev iniciante.\n\n' +
    'O vídeo do fundo saiu de graça no Meta AI, o scroll no GSAP, e o refino foi com IA no editor.\n\n' +
    'Comenta GTA e te ensino a fazer do zero. 👇',
  hashtags:
    'programação desenvolvimentoweb htmlcssjs gsap metaai inteligenciaartificial devemdobro projetodev frontend aprenderprogramar gta6',
  ctaFinal: 'Comenta GTA e te ensino a fazer do zero.',
  briefing:
    'Padrão JARVIS copiando a referência. Slide 2: sem "Rockstar caprichou/virou referência" (não inventar); ideia = ' +
    'recriamos o nosso e ensinamos, dá pra fazer sem saber programar em ~2h com IA. Slide 7 (resultado): sem link do ' +
    'GitHub e sem mandar abrir/publicar. Último slide: placeholder do vídeo em loop do projeto (Jaque encaixa) + CTA. ' +
    'Renderizado por carrossel:render; arte em public/carrosseis/gta6/.',
};
