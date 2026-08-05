/**
 * apps/dobro — carrossel do Excalidraw (desenhar arquitetura e fluxo de graça,
 * no navegador, funcionando offline).
 *
 * Encaixe no veredito: ferramenta grátis e open source, com uso imediato pra dev
 * web. Ângulo de conceito embutido: desenhar antes de codar é o hábito que separa
 * quem trava de quem entrega.
 *
 * Precisão (Article IV, conferido em github.com/excalidraw/excalidraw em
 * 05/08/2026): quadro branco virtual com traço de desenho à mão; licença MIT,
 * aberto e gratuito; roda em excalidraw.com; tem suporte PWA e funciona offline;
 * é local-first, salvando sozinho no navegador; tem colaboração em tempo real com
 * criptografia de ponta a ponta; exporta PNG, SVG, área de transferência e o
 * formato nativo .excalidraw (JSON); existe o pacote npm @excalidraw/excalidraw
 * pra embutir em aplicação React; existe um Excalidraw+ pago opcional.
 * SEM travessão.
 */
import type { Carrossel } from '../types';

export const excalidraw: Carrossel = {
  slug: 'excalidraw',
  titulo: 'Desenhe seu sistema antes de codar, de graça',
  gancho: 'Você trava no projeto porque começa pelo código. Quem entrega desenha antes, e essa ferramenta é de graça.',
  refsLinks: 'https://excalidraw.com · https://github.com/excalidraw/excalidraw',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      titulo: 'Você trava no projeto\nporque começa\npelo código.\nQuem entrega\ndesenha antes.\nE a ferramenta é **grátis**.',
      corpo: 'Passa pro lado que eu te mostro 👉',
    },
    {
      variant: 'dark',
      eyebrow: 'O que é',
      titulo: 'Chama **Excalidraw**,\ne é licença MIT',
      steps: [
        { n: '01', titulo: 'Abre e usa', sub: 'Roda no navegador, sem instalar e sem criar conta' },
        { n: '02', titulo: 'Traço de rascunho', sub: 'Parece desenhado à mão, então ninguém confunde com decisão final' },
        { n: '03', titulo: 'Funciona offline', sub: 'Instala como aplicativo e salva sozinho no seu navegador' },
        { n: '04', titulo: 'Dá pra desenhar junto', sub: 'Colaboração em tempo real com criptografia de ponta a ponta' },
      ],
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'follow',
      eyebrow: 'Antes de continuar',
      titulo: 'Segue o\n**@devemdobro**',
      corpo: 'Toda semana eu mostro ferramenta grátis que faz você entregar projeto de verdade. Segue pra não perder.',
    },
    {
      variant: 'dark',
      denso: true,
      eyebrow: 'Salva esse slide',
      titulo: 'O desenho que\n**destrava** qualquer projeto',
      terminal: [
        '1. As telas    → quais existem e o que fazem',
        '2. As setas    → como o usuário anda entre elas',
        '3. Os dados    → o que precisa ser salvo',
        '4. O que falta → onde você ainda não sabe',
      ],
      corpo: 'Quinze minutos desenhando isso economizam três dias reescrevendo código na direção errada.',
    },
    {
      variant: 'purple',
      eyebrow: 'Por que o traço torto ajuda',
      titulo: 'Rascunho convida\na mudar de ideia',
      itens: [
        { icone: 'eye', titulo: 'Ninguém trata como final', sub: 'Desenho bonito demais parece decidido, e aí ninguém questiona' },
        { icone: 'loop', titulo: 'Apagar não dói', sub: 'É rascunho, então você refaz sem sentir que perdeu trabalho' },
        { icone: 'follow', titulo: 'Todo mundo entende', sub: 'Você mostra pro cliente e ele opina antes de você programar' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'O que fazer com o desenho',
      titulo: 'Ele sai em **PNG,\nSVG** ou arquivo',
      corpo:
        'Exporta pro README do repositório, pra proposta do cliente ou pro seu portfólio. E dá pra salvar no formato nativo pra continuar editando depois, sem começar do zero.',
    },
    {
      variant: 'dark',
      eyebrow: 'Pra que serve na prática',
      titulo: 'Onde isso te faz\nparecer **sênior**',
      itens: [
        { icone: 'map', titulo: 'Explicar antes de codar', sub: 'Reunião em que você desenha na hora muda o jogo' },
        { icone: 'layers', titulo: 'Documentar o projeto', sub: 'Um diagrama no README vale mais que três parágrafos' },
        { icone: 'puzzle', titulo: 'Mostrar no portfólio', sub: 'Prova que você pensou o sistema, não só copiou um tutorial' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Um aviso honesto',
      titulo: 'Desenho não é\n**entrega**',
      corpo:
        'Dá pra passar a tarde inteira desenhando e não escrever uma linha. Estabelece o limite: desenhou o fluxo principal e o que falta, fecha a aba e vai codar.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o modelo\npronto pra copiar?',
      botao: 'Comente DESENHO 👇',
      corpo: 'Comenta DESENHO que eu te mando o link e um modelo de diagrama pra você preencher no seu projeto.',
    },
  ],
  legenda:
    'A pessoa abre o editor, cria o projeto e trava. Não é falta de conhecimento técnico: é que ela está tentando ' +
    'descobrir o sistema inteiro enquanto escreve a primeira linha.\n\n' +
    'Quem entrega desenha antes. E a ferramenta pra isso é gratuita: Excalidraw, licença MIT, roda no navegador sem ' +
    'instalar e sem criar conta.\n\n' +
    'O traço parece feito à mão de propósito, e isso importa: rascunho convida a mudar de ideia, enquanto desenho ' +
    'bonito demais parece decisão fechada e ninguém questiona.\n\n' +
    'O desenho que destrava qualquer projeto tem quatro partes: as telas que existem, as setas de como o usuário anda ' +
    'entre elas, os dados que precisam ser salvos em cada passo, e o que você ainda não sabe fazer. Quinze minutos ' +
    'nisso economizam dias na direção errada.\n\n' +
    'Depois exporta em PNG ou SVG pro README, pra proposta do cliente ou pro portfólio. Ele também funciona offline e ' +
    'permite desenhar junto com outra pessoa em tempo real.\n\n' +
    'Um aviso honesto: dá pra passar a tarde desenhando e não escrever nada. Desenhou o fluxo principal, fecha a aba ' +
    'e vai codar.\n\n' +
    'Comenta DESENHO aqui embaixo que eu te mando o link e um modelo de diagrama pra preencher no seu projeto. 👇',
  hashtags: 'excalidraw arquitetura devweb programacao portfolio opensource devemdobro carreiratech documentacao diagramas',
  ctaFinal: 'Comenta DESENHO que eu te mando o link e um modelo de diagrama pra você preencher no seu projeto.',
  briefing:
    'FÓRMULA: ferramenta grátis e open source, com conceito embutido (desenhar antes de codar é o hábito que separa ' +
    'quem trava de quem entrega).\n\n' +
    'FATOS CONFERIDOS em 05/08/2026 (github.com/excalidraw/excalidraw)\n' +
    'Quadro branco virtual com traço à mão. Licença MIT, gratuito. Roda em excalidraw.com. Suporte PWA e funciona ' +
    'offline. Local-first, salva sozinho no navegador. Colaboração em tempo real com criptografia de ponta a ponta. ' +
    'Exporta PNG, SVG, área de transferência e o formato nativo .excalidraw. Existe pacote npm pra embutir em React. ' +
    'Existe um Excalidraw+ pago opcional.\n\n' +
    'PENDENTE: arte de capa. O ideal é um print de um diagrama feito no próprio Excalidraw.',
};
