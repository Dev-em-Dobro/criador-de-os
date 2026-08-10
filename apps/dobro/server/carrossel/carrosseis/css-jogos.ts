/**
 * apps/dobro — carrossel dos jogos grátis de CSS (Flexbox Froggy e Grid Garden).
 *
 * Reescrito em 06/08/2026 no MOLDE DO ELEVATOR SAGA, a pedido do dono: mesmo
 * gancho de comparação ("ensina melhor que muito curso pago"), capa repetindo o
 * gancho por extenso, slide 2 confirmando a promessa, slide 3 na dor, um slide
 * salvável e CTA único. O gancho anterior ("Você não tem dificuldade com CSS...")
 * virou o callout do slide da dor, que é onde ele funciona melhor.
 *
 * Precisão (Article IV, conferido em flexboxfroggy.com em 05/08/2026): o Flexbox
 * Froggy é feito pela Codepip, roda no navegador e é gratuito; o site indica o
 * jogo irmão Grid Garden (CSS Grid). NÃO afirmamos número de níveis nem lista de
 * propriedades cobertas, que não foram verificadas. As propriedades citadas são
 * as que o próprio nome do jogo trata (flex e grid). SEM travessão.
 *
 * PENDENTE: arte de capa (o ideal é o sapo na vitória régia, como nas capas
 * campeãs do LightBot e do Oh My Git). Por ora a capa usa o gradiente JARVIS.
 */
import type { Carrossel } from '../types';

export const cssJogos: Carrossel = {
  slug: 'css-jogos',
  titulo: 'Esses 2 jogos ensinam CSS melhor que muito curso pago',
  gancho: 'Esses 2 jogos ensinam CSS melhor que muito curso pago',
  dataProgramada: '2026-08-08',
  /** Presente do "comenta CSS": os 2 links + cheatsheet de flex e grid (Notion, 06/08/2026). */
  linkPresente: 'https://app.notion.com/p/3b46dd01fb488105a5dbc780524e6a11',
  refsLinks: 'https://flexboxfroggy.com/ · https://cssgridgarden.com/',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      tituloMenor: true,
      // Título 20% maior que o `tituloMenor` padrão, a pedido do dono (07/08/2026).
      // Vale só para esta capa, então não mexe nas que já foram aprovadas.
      tituloEscala: 1.2,
      titulo: 'Esses 2 jogos\nensinam **CSS**\nmelhor que muito\ncurso pago',
    },
    {
      variant: 'light',
      eyebrow: 'A boa notícia',
      titulo: 'Flexbox e Grid só\nparecem **difíceis**',
      corpo:
        'Com um método bom, os dois viram simples: um conceito por vez, e você vendo o efeito na tela. É exatamente o que esses jogos fazem. No Flexbox Froggy são 24 fases, de graça e no navegador.',
      imagem: 'server/carrossel/assets/css-jogos/froggy.png',
      // A janelinha deste slide toca a jogada em vez de mostrar o print parado:
      // digitar `justify-content: flex-end` e o sapo andar é a coisa que o print
      // não consegue contar. Gerado por `server/scripts/capturar-jogada.ts`.
      videoArquivo: 'server/carrossel/assets/css-jogos/froggy-nivel1-slide.mp4',
    },
    {
      variant: 'dark',
      topIcon: 'loop',
      eyebrow: 'Você conhece essa',
      titulo: 'Troca justify por align\naté **dar certo**',
      corpo:
        'Você mexe numa propriedade, olha a tela, mexe na outra. Quando finalmente funciona, você não sabe por quê. No dia seguinte, começa tudo de novo.',
      calloutLabel: 'A real:',
      callout: '"Não é dificuldade com CSS. É nunca ter visto o que cada propriedade faz."',
    },
    {
      variant: 'purple',
      eyebrow: 'Por que funciona',
      titulo: 'CSS não se aprende\nlendo **documentação**',
      itens: [
        { icone: 'eye', titulo: 'Você vê o efeito na hora', sub: 'Muda uma palavra e o elemento anda na sua frente' },
        { icone: 'loop', titulo: 'Errar é de graça', sub: 'Tenta quantas vezes quiser, sem quebrar o layout de um projeto real' },
        { icone: 'map', titulo: 'Uma propriedade por vez', sub: 'Cada fase isola um conceito, em vez de jogar tudo junto' },
      ],
    },
    {
      variant: 'light',
      denso: true,
      eyebrow: 'Salva esse slide',
      titulo: 'A dúvida que os\ndois **matam**',
      terminal: [
        'justify-content → alinha no eixo principal',
        'align-items     → alinha no eixo cruzado',
        'flex-direction  → decide qual eixo é o principal',
        'grid-column     → onde o item começa e termina',
      ],
      corpo: 'Se você já trocou justify por align no chute pra ver qual funcionava, é exatamente isso que os jogos resolvem.',
    },
    {
      variant: 'dark',
      eyebrow: 'A ordem certa',
      titulo: 'Flexbox primeiro,\n**Grid depois**',
      corpo:
        'Flexbox é alinhamento em uma direção, o que você faz o dia inteiro. Depois vem o Grid Garden, 28 fases pra layout em duas direções, que é a estrutura da página.',
      imagem: 'server/carrossel/assets/css-jogos/grid.png',
    },
    {
      variant: 'light',
      eyebrow: 'Um aviso honesto',
      titulo: 'Jogo destrava,\nprojeto **fixa**',
      corpo:
        'Os dois juntos levam menos de uma tarde. Mas o conhecimento só cola quando você monta um layout seu depois. Se parar no jogo, em uma semana esqueceu.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: '',
      botao: 'Comente CSS 👇',
      corpo:
        'Que eu te mando os dois links e um resumo das propriedades que caem no seu dia a dia, mais o passo a passo pra entrar de graça na Semana do Zero ao Programador Contratado.',
    },
  ],
  legenda:
    // AIDA + SEO: 1ª frase curta (a linha de follow come ~56 caracteres do preview)
    // e "CSS" logo no começo, repetido ao longo do texto.
    'Ninguém aprende CSS lendo documentação.\n\n' +
    'Você troca justify-content por align-items no chute até a tela ficar certa, e no dia seguinte não lembra por ' +
    'quê. Dois jogos gratuitos resolvem isso, e os dois rodam no navegador sem instalar nada.\n\n' +
    'O Flexbox Froggy é alinhamento em uma direção: você escreve CSS de verdade pra levar o sapo até a vitória ' +
    'régia e vê o efeito de cada propriedade na hora. O Grid Garden, do mesmo pessoal, é layout em duas direções, ' +
    'agora regando a horta.\n\n' +
    'A ordem importa: Flexbox primeiro, porque é o que você usa na maior parte do dia, e Grid depois, porque é a ' +
    'estrutura da página.\n\n' +
    'Um aviso honesto: os dois juntos levam menos de uma tarde, mas o conhecimento só cola quando você monta um ' +
    'layout seu depois.\n\n' +
    'Comenta CSS aqui embaixo que eu te mando os dois links e um resumo das propriedades que caem no seu dia a ' +
    'dia. E se você quer montar um projeto de verdade do zero, mando junto o passo a passo pra entrar de graça na ' +
    'Semana do Zero ao Programador Contratado. 👇',
  hashtags: 'css flexbox cssgrid devweb frontend programacao aprenderprogramar devemdobro carreiratech htmlecss',
  ctaFinal:
    'Comenta CSS que eu te mando os dois links e um resumo das propriedades que caem no seu dia a dia, mais o ' +
    'passo a passo pra se inscrever de graça na Semana do Zero ao Programador Contratado.',
  briefing:
    'FÓRMULA: jogo grátis que ensina (categoria do Oh My Git e do LightBot, campeões reais) somada a conceito que ' +
    'trava iniciante (segunda estrutura mais consistente da conta).\n\n' +
    'FATOS CONFERIDOS em 05/08/2026 (flexboxfroggy.com)\n' +
    'Flexbox Froggy é da Codepip, roda no navegador, é gratuito, e o próprio site indica o irmão Grid Garden ' +
    '(CSS Grid).\n' +
    'NÚMERO DE FASES conferido em 06/08/2026 no print capturado dos próprios jogos: o Froggy mostra "Level 1 of ' +
    '24" e o Grid Garden "Level 1 of 28". Antes a gente não afirmava isso por falta de fonte; agora a fonte é a ' +
    'tela do jogo, que está no carrossel.\n' +
    'Segue valendo: NÃO afirmamos a lista completa de propriedades cobertas por cada jogo.\n\n' +
    'DECISÕES DA ARTE (06/08/2026, reescrita no molde do elevator-saga)\n' +
    'Título e gancho passaram a ser a comparação direta ("ensinam CSS melhor que muito curso pago"), igual ao ' +
    'carrossel do Elevator Saga. A capa repete o gancho por extenso, com título menor pra caber.\n' +
    'Saíram dois slides da versão anterior: o pedido de follow no meio (competia com a leitura, e a linha de ' +
    'follow já abre a descrição) e o "pra que serve na prática" (o slide 4 já sustenta o porquê). No lugar entrou ' +
    'o slide da DOR (troca justify por align até dar certo), onde o gancho antigo virou callout.\n' +
    'CTA no formato novo: sem frase antes, botão em cima e o texto embaixo continuando a frase dele.\n\n' +
    'PENDENTE: arte de capa. O ideal é um print do próprio jogo (o sapo na vitória régia), como no LightBot e no ' +
    'Oh My Git, que são as capas campeãs.',
};
