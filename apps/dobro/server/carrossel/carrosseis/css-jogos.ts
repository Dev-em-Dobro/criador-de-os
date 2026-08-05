/**
 * apps/dobro — carrossel dos jogos grátis de CSS (Flexbox Froggy e Grid Garden).
 *
 * Encaixe no veredito: "jogo grátis que ensina" (categoria do Oh My Git e do
 * LightBot, ambos campeões reais) somado a "conceito que trava iniciante", que é
 * a segunda estrutura mais consistente da conta. Layout em CSS é a dor clássica.
 *
 * Precisão (Article IV, conferido em flexboxfroggy.com em 05/08/2026): o Flexbox
 * Froggy é feito pela Codepip, roda no navegador e é gratuito; o site indica o
 * jogo irmão Grid Garden (CSS Grid) e outros títulos da mesma casa, como
 * Anchoreum. NÃO afirmamos número de níveis nem lista de propriedades cobertas,
 * que não foram verificadas. As propriedades citadas nos slides são as que o
 * próprio nome do jogo trata (flex e grid) descritas de forma genérica.
 * SEM travessão.
 */
import type { Carrossel } from '../types';

export const cssJogos: Carrossel = {
  slug: 'css-jogos',
  titulo: 'Os 2 jogos grátis que resolvem seu problema com CSS',
  gancho: 'Você não tem dificuldade com CSS. Você nunca viu o que cada propriedade faz. Esses 2 jogos grátis resolvem.',
  refsLinks: 'https://flexboxfroggy.com/ · https://cssgridgarden.com/',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      titulo: 'Você não tem\ndificuldade com\nCSS. Você nunca\nviu o que cada\npropriedade **faz**.',
      corpo: 'Passa pro lado: 2 jogos grátis resolvem isso 👉',
    },
    {
      variant: 'dark',
      eyebrow: 'Os dois jogos',
      titulo: 'Flexbox Froggy\ne **Grid Garden**',
      steps: [
        { n: '01', titulo: 'Rodam no navegador', sub: 'Abre o site e joga, sem instalar e sem cadastro' },
        { n: '02', titulo: 'São de graça', sub: 'Os dois são gratuitos, feitos pela mesma casa' },
        { n: '03', titulo: 'Você escreve CSS real', sub: 'Cada fase é um desafio que só passa com a propriedade certa' },
        { n: '04', titulo: 'O resultado é visual', sub: 'O sapo pula ou a horta é regada quando você acerta' },
      ],
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'follow',
      eyebrow: 'Antes de continuar',
      titulo: 'Segue o\n**@devemdobro**',
      corpo: 'Toda semana eu mostro ferramenta grátis que destrava quem está aprendendo a programar. Segue pra não perder.',
    },
    {
      variant: 'dark',
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
      variant: 'purple',
      eyebrow: 'Por que funciona',
      titulo: 'CSS não se aprende\nlendo documentação',
      itens: [
        { icone: 'eye', titulo: 'Você vê o efeito na hora', sub: 'Muda uma palavra e o elemento anda na sua frente' },
        { icone: 'loop', titulo: 'Errar é de graça', sub: 'Tenta quantas vezes quiser, sem quebrar o layout de um projeto real' },
        { icone: 'map', titulo: 'Uma propriedade por vez', sub: 'Cada fase isola um conceito, em vez de jogar tudo junto' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'A ordem certa',
      titulo: 'Flexbox primeiro,\n**Grid depois**',
      corpo:
        'Flexbox resolve alinhamento em uma direção, que é a maior parte do seu dia. Grid resolve layout em duas direções, que é a estrutura da página. Aprender nessa ordem economiza confusão.',
    },
    {
      variant: 'dark',
      eyebrow: 'Pra que serve na prática',
      titulo: 'É o que você faz\ntodo dia como **dev web**',
      itens: [
        { icone: 'layers', titulo: 'Centralizar de verdade', sub: 'O clássico que todo mundo já resolveu no chute pelo menos uma vez' },
        { icone: 'laptop', titulo: 'Layout que não quebra no celular', sub: 'Entender o eixo é o que faz o responsivo parar de dar trabalho' },
        { icone: 'puzzle', titulo: 'Ler o CSS dos outros', sub: 'Você abre um projeto pronto e entende por que está daquele jeito' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Um aviso honesto',
      titulo: 'Jogo destrava,\nprojeto **fixa**',
      corpo:
        'Os dois juntos levam menos de uma tarde. Mas o conhecimento só cola quando você monta um layout seu no dia seguinte. Faz os jogos e já refaz a tela de um projeto seu usando o que aprendeu.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer os links e\na ordem certa?',
      botao: 'Comente CSS 👇',
      corpo: 'Comenta CSS que eu te mando os dois links e um resumo das propriedades que caem no seu dia a dia.',
    },
  ],
  legenda:
    'A maioria das pessoas não tem dificuldade com CSS. Elas nunca viram, de fato, o que cada propriedade faz. Aí ' +
    'troca justify por align no chute até funcionar, e no dia seguinte esquece.\n\n' +
    'Dois jogos gratuitos resolvem isso, e os dois rodam no navegador sem instalar nada:\n\n' +
    'Flexbox Froggy, pra alinhamento em uma direção. Você escreve CSS de verdade pra levar o sapo até a vitória ' +
    'régia, e vê o efeito de cada propriedade na hora.\n\n' +
    'Grid Garden, do mesmo pessoal, pra layout em duas direções. Mesma ideia, agora regando a horta.\n\n' +
    'A ordem importa: Flexbox primeiro, porque é o que você usa na maior parte do dia, e Grid depois, porque é a ' +
    'estrutura da página.\n\n' +
    'Um aviso honesto: os dois juntos levam menos de uma tarde, mas o conhecimento só cola quando você monta um ' +
    'layout seu no dia seguinte.\n\n' +
    'Comenta CSS aqui embaixo que eu te mando os dois links e um resumo das propriedades que caem no seu dia a dia. 👇',
  hashtags: 'css flexbox cssgrid devweb frontend programacao aprenderprogramar devemdobro carreiratech htmlecss',
  ctaFinal: 'Comenta CSS que eu te mando os dois links e um resumo das propriedades que caem no seu dia a dia.',
  briefing:
    'FÓRMULA: jogo grátis que ensina (categoria do Oh My Git e do LightBot, campeões reais) somada a conceito que ' +
    'trava iniciante (segunda estrutura mais consistente da conta).\n\n' +
    'FATOS CONFERIDOS em 05/08/2026 (flexboxfroggy.com)\n' +
    'Flexbox Froggy é da Codepip, roda no navegador, é gratuito, e o próprio site indica o irmão Grid Garden ' +
    '(CSS Grid) e outros títulos da mesma casa.\n' +
    'NÃO afirmamos número de níveis nem a lista completa de propriedades cobertas, que não foram verificadas.\n\n' +
    'PENDENTE: arte de capa. O ideal é um print do próprio jogo (o sapo na vitória régia), como foi feito no ' +
    'LightBot e no Oh My Git, que são as capas campeãs.',
};
