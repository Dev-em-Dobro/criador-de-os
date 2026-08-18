/**
 * apps/dobro — carrossel "Treine entrevista tech com IA de graça".
 *
 * ⚠️ A REFERÊNCIA DO CARD NÃO É SOBRE ESTE TEMA (descoberto em 12/08/2026).
 * O card nasceu do reels do @hackswithnele (1.640 curtidas / 2.365 comentários),
 * e o pipeline deduziu "treinar entrevista" a partir da legenda ("Finding job in
 * 2026 on easy mode") mais as hashtags. Lendo o reels quadro a quadro, o texto na
 * tela diz outra coisa: "how to connect claude to linkedin", "you can now
 * connect", "and find jobs for you", "scrolling on job boards", "first open
 * claude". É um tutorial de conectar o Claude ao LinkedIn pra ele buscar vaga, e
 * a legenda traz #composiopartner, ou seja, é publicidade paga da Composio.
 * É o MESMO erro do carrossel do Graphify (ver memória gancho-do-reels-nao-e-a-legenda).
 *
 * O dono pediu o carrossel do TEMA DO CARD mesmo assim (12/08/2026), então este
 * post NÃO herda nada da referência: ele é construído do zero. O tema real da
 * referência (conectar a IA ao LinkedIn pra achar vaga) fica como card separado,
 * se a casa quiser.
 *
 * O QUE ESTE POST CORRIGE DO PRÓPRIO CARD: a previsão da IA registrada no
 * briefing dele já apontava dois furos, e os dois foram fechados aqui.
 *   1. "Falta nome próprio da ferramenta, o que deixa a promessa vaga."
 *      → resolvido pelo avesso: a ferramenta é o chat que a pessoa já tem, e o
 *        ativo é o PROMPT. Quem tem nome próprio é o Exponent Practice, no slide
 *        de treinar com gente.
 *   2. "O prompt completo está no direct, não no carrossel: a pessoa comenta em
 *      vez de salvar, e a taxa de salvamento cai."
 *      → o prompt está no slide 4, salvável. O presente entrega o que não cabe
 *        em slide (banco de perguntas, rubrica inteira, como treinar com gente).
 *
 * PRECISÃO (Article IV) — o que foi conferido em 12/08/2026:
 *   · Exponent Practice: pramp.com responde 200 e a própria página diz "As of
 *     July 2024, all new Pramp sessions are hosted on Exponent Practice" e
 *     "Exponent Practice aims to provide the complete tech interview practice you
 *     need, for free". A prática é COM OUTRA PESSOA (peer to peer), por vídeo,
 *     30 a 45 minutos, com feedback dos dois lados. Não é IA, e o slide diz isso.
 *   · O que ficou de FORA por não ter fonte: modo de voz no plano grátis (a
 *     página de preços da OpenAI responde 403 e a do Gemini Live não declara
 *     disponibilidade por plano) e o Google Interview Warmup (a URL antiga
 *     redireciona pra um artigo de dicas que não cita a ferramenta). NÃO
 *     acrescente nenhum dos dois sem conferir de novo.
 *   · O prompt e a rubrica de notas são NOSSOS, escritos pra este post. Não são
 *     atribuídos a ninguém e não prometem resultado de contratação.
 *
 * SEM TRAVESSÃO em nenhum texto de conteúdo.
 */
import type { Carrossel } from '../types';

const SHOT = 'server/carrossel/assets/treinar-entrevista';

export const treinarEntrevista: Carrossel = {
  slug: 'treinar-entrevista',
  // Mesmo título do card que já estava no board (o render casa por título).
  titulo: 'Treine entrevista tech com IA de graça',
  gancho: 'Dá pra treinar a entrevista tech com IA de graça, e o segredo é pedir nota, não conselho.',
  dataProgramada: '2026-08-15',
  refsLinks:
    'https://www.instagram.com/reel/DbNHlazt6Bf/ (card veio daqui, mas o reels é sobre CONECTAR O CLAUDE AO LINKEDIN pra achar vaga, e é publi da Composio: o tema do card foi deduzido errado da legenda)\n' +
    'https://www.pramp.com/ (fonte primária do Exponent Practice, lida em 12/08/2026)',
  /**
   * Presente do "comenta ENTREVISTA" (Notion, 12/08/2026): o prompt pronto com
   * as cinco regras, a régua de nota em tabela (o que derruba e o que levanta
   * cada critério), o banco de perguntas de vaga júnior separado por tipo, o
   * método das três voltas e o Exponent Practice pra treinar com gente.
   *
   * LINK PRIVADO: trocar pelo `.notion.site` depois de Compartilhar > Publicar.
   */
  linkPresente: 'https://app.notion.com/p/3ba6dd01fb4881bd99a1dc460b539c8d',
  /**
   * Capa (arte do dono, 12/08/2026): o polvo da casa de terno e gravata do outro
   * lado da mesa, prancheta e caneta na mão, gesticulando a pergunta. O
   * enquadramento é o da CADEIRA DO CANDIDATO, que é o lugar onde o post coloca
   * quem lê. Já vem em 4:5 (1122×1402) e a mesa termina em ~55% da altura, então
   * o texto cai em preto chapado e `scrim: 'bloco'` basta.
   *
   * A arte da CONVERSA (a IA perguntando e devolvendo nota 8/5/3) continua viva
   * em `capa.png`, gerada por `node server/scripts/arte-treinar-entrevista.cjs`.
   * Ela foi a capa até esta troca e serve de alternativa: mostra o mecanismo, mas
   * pede leitura, e capa que pede leitura não para o dedo.
   */
  bgImage: `${SHOT}/capa-polvo.png`,
  slides: [
    {
      variant: 'photo',
      cover: true,
      scrim: 'bloco',
      baixo: true,
      // Em tela cheia o título passava por cima da mesa e da prancheta. Com a
      // arte em 84% da altura e encostada no topo, a mesa termina antes da faixa
      // de texto e o título cai em preto chapado. A largura que sobra fica preta
      // e não aparece: o fundo da arte é preto.
      bgSize: 'auto 84%',
      bgPos: 'center top',
      tituloMenor: true,
      tituloEscala: 1.1,
      // 3 linhas de 18, 17 e 15 caracteres: em 28,4px cabem ~22 por linha.
      titulo: 'Treine a entrevista\ntech com **IA**,\nde graça',
      // Escolha do dono, 12/08/2026. Quebrado em 25 e 19 caracteres: no
      // subtítulo da capa (17px) cabem ~37 por linha.
      subtitulo: 'Um prompt que te dá nota,\nnão conselho furado',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      eyebrow: 'Por que você trava',
      titulo: 'Você sabe o conteúdo\ne **erra na hora\nde falar**',
      corpo:
        'Estudar sozinho treina a resposta certa. A entrevista cobra outra coisa: **falar em voz alta, sob pressão, sem travar**.',
      terminal: [
        '✗ "me fala de você" e dá branco',
        '✗ conta o problema, esquece o resultado',
        '✗ some no meio da resposta técnica',
        '✗ ninguém te diz o que ficou ruim',
      ],
    },
    {
      variant: 'light',
      eyebrow: 'A virada',
      titulo: 'Peça **nota**,\nnão conselho',
      // "Na prática sai assim", e não "é o que a capa mostra": a capa passou a
      // ser o polvo entrevistador, e a frase antiga mandava o leitor voltar
      // procurar notas que não estão mais lá (revisor, 12/08/2026).
      corpo:
        'Pedir "como eu me saí?" rende elogio vazio. **Nota por critério** rende conserto: você vê qual parte da resposta está fraca e repete só ela.\n\nNa prática sai assim: clareza 8, profundidade 5, resultado 3.',
    },
    {
      variant: 'dark',
      eyebrow: 'Salva esse post pra fazer depois',
      titulo: 'O **prompt**',
      denso: true,
      terminal: [
        'Você é o entrevistador técnico desta vaga:',
        '[COLE A DESCRIÇÃO DA VAGA]',
        '',
        'Me entreviste como se fosse hoje, em',
        'português. Uma pergunta por vez, e espere',
        'a resposta. São 5 perguntas: 1 sobre mim,',
        '3 técnicas da vaga e 1 sobre um problema',
        'que resolvi.',
        '',
        'Depois de cada resposta, dê nota de 0 a 10',
        'em clareza, profundidade e resultado, diga',
        'a frase que ficou fraca e me devolva ela',
        'reescrita. Não passe pra próxima sem isso.',
        '',
        'Comece agora pela primeira pergunta.',
      ],
      // Corpo de UMA frase: com o prompt em 16 linhas, dois parágrafos aqui
      // empurram o rodapé pra fora do slide. O conserto do "cadê a nota?" foi
      // pro slide 5, que tem espaço.
      corpo: 'Cole a **vaga de verdade**, aquela que você quer. Genérico devolve pergunta genérica.',
    },
    {
      variant: 'light',
      eyebrow: 'O que muda no dia',
      titulo: 'Três voltas na\nmesma **pergunta**',
      itens: [
        { icone: 'loop', titulo: 'Responda de novo', sub: 'Mesma pergunta, agora com o que a nota apontou' },
        { icone: 'eye', titulo: 'Leia em voz alta', sub: 'Travar lendo é o mesmo travar da entrevista' },
        { icone: 'bookmark', titulo: 'Guarde a versão boa', sub: 'Vira o seu roteiro, não decoreba' },
      ],
      // A frase antiga ("ninguém vê a primeira numa entrevista de verdade") dizia
      // o contrário do que queria: na entrevista real o entrevistador vê
      // exatamente a primeira, e é essa a questão (revisor, 12/08/2026).
      corpo:
        'A primeira resposta é sempre a mais fraca. E **na entrevista de verdade você só tem uma**.\n\nSe o chat pular a nota no meio do caminho, responde **"cadê a nota?"** que ele volta.',
    },
    {
      variant: 'dark',
      eyebrow: 'Depois da IA',
      titulo: 'Treinar com **gente**\ntambém é de graça',
      // Os números vêm da página do produto ATUAL (tryexponent.com/practice):
      // cerca de 30 minutos pra cada um, uma hora no total. O "30 a 45 minutos"
      // que estava aqui é da página LEGADA do Pramp. E o grátis tem cota mensal
      // de créditos, além de exigir conta (revisor, 12/08/2026).
      corpo:
        'A IA não te interrompe nem faz cara feia. Quando a resposta já estiver de pé, marca uma rodada no **Exponent Practice** (o antigo Pramp).\n\nSão cerca de 30 minutos pra cada um, uma hora no total: **você entrevista e é entrevistado**, e os dois dão feedback.\n\nPrecisa criar conta, o site é em inglês, e o plano grátis dá uma **cota de sessões por mês**.',
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o kit completo\nda simulação?',
      botao: 'Comenta ENTREVISTA 👇',
      corpo:
        'Te mando o prompt pronto, o banco das perguntas que mais caem em vaga júnior e a régua de nota pra você se corrigir sozinho.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  legenda:
    'Comenta ENTREVISTA que eu te mando o kit da simulação. 🎯\n\n' +
    'Estudar sozinho treina a resposta certa. A entrevista cobra outra coisa: falar em voz alta, sob pressão, sem ' +
    'travar. É por isso que gente que sabe o conteúdo sai da sala achando que foi mal.\n\n' +
    'Dá pra treinar isso de graça no chat que você já usa, mas tem um detalhe que muda tudo: não peça conselho, ' +
    'peça NOTA.\n\n' +
    '"Como eu me saí?" devolve elogio vazio. Nota por critério (clareza, profundidade e resultado) devolve conserto: ' +
    'você enxerga qual parte da resposta está fraca e repete só aquela parte.\n\n' +
    'O prompt está no post, e o jeito de usar é este: cole a descrição da vaga que você quer de verdade, responda ' +
    'uma pergunta por vez e dê três voltas na mesma pergunta antes de passar pra próxima. A primeira resposta é ' +
    'sempre a mais fraca, e na entrevista de verdade você só tem uma.\n\n' +
    'Quando a resposta já estiver de pé, treina com gente. O Exponent Practice, que é o antigo Pramp, marca uma ' +
    'rodada por vídeo de cerca de 30 minutos pra cada um, uma hora no total, em que você entrevista alguém e é ' +
    'entrevistado, com feedback dos dois lados. Precisa criar conta, o site é em inglês, e o plano grátis dá uma ' +
    'cota de sessões por mês.\n\n' +
    'Comenta ENTREVISTA aqui embaixo que eu te mando o prompt pronto, o banco de perguntas de vaga júnior e a régua ' +
    'de nota. 👇',
  hashtags:
    'programacao carreiratech vagadev primeiroemprego devjunior entrevistadeemprego inteligenciaartificial estudarprogramacao devbr devemdobro',
  ctaFinal:
    'Comenta ENTREVISTA que eu te mando o prompt pronto, o banco das perguntas que mais caem em vaga júnior e a ' +
    'régua de nota pra você se corrigir sozinho.',
  briefing:
    '⚠️ ORIGEM DO CARD, LEIA ANTES DE MEXER: este carrossel NÃO vem da referência que está no campo Referências. O ' +
    'reels do @hackswithnele ensina a CONECTAR O CLAUDE AO LINKEDIN pra achar vaga (texto na tela: "how to connect ' +
    'claude to linkedin", "and find jobs for you"), e é publi paga da Composio (#composiopartner na legenda). O ' +
    'pipeline leu só a legenda ("Finding job in 2026 on easy mode") e deduziu "treinar entrevista". O dono pediu o ' +
    'tema do card mesmo assim, então este post foi construído do zero. O tema real do reels continua disponível pra ' +
    'virar outro card.\n\n' +
    'FÓRMULA: prompt copiável com slide salvável, que é a categoria que mais puxa salvamento na conta. O diferencial ' +
    'editorial é a régua de NOTA: quase todo post de "treine entrevista com IA" para em "peça feedback", que é o que ' +
    'não funciona. Pedir nota por critério é o que transforma conversa em treino.\n\n' +
    'OS DOIS FUROS DA PREVISÃO, FECHADOS: a previsão automática registrada no card em 05/08/2026 apontava (1) falta ' +
    'de nome próprio de ferramenta e (2) o prompt indo pro direct em vez do carrossel. O prompt agora está no slide ' +
    '4, e a ferramenta com nome próprio é o Exponent Practice, no slide 6. A aposta muda de comentário puro pra ' +
    'salvamento mais comentário.\n\n' +
    'O QUE FICOU DE FORA POR FALTA DE FONTE (não acrescente sem conferir): modo de voz no plano grátis do ChatGPT (a ' +
    'página de preços responde 403) e do Gemini Live (a página não declara disponibilidade por plano), e o Google ' +
    'Interview Warmup (a URL antiga redireciona pra um artigo de dicas que não cita mais a ferramenta). Treinar por ' +
    'voz seria o slide mais forte que este post não tem: se alguém confirmar em fonte oficial, ele entra.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): o polvo da casa de terno, do outro lado da mesa, com prancheta e caneta (arte do dono, ' +
    '12/08/2026). O enquadramento é o da cadeira do candidato, que é onde o post põe quem lê. A arte anterior era a ' +
    'conversa com as notas 8/5/3, guardada em capa.png.\n' +
    'Regra 2 (o slide 2 confirma): os quatro jeitos de travar, item a item.\n' +
    'Regra 3 (slide sozinho): a virada (nota, não conselho), o prompt, as três voltas, o treino com gente.\n' +
    'Regra 4 (salvável): o slide do prompt.\n' +
    'Regra 5 (CTA único): comenta ENTREVISTA.\n\n' +
    'PRESENTE: pronto (Notion, em linkPresente). Traz o prompt com as cinco regras, a régua de nota em tabela, o ' +
    'banco de perguntas de vaga júnior por tipo, o método das três voltas e o Exponent Practice.\n\n' +
    'REVISÃO DE FATO (12/08/2026, agente revisor-carrossel): voltou com três bloqueantes, dois aplicados aqui:\n' +
    '  1. o slide 3 dizia "é o que a capa mostra: clareza 8, profundidade 5, resultado 3", mas a capa tinha acabado ' +
    'de virar o polvo entrevistador, e as notas ficaram na arte antiga. Mandava o leitor voltar procurar o que não ' +
    'existe mais, no slide que carrega a tese. Virou "na prática sai assim".\n' +
    '  2. "30 a 45 minutos" é o número da página LEGADA do Pramp. O produto atual declara cerca de 30 minutos pra ' +
    'cada um, uma hora no total. Corrigido no slide 6 e na legenda.\n' +
    '  3. o linkPresente privado continua aberto, e depende de publicar no Notion.\n' +
    'O prompt também ganhou três linhas que faltavam: conduzir em português (vaga em inglês fazia o chat virar pro ' +
    'inglês), "comece agora pela primeira pergunta" (sem isso o chat costuma responder com um plano antes de ' +
    'perguntar) e o conserto "cadê a nota?" no corpo do slide.\n\n' +
    'RESSALVAS REGISTRADAS (não são fato apurado; se cobrarem nos comentários, a resposta honesta é esta):\n' +
    '  · o Exponent Practice é grátis COM COTA: "Free users are allotted credits to practice every month", e o ' +
    'ilimitado é pago. O feedback por IA e a transcrição também são só do plano pago. O que o slide promete (a ' +
    'rodada com o parceiro humano e o feedback dos dois lados) está na parte grátis.\n' +
    '  · os temas do Exponent são fechados (algoritmos, comportamental, system design, SQL, dados, front-end), não ' +
    'existe "a vaga que você colou". O slide vem logo depois do prompt e pode sugerir continuidade que não há.\n' +
    '  · a régua de nota é o comportamento PEDIDO ao chat, não garantido: nenhum dos três publica garantia de ' +
    'aderência a instrução estruturada ao longo de uma conversa longa. Por isso o slide 4 ensina o conserto.\n' +
    '  · "de graça" se sustenta (os três têm plano gratuito), mas nenhum publica número fixo e todos declaram teto ' +
    'por janela de tempo. Uma simulação de 5 perguntas com nota, mais a vaga colada, mais três voltas, é conversa ' +
    'longa e pode bater o limite no meio.\n' +
    '  · as afirmações sobre como entrevista funciona ("estudar sozinho treina a resposta certa", "a primeira ' +
    'resposta é sempre a mais fraca", os quatro erros do slide 2) são observação editorial da casa, não pesquisa.\n' +
    '  · "as perguntas que mais caem em vaga júnior" descreve uma seleção NOSSA, não um ranking medido.\n\n' +
    'PENDENTE ANTES DE PUBLICAR: a página do Notion está PRIVADA. Compartilhar > Publicar e trocar o link aqui e no ' +
    'campo do card pelo `.notion.site`.',
};
