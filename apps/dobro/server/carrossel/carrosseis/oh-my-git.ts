/**
 * apps/dobro — carrossel "Esse jogo ensina Git melhor que curso pago" (Oh My Git).
 * Recria a ideia do carrossel antigo do jogo, no padrão JARVIS novo. Curiosidade/dica.
 *
 * Precisão (Article IV, nada inventado): Oh My Git ensina GIT (controle de versão),
 * não "lógica de programação" — o gancho foi ajustado pra "Git". Fatos: jogo grátis
 * e open source (ohmygit.org, por blinry e bleeptrack); mostra o repositório como
 * um grafo visual de cartas; você digita comandos REAIS do git; tem níveis guiados
 * (do básico ao rebase) + um sandbox livre; roda em Windows, Mac e Linux. SEM travessão.
 */
import type { Carrossel } from '../types';

export const ohMyGit: Carrossel = {
  slug: 'oh-my-git',
  titulo: 'Esse jogo ensina Git melhor que curso pago',
  gancho: 'Esse jogo ensina Git melhor que curso pago',
  dataProgramada: '2026-07-31T00:00:00.000Z',
  refsLinks: 'https://ohmygit.org/',
  slides: [
    {
      variant: 'photo',
      cover: true,
      titulo: 'Esse jogo\nensina **Git**\nmelhor que\ncurso pago',
      corpo: 'De graça, open source, e você aprende jogando. Passa pro lado.',
    },
    {
      variant: 'dark',
      topIcon: 'code',
      eyebrow: 'A real',
      titulo: 'Git trava\ntodo **iniciante**',
      corpo:
        'Todo dev precisa de Git já no primeiro dia de trabalho. Mas ele confunde a cabeça: branch, merge, rebase... e a maioria dos cursos só manda **decorar comando**.',
      calloutLabel: 'A virada:',
      callout: '"E se, em vez de decorar, você pudesse VER o que cada comando faz, brincando?"',
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'code',
      titulo: 'Conheça o\n**Oh My Git**',
      corpo: 'Um jogo gratuito e open source que transforma o seu repositório numa tela visual, que você enxerga e move com a mão.',
    },
    {
      variant: 'purple',
      eyebrow: 'Por que funciona',
      titulo: 'Não é decoreba,\né na **prática**',
      itens: [
        { icone: 'eye', titulo: 'Você VÊ o Git', sub: 'Cada commit e branch vira uma carta na tela, dá pra ver o que acontece' },
        { icone: 'code', titulo: 'Comandos de verdade', sub: 'Você digita os comandos reais do git, não botão de mentira' },
        { icone: 'map', titulo: 'Níveis guiados', sub: 'Puzzles que te levam do básico até o rebase, passo a passo' },
        { icone: 'laptop', titulo: 'Sandbox livre', sub: 'Um modo pra testar qualquer coisa sem medo de quebrar nada' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'O que você pratica',
      titulo: 'Os comandos\nque **assustam**',
      terminal: ['$ git branch', '$ git merge', '$ git rebase', '✓ agora fazendo sentido'],
      corpo: 'Você aprende vendo cada um acontecer na tela, não decorando a sintaxe.',
    },
    {
      variant: 'dark',
      topbleed: true,
      eyebrow: 'Como começar',
      titulo: 'É rápido de\ncomeçar',
      steps: [
        { n: '01', titulo: 'Baixa de graça', sub: 'No site ohmygit.org, roda em Windows, Mac e Linux' },
        { n: '02', titulo: 'Faz os níveis', sub: 'Os puzzles te levam do zero ao avançado' },
        { n: '03', titulo: 'Testa no sandbox', sub: 'Brinca com qualquer comando sem medo' },
        { n: '04', titulo: 'Leva pro projeto', sub: 'Usa o que aprendeu num projeto de verdade' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'A ideia',
      titulo: 'Aprender **fazendo**\nvence decorar',
      corpo: 'Você não esquece o que viu funcionar na sua frente. É por isso que um joguinho grátis ensina mais que muita apostila cara.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: '@devemdobro',
      titulo: 'Comenta **GIT** e eu\nte mando outros\njogos assim',
    },
  ],
  legenda:
    'Todo dev precisa de Git, mas quase todo curso ensina decorando comando. O Oh My Git faz o oposto.\n\n' +
    'É um jogo gratuito e open source que transforma o seu repositório numa tela visual: cada commit e cada ' +
    'branch vira uma carta que você vê e move. E você digita os comandos reais do git, não botão de mentira. ' +
    'Tem níveis guiados (do básico ao rebase) e um sandbox pra testar sem medo de quebrar nada.\n\n' +
    'É na prática que a ficha cai. Um joguinho grátis ensina mais Git que muita apostila cara.\n\n' +
    'Baixa em ohmygit.org. Comenta GIT que eu te mando outros jogos que ensinam código de graça. 👇',
  hashtags:
    'git versionamento programação ohmygit opensource jogosquensinam devemdobro aprenderprogramar carreiratech ferramentasdev',
  ctaFinal: 'Comenta GIT e eu te mando outros jogos que ensinam código de graça.',
  briefing:
    'Recria o carrossel antigo do jogo (Oh My Git) no padrão JARVIS novo. Oh My Git ensina GIT (não lógica ' +
    'de programação) — gancho ajustado pra "Git" por precisão. Fatos conferidos: grátis + open source ' +
    '(ohmygit.org, blinry/bleeptrack); repositório como grafo visual de cartas; comandos reais do git; ' +
    'níveis guiados + sandbox; Windows/Mac/Linux. Capa sem asset (fundo escuro). CTA thematico "comenta GIT" ' +
    '(trocar pra "GTA"/evento se for unificar com a campanha). Render: carrossel:render oh-my-git.',
};
