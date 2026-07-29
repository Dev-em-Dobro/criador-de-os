/**
 * apps/dobro — carrossel do jogo "Flexbox Adventure" (aprender CSS Flexbox jogando).
 * Recria o carrossel antigo (ref IG DYN1EvkiUVT) no padrão JARVIS novo.
 *
 * Precisão (Article IV): o jogo ensina CSS/Flexbox (front-end), não "lógica de
 * programação" — o gancho ficou em CSS pra não passar info errada. Fatos (da legenda
 * do post original + o jogo): Flexbox Adventure é um jogo gratuito, roda no navegador,
 * você escreve CSS real (justify-content, align-items, flex-direction...) desde o 1º
 * nível pra mover personagens pela tela. CTA original: "comenta FLEXBOX" → link + guia.
 * SEM travessão. Capa sem asset (fundo escuro).
 */
import type { Carrossel } from '../types';

export const flexboxAdventure: Carrossel = {
  slug: 'flexbox-adventure',
  titulo: 'Esse jogo ensina CSS melhor que curso pago',
  gancho: 'Esse jogo ensina CSS melhor que curso pago',
  dataProgramada: '2026-07-31T00:00:00.000Z',
  refsLinks: 'https://www.instagram.com/p/DYN1EvkiUVT/',
  slides: [
    {
      variant: 'photo',
      cover: true,
      titulo: 'Esse jogo\nensina **CSS**\nmelhor que\ncurso pago',
      corpo: 'E de graça. É o que te destrava no front-end de vez. Passa pro lado.',
    },
    {
      variant: 'dark',
      topIcon: 'code',
      eyebrow: 'A real',
      titulo: 'Flexbox trava\ntodo **iniciante**',
      corpo:
        'Flexbox é um dos conceitos que mais emperra quem aprende front-end. E não é porque é difícil: é porque quase ninguém pratica de um jeito que faça **sentido visual**.',
      calloutLabel: 'A virada:',
      callout: '"E se você aprendesse CSS movendo um personagem na tela, em vez de decorar propriedade?"',
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'code',
      titulo: 'Conheça o\n**Flexbox Adventure**',
      corpo: 'Um jogo gratuito que te coloca pra escrever CSS de verdade desde o primeiro nível.',
    },
    {
      variant: 'purple',
      eyebrow: 'Por que funciona',
      titulo: 'CSS na prática,\nnão na **decoreba**',
      itens: [
        { icone: 'eye', titulo: 'Você VÊ o efeito', sub: 'Cada propriedade move o personagem na tela na hora' },
        { icone: 'code', titulo: 'CSS de verdade', sub: 'Você escreve justify-content, align-items, flex-direction...' },
        { icone: 'map', titulo: 'Nível por nível', sub: 'Do básico ao avançado, um desafio de cada vez' },
        { icone: 'laptop', titulo: 'Direto no navegador', sub: 'Não precisa instalar nada, joga e aprende' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'O que você domina',
      titulo: 'As propriedades\nque **assustam**',
      terminal: ['justify-content: center', 'align-items: center', 'flex-direction: row', '✓ centralizou de primeira'],
      corpo: 'As mesmas que você usa em site de verdade, todo dia.',
    },
    {
      variant: 'dark',
      topbleed: true,
      eyebrow: 'Como começar',
      titulo: 'Começa agora,\nde graça',
      steps: [
        { n: '01', titulo: 'Abre o jogo', sub: 'É no navegador, sem instalar nada' },
        { n: '02', titulo: 'Move o personagem', sub: 'Escreve o CSS pra levar ele até o objetivo' },
        { n: '03', titulo: 'Sobe de nível', sub: 'Cada fase puxa uma propriedade nova' },
        { n: '04', titulo: 'Leva pro projeto', sub: 'Usa o que aprendeu num layout de verdade' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'A ideia',
      titulo: 'Aprende **fazendo**,\nnão decorando',
      corpo: 'Você não esquece o que viu funcionar na tela. Por isso um joguinho grátis destrava mais que muita aula cara.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: '@devemdobro',
      titulo: 'Comenta **FLEXBOX**\nque te mando o\nlink e o guia',
    },
  ],
  legenda:
    'Flexbox é um dos conceitos que mais trava quem está aprendendo front-end. E a maioria trava não porque ' +
    'é difícil, mas porque nunca praticou de um jeito que faça sentido visual.\n\n' +
    'O Flexbox Adventure é um jogo gratuito que te coloca pra escrever CSS real desde o primeiro nível, ' +
    'movendo personagens pela tela com justify-content, align-items, flex-direction e muito mais.\n\n' +
    'Comenta FLEXBOX aqui embaixo que eu te mando o link do jogo e um guia completo com as propriedades, ' +
    'exemplos de código e exercícios práticos. De graça. 👇',
  hashtags:
    'css flexbox frontend programação jogoprogramação devemdobro aprenderprogramar htmlcss desenvolvimentoweb carreiratech',
  ctaFinal: 'Comenta FLEXBOX que eu te mando o link do jogo e um guia completo, de graça.',
  briefing:
    'Recria o carrossel antigo do jogo (ref IG DYN1EvkiUVT) no padrão JARVIS. JOGO = Flexbox Adventure ' +
    '(ensina CSS/Flexbox, front-end, no navegador, grátis; escreve CSS real pra mover personagens). Usuário ' +
    'pediu gancho "lógica de programação", mas o jogo é CSS, então gancho ficou em CSS por precisão (trocar ' +
    'a palavra se ele confirmar). CTA original mantido: "comenta FLEXBOX" -> link + guia. Capa sem asset ' +
    '(fundo escuro). Render: carrossel:render flexbox-adventure.',
};
