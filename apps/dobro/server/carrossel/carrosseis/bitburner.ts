/**
 * apps/dobro — carrossel do jogo "Bitburner" (aprender lógica escrevendo
 * JavaScript de verdade pra invadir servidor num RPG cyberpunk).
 *
 * MOLDE: elevator-saga (06/08/2026), nosso melhor post em SEGUIDORES (300) e o
 * segundo maior em comentários da história da conta (1.291, 28,2 por mil, 45.815
 * de alcance). Mesma espinha: promessa na capa, "é de graça e roda no navegador"
 * logo no slide 2, o slide salvável no meio, o aviso honesto antes do CTA.
 *
 * O GANCHO passou a ser o MESMO do elevator (pedido do dono, 17/08/2026), com
 * "de hacker" na frente: "Esse jogo de hacker ensina Lógica de Programação melhor
 * que muito curso pago". O anterior ("O jogo de hacker onde você programa pra
 * invadir") descrevia o jogo mas não prometia nada, e era a única peça que não
 * seguia o molde. A promessa comparativa é o que fez o elevator parar o dedo, e
 * "Lógica de Programação" por extenso é o que a pessoa busca. A legenda também
 * passou a abrir como a dele, pela dor, e não pelo pedido de comentário.
 *
 * A LACUNA (lição do JARVIS, 3.905 comentários): o ENDEREÇO do jogo não aparece
 * em slide nenhum. O post mostra o que é, prova que é fácil e ensina o caminho;
 * o link e o guia de lógica vivem no presente. O contra-exemplo é o "12 coisas
 * para instalar no Claude", que colocou os comandos no slide e fez 7,3
 * comentários por mil, a pior taxa entre os posts de ferramenta.
 *
 * FATOS CONFERIDOS NA FONTE PRIMÁRIA (15/08/2026):
 *   · Steam (store.steampowered.com/app/1812820): **Free To Play**, descrição
 *     oficial "Programming-based incremental game. Write scripts in JavaScript to
 *     automate gameplay, learn skills, play minigames, solve puzzles, and more in
 *     this cyberpunk text-based incremental RPG"; 7.342 análises no total, nota
 *     "Overwhelmingly Positive", 94% positivas entre as 5.957 em inglês;
 *     classificação **L** (livre) pela DEJUS; nenhuma compra dentro do jogo
 *     listada na página.
 *   · README oficial: joga de graça no navegador em bitburner-official.github.io
 *   · doc oficial (basic/scripts.md): "Scripts you write in Bitburner are real,
 *     working JavaScript"; cada script custa no mínimo 1.6 GB de RAM no jogo.
 *   · doc oficial, sobre pré-requisito, LITERAL: "It is highly recommended that
 *     you have a basic familiarity with programming concepts like for/while
 *     loops, conditionals like if/else, functions, arrays and variables before
 *     starting to write scripts, but you can start with basic skills and learn
 *     with practice." É recomendado, NÃO obrigatório, e é isso que o slide do
 *     aviso honesto diz.
 *   · existe um "Getting Started Guide for Beginner Programmers" oficial na doc.
 *   · o tutorial do jogo faz o jogador criar o script `n00dles.js` e rodar no
 *     servidor `n00dles`; o `NUKE.exe` já vem no computador inicial.
 *   · o script do slide salvável é o "early hack template" da doc oficial, com as
 *     três funções reais: ns.weaken(), ns.grow() e ns.hack().
 *   · repositório bitburner-official/bitburner-src, TypeScript, com push em
 *     12/08/2026. A licença NÃO é declarada em SPDX padrão (a API do GitHub
 *     devolve NOASSERTION), então o carrossel NÃO afirma licença nenhuma.
 *
 * POR QUE NÃO FOI O CODECOMBAT (registrado no briefing do card em 12/08/2026):
 * ele libera cinco fases e depois exige assinatura. Mandar o público pra um jogo
 * que trava em 20 minutos, na semana em que a gente vende, soa como isca.
 *
 * SEM TRAVESSÃO em nenhum texto de conteúdo.
 */
import type { Carrossel } from '../types';

export const bitburner: Carrossel = {
  slug: 'bitburner',
  titulo: 'Esse jogo de hacker ensina Lógica de Programação melhor que muito curso pago',
  gancho: 'Esse jogo de hacker ensina Lógica de Programação melhor que muito curso pago',
  dataProgramada: '2026-08-19',
  refsLinks:
    'https://bitburner-official.github.io/ (versão de navegador, grátis)\n' +
    'https://store.steampowered.com/app/1812820/Bitburner/ (Steam, Free To Play)\n' +
    'https://github.com/bitburner-official/bitburner-src (código e documentação oficial)\n' +
    'molde: nosso carrossel do elevator-saga, 06/08/2026 (1.291 comentários, 300 seguidores)',
  /**
   * Presente do "comenta HACKER" (Notion, 15/08/2026): é ele que carrega o
   * endereço do jogo e um GUIA DE LÓGICA nosso. Duas trocas em 17/08/2026, por
   * decisão do dono: saiu o script pronto (o jogo já ensina o primeiro no
   * tutorial) e saiu o guia oficial de iniciante do Bitburner, material dos
   * outros. O guia de lógica é o assunto do post e a ponte natural pro DevQuest.
   *
   * A página foi REFEITA em 17/08/2026 com o roteiro de estudo por etapas, na
   * linha do dono: praticar com projeto desde o começo em vez de empilhar
   * videoaula. Etapa 1 o mínimo (variável, condicional, laço, função, lista),
   * etapa 2 projetos que consomem API pública (ViaCEP/BrasilAPI, GitHub e
   * PokéAPI, as três conferidas respondendo 200 em 17/08), etapa 3 comércio
   * eletrônico com regra de negócio, etapa 4 sistema financeiro. O jogo entra
   * como aquecimento da etapa 1, não como destino.
   *
   * LINK PRIVADO: trocar pelo `.notion.site` depois de Compartilhar > Publicar.
   * JÁ FECHADO (visto em 20/08/2026): o link de matrícula está na página, tanto
   * no callout do topo quanto na seção do fim. Duas ressalvas anotadas e NÃO
   * mexidas, porque o post já foi publicado em 19/08: o utm_content é
   * `jogo-Bitburner-19-08`, que foge do padrão `<slug>-<dd-mm>` e tem maiúscula
   * (o relatório trata como linha separada), e o pedido de matrícula aparece
   * duas vezes na mesma página.
   */
  linkPresente: 'https://app.notion.com/p/3bd6dd01fb488128aa0dfea9842b712d',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      baixo: true,
      // Mesma promessa da capa do elevator-saga, com "de hacker" na frente: é a
      // fantasia que faz parar o dedo, e "Lógica de Programação" é o que a pessoa
      // busca. `tituloMenor` porque são 4 linhas longas (a 36.8px cabem ~15
      // caracteres por linha; a 25.8px, ~21, que é o que estas linhas pedem).
      tituloMenor: true,
      titulo: 'Esse jogo de hacker\nensina **Lógica de\nProgramação** melhor\nque muito curso pago',
      // Sem subtítulo, como a capa do elevator-saga (decisão do dono, 17/08/2026):
      // a promessa comparativa já se sustenta sozinha, e a linha de tensão que
      // estava aqui ("O script é seu. O servidor derrubado também.") disputava
      // atenção com ela em vez de somar.
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'light',
      layout: 'center',
      eyebrow: 'A promessa é real',
      titulo: 'É de graça e roda\n**no navegador**',
      corpo:
        'Chama **Bitburner**. É um RPG cyberpunk em que você invade servidor escrevendo **JavaScript de verdade**. Sem instalar nada, e na Steam é Free To Play.',
      // A arte oficial do jogo no lugar do ícone genérico de código: o slide
      // apresenta o Bitburner pelo nome, e a marca fecha a apresentação melhor
      // que um símbolo qualquer (mesma decisão do slide do n8n).
      selo: 'server/carrossel/assets/bitburner/banner.png',
    },
    {
      variant: 'dark',
      topIcon: 'skull',
      eyebrow: 'A real',
      // Reescrito a pedido do dono (17/08/2026): a versão anterior dizia que a
      // lógica "não gruda em exercício de papel", uma constatação morna. O ponto
      // é mais duro e é o que ele fala: estudar lógica só na teoria é o caminho
      // pra não virar programador.
      titulo: 'Só teoria é receita\npra **não virar dev**',
      corpo:
        'Videoaula assistida, lista respondida, resumo bonito no caderno. E na hora de escrever o primeiro programa de verdade, **trava tudo**.\n\n' +
        'Lógica não se decora, se pratica.',
      // O callout vem DEPOIS do corpo: aqui ele é a virada, e virada antes do
      // problema não vira nada. Sem isso o slide lia título → solução → problema.
      calloutDepois: true,
      calloutLabel: 'A virada:',
      callout: '"E se o exercício fosse invadir um servidor, e o seu código rodasse de verdade?"',
    },
    {
      variant: 'light',
      eyebrow: 'Como o jogo funciona',
      titulo: 'O que você faz\nlá dentro',
      // Substitui o slide do script inteiro (o dono tirou o script do presente, e
      // com ele o slide do "early hack template"). Aqui o objetivo é outro: em
      // quatro passos curtos, quem nunca abriu o jogo entende o que vai fazer.
      // Fatos do tutorial oficial: o NUKE.exe já vem no computador inicial e o
      // primeiro alvo do tutorial é o servidor n00dles.
      // Sub de UMA linha em cada passo (cabem ~45 caracteres): com quatro passos,
      // sub de duas linhas empurra o bloco e desalinha a leitura.
      steps: [
        { n: '01', titulo: 'Você começa num terminal', sub: 'Um computador simples e o mundo pra invadir' },
        { n: '02', titulo: 'Escolhe um servidor fraco', sub: 'O tutorial começa pelo n00dles, o mais fraco' },
        { n: '03', titulo: 'Abre a porta com o NUKE', sub: 'O programa já vem na sua máquina' },
        { n: '04', titulo: 'Escreve o script que ataca', sub: 'Ele repete o ataque e o dinheiro entra' },
      ],
    },
    {
      variant: 'dark',
      eyebrow: 'Por dentro',
      titulo: 'Terminal, editor\ne **facções**',
      corpo:
        'Tudo num painel só: você digita comando no terminal, escreve o script no editor do jogo e acompanha na aba de scripts ativos. Depois entram as **facções**, que dão contrato, reputação e programa novo.',
      // Print da interface real do jogo (enviado pelo dono, 17/08/2026). Mostrar
      // a tela é o que separa "descrevi uma ferramenta" de "vi a ferramenta":
      // ver memória capas-carrossel-padrao.
      imagem: 'server/carrossel/assets/bitburner/interface.png',
    },
    {
      variant: 'dark',
      eyebrow: 'Um aviso honesto',
      titulo: 'Ele não te ensina\ndo **zero absoluto**',
      corpo:
        'A própria documentação recomenda chegar sabendo o básico de laço, condicional e função, e diz na sequência que **dá pra começar com o básico e aprender na prática**.\n\n' +
        'Traduzindo: se você já viu um `if` e um `while` na vida, o jogo te leva longe. Se nunca viu, ele vira parede.',
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      // A promessa mudou duas vezes em 17/08/2026, por decisão do dono: saiu o
      // script pronto (o jogo já ensina o primeiro no tutorial) e saiu o guia
      // oficial de iniciante do Bitburner, que era material dos outros. Entra um
      // guia NOSSO de como ficar afiado em lógica, que é o assunto do post e a
      // ponte natural pro DevQuest.
      titulo: 'Quer o jogo e o\nguia de **lógica**?',
      botao: 'Comenta HACKER 👇',
      corpo:
        'Te mando o link do jogo e um guia pra você ficar afiado em lógica de programação.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  legenda:
    // Abre como a do elevator-saga (o post que foi bem), não com o CTA: a 1ª
    // frase é curta de propósito (a linha de follow come ~56 caracteres do
    // preview, e o que passa disso o "mais" corta) e já entrega a palavra que a
    // pessoa busca, "lógica de programação". O pedido de comentário fica no fim,
    // uma vez só. Ver memória descricao-insta-linha-follow.
    'Estudar lógica só na teoria é receita pra não virar dev.\n\n' +
    'Videoaula assistida, lista respondida, resumo bonito no caderno. E na hora de escrever o primeiro programa de verdade, trava tudo. Lógica não se decora, se pratica.\n\n' +
    'O Bitburner resolve isso de um jeito que parece jogo e é aula. É um RPG cyberpunk em que você invade servidores, e a forma de invadir é escrevendo JavaScript de verdade. A documentação oficial diz com todas as letras: os scripts que você escreve são "real, working JavaScript".\n\n' +
    'Roda no navegador, de graça, sem instalar nada. Na Steam ele é Free To Play, tem 7.342 análises com nota Overwhelmingly Positive e classificação livre.\n\n' +
    'Funciona assim: você começa num terminal com um computador simples, escolhe um servidor fraco pra invadir (o tutorial começa pelo n00dles), abre a porta com o NUKE que já vem na sua máquina e escreve o script que faz o ataque sozinho.\n\n' +
    'O primeiro script que o jogo ensina é um laço com três funções: uma pra derrubar a segurança do servidor, uma pra engordar o dinheiro dele e uma pra roubar. Quem entende esse pedacinho entendeu condicional, repetição e função, que é a base de qualquer linguagem.\n\n' +
    'E aí acontece a melhor parte: você roda o script, fecha o jogo, e ele continua trabalhando por você.\n\n' +
    'O aviso honesto: a própria documentação recomenda chegar sabendo o básico de laço, condicional e função, e diz que dá pra começar com o básico e aprender na prática. Se você já viu um if e um while na vida, o jogo te leva longe. Se nunca viu, ele vira parede.\n\n' +
    'Comenta HACKER aqui embaixo que eu te mando o link do jogo e um guia pra ficar afiado em lógica de programação. 👇',
  hashtags:
    'javascript logicadeprogramacao programacao hacker bitburner jogoprogramacao devemdobro aprenderprogramar carreiratech devbr',
  ctaFinal:
    'Comenta HACKER que eu te mando o link do jogo e um guia pra ficar afiado em lógica de programação.',
  briefing:
    'MOLDE: elevator-saga (06/08/2026), nosso melhor post em seguidores (300) e o segundo maior em comentários da ' +
    'conta (1.291, 28,2 por mil, 45.815 de alcance). A espinha é a mesma, e a única diferença estrutural é ' +
    'deliberada: o ENDEREÇO do jogo não aparece em slide nenhum.\n\n' +
    'POR QUE O ENDEREÇO SAIU DOS SLIDES: o JARVIS (maior post da conta, 3.905 comentários) ensina o caminho inteiro ' +
    'e esconde só o endereço. O "12 coisas para instalar no Claude" fez o contrário, colocou os comandos prontos num ' +
    'slide, e teve a pior taxa de comentário entre os posts de ferramenta (7,3 por mil) apesar dos 20.511 de ' +
    'alcance. Se numa próxima passada alguém colocar bitburner-official.github.io num slide, o CTA perde a razão de ' +
    'existir.\n\n' +
    'FATOS CONFERIDOS NA FONTE PRIMÁRIA (15/08/2026): Free To Play na Steam, sem compra dentro do jogo listada; ' +
    '7.342 análises com nota Overwhelmingly Positive e 94% positivas entre as 5.957 em inglês; classificação L pela ' +
    'DEJUS; roda de graça no navegador em bitburner-official.github.io; a doc diz que os scripts são "real, working ' +
    'JavaScript"; o script do slide salvável é o "early hack template" oficial, com ns.weaken(), ns.grow() e ' +
    'ns.hack(); existe um guia oficial "Getting Started Guide for Beginner Programmers".\n\n' +
    'O QUE O CARROSSEL NÃO AFIRMA, DE PROPÓSITO: licença do código. O repositório não declara licença em SPDX ' +
    'padrão (a API do GitHub devolve NOASSERTION), então nenhum slide fala em MIT ou open source.\n\n' +
    'POR QUE NÃO FOI O CODECOMBAT: libera cinco fases e depois exige assinatura. Na semana em que a gente vende, ' +
    'mandar o público pra um jogo que trava em 20 minutos soa como isca.\n\n' +
    'A RESSALVA VIRA PONTE (combinado com o dono em 12/08/2026): o Bitburner pede uma base mínima, como o ' +
    'elevator-saga pedia. Como o DevQuest atende quem está no zero absoluto, isso deixa de ser problema e vira o ' +
    'convite do presente: travou porque falta base, é isso que a gente resolve.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): jogo de hacker é fantasia pronta, e "programa pra invadir" diz o que se faz.\n' +
    'Regra 2 (o slide 2 confirma): de graça e no navegador, logo de cara.\n' +
    'Regra 3 (slide sozinho): a virada, o porquê, o script, o passo a passo, o aviso.\n' +
    'Regra 4 (salvável): o slide do primeiro script.\n' +
    'Regra 5 (CTA único): comenta HACKER.\n\n' +
    'SEMANA DE CARRINHO DO DEVQUEST (17 a 21/08): o carrossel não vende. A matrícula aparece só na página do ' +
    'presente, sem o GIF do GTA 6 (decisão do dono, 15/08/2026).\n\n' +
    'O link de inscrição do DevQuest já está no presente (conferido em 20/08). Publicado em 19/08 com a capa no ' +
    'gradiente de fallback.',
};
