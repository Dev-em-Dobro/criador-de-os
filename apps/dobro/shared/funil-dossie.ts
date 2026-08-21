/**
 * apps/dobro — DOSSIÊ DO FUNIL: o cardápio de formatos, por etapa.
 *
 * POR QUE EXISTE (20/08/2026). O dono mandou a referência
 * https://www.instagram.com/reel/DbgUDEkBaK3/ com o pedido: "pro estrategista
 * saber quais formatos podemos explorar quando precisarmos de conteúdos de topo,
 * meio e fundo de funil". O raciocínio dele: o Estrategista sugere o cronograma,
 * e sem esta lista ele sugere só o que rende salvamento. A conta cresce e não
 * converte, porque ninguém preencheu o meio e o fundo.
 *
 * O QUE É: um CARDÁPIO, não uma régua. Diferente do `carrossel-dossie`, aqui
 * quase nada foi medido nesta conta ainda: é repertório de formatos para escolher
 * quando a etapa do funil é que está faltando. Quando algum destes formatos for
 * ao ar e for medido, o achado correspondente migra para o dossiê de carrossel ou
 * de reels, com número.
 *
 * ⚠️ DE ONDE VEIO CADA COISA, COM HONESTIDADE. O vídeo entrega a LISTA de
 * formatos com clareza (estão escritos na tela, um a um). A ETAPA de cada um,
 * não: ele joga cada formato numa faixa colorida do funil, e as miniaturas são
 * pequenas demais para se ler qual caiu onde. A transcrição da fala resolveria,
 * mas não roda nesta máquina (o ffmpeg que o auto-editor usa está sem o filtro
 * whisper compilado).
 *
 * Então cada item traz a confiança certa:
 *   · `indicio`   — a etapa apareceu escrita na legenda queimada logo depois do
 *                   nome do formato. É o que dá para ler do vídeo.
 *   · `hipotese`  — a etapa é LEITURA NOSSA, pela lógica do funil. Não é o que o
 *                   autor disse, é o que faz sentido. Confirmar com o dono.
 *
 * Nenhum item tem `regra`: isto NÃO entra no prompt do gerador enquanto as
 * atribuições forem hipótese. Mandar palpite para a IA como se fosse regra é
 * exatamente o erro que o resto deste sistema existe para evitar.
 */

import type { DossieSecao, Fonte } from './dossie-tipos.js';

export const FUNIL_DOSSIE: DossieSecao[] = [
  {
    id: 'como-usar',
    titulo: 'Para que serve este cardápio',
    icone: '🔻',
    resumo: 'Quando a pauta está definida mas falta decidir a EMBALAGEM, e quando o cronograma está torto para uma etapa só.',
    itens: [
      {
        titulo: 'A pergunta que este dossiê responde',
        texto:
          'Não é "sobre o que postar", é "com que formato". Você já sabe que precisa de uma peça de meio de funil nesta semana; aqui estão as embalagens que servem para isso. O tema vem do dossiê de carrossel e do banco; a embalagem vem daqui.',
        confianca: 'decisao',
      },
      {
        titulo: 'Por que o Estrategista precisa disto',
        texto:
          'Ele sugere o cronograma. Sem o cardápio por etapa, ele sugere sempre o que rende salvamento, que é topo e meio. A conta cresce e não converte, porque o fundo nunca é preenchido. Esta lista existe para o cronograma poder ser cobrado por etapa, não só por desempenho.',
        confianca: 'decisao',
      },
      {
        titulo: 'O que cada etapa está tentando fazer',
        texto:
          'TOPO alcança quem não te conhece: o critério é parar o dedo. MEIO aprofunda com quem já te viu: o critério é fazer confiar e provar que você sabe. FUNDO fala com quem já confia: o critério é tirar a objeção e mostrar o resultado de quem comprou.',
        confianca: 'consenso',
      },
      {
        titulo: 'Nada aqui foi medido nesta conta',
        texto:
          'É repertório emprestado de uma referência, não número nosso. Quando um destes formatos for ao ar e medido, o achado migra para o dossiê de carrossel ou de reels, com a taxa junto. Até lá, trate como lista de opções, nunca como promessa de resultado.',
        confianca: 'hipotese',
      },
    ],
  },

  {
    id: 'topo',
    titulo: 'Topo · alcançar quem não te conhece',
    icone: '🔴',
    resumo: 'Formatos que vivem de parar o dedo de quem nunca ouviu falar de você.',
    itens: [
      {
        titulo: 'Fofoca',
        texto:
          'Contar o babado do nicho, o que aconteceu com alguém que todo mundo conhece. Viaja porque a pessoa não precisa te conhecer para se interessar pelo assunto.',
        confianca: 'indicio',
        fonte: 'a etapa aparece escrita logo após o formato no vídeo',
      },
      {
        titulo: 'React',
        texto:
          'Reagir a um vídeo, a um print ou a uma fala de outra pessoa. Pega carona no alcance do material original e mostra a sua opinião sem precisar produzir do zero.',
        confianca: 'hipotese',
      },
      {
        titulo: 'Ranking',
        texto:
          'Ordenar coisas do nicho do pior para o melhor, ou o contrário. O ranking cria discordância, e discordância no comentário é distribuição.',
        confianca: 'indicio',
        fonte: 'a etapa aparece escrita logo após o formato no vídeo',
      },
      {
        titulo: 'Lista',
        texto:
          'A lista numerada de ferramentas, sites ou atalhos. Aqui isto já é medido e é o que mais traz seguidor: 282 num único post contra 1 de um post de ferramenta única.',
        numero: '282 seguidores no melhor caso',
        fonte: 'nosso banco, posts de 07 a 18/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'Clone',
        texto:
          'Você contracenando com você mesmo, fazendo os dois lados de um diálogo. O truque visual segura os primeiros segundos de quem não te conhece.',
        confianca: 'indicio',
        fonte: 'a etapa aparece escrita logo após o formato no vídeo',
      },
      {
        titulo: 'Passo a passo',
        texto:
          'O tutorial curto, do começo ao fim, de uma coisa pequena. Funciona no topo porque o ganho é imediato e não exige contexto nenhum sobre você.',
        confianca: 'indicio',
        fonte: 'a etapa aparece escrita logo após o formato no vídeo',
      },
      {
        titulo: 'Mitos',
        texto:
          'Derrubar uma crença comum do nicho ("batata com broto não faz mal"). O choque com o que a pessoa acredita é o que faz parar.',
        confianca: 'hipotese',
      },
      {
        titulo: 'Tela verde',
        texto:
          'Você na frente de um print, de uma notícia ou de um post, comentando por cima. É o formato mais barato de produzir e o mais fácil de repetir em série.',
        confianca: 'hipotese',
      },
      {
        titulo: 'Carrossel nativo',
        texto:
          'O carrossel feito na cara do Instagram, sem arte de fora: print, foto solta, texto na imagem. Parece post de amigo, não de marca, e é o que a plataforma distribui melhor.',
        confianca: 'hipotese',
      },
    ],
  },

  {
    id: 'meio',
    titulo: 'Meio · fazer confiar quem já te viu',
    icone: '🟠',
    resumo: 'Formatos que provam que você sabe, e que aproximam sem pedir nada.',
    itens: [
      {
        titulo: 'Entrevista de rua',
        texto:
          'Sair e perguntar para desconhecidos. Traz prova social e mostra o problema existindo fora da sua cabeça, na boca de outras pessoas.',
        confianca: 'indicio',
        fonte: 'a etapa aparece escrita logo após o formato no vídeo',
      },
      {
        titulo: 'Cinematográfico',
        texto:
          'A peça bem produzida, com câmera e trilha, sobre um tema do nicho. Não ensina: faz querer fazer parte. Constrói percepção de valor.',
        confianca: 'indicio',
        fonte: 'a etapa aparece escrita logo após o formato no vídeo',
      },
      {
        titulo: 'Reunião',
        texto:
          'O bastidor de uma conversa real de trabalho ("você sabe quanto custa o teu cliente?"). Mostra você exercendo a coisa que ensina, o que vale mais que dizer que sabe.',
        confianca: 'indicio',
        fonte: 'a etapa aparece escrita logo após o formato no vídeo',
      },
      {
        titulo: 'Ponto de vista',
        texto:
          'A cena filmada do seu olhar, colocando quem assiste no seu lugar. Aproxima porque a pessoa vive a situação em vez de ouvir sobre ela.',
        confianca: 'hipotese',
      },
      {
        titulo: 'Comparação',
        texto:
          'Duas formas de fazer a mesma coisa, lado a lado, com o veredito. Prova domínio do assunto sem precisar se declarar especialista.',
        confianca: 'hipotese',
      },
      {
        titulo: 'Antes e depois',
        texto:
          'A transformação visível. É a prova mais rápida que existe, e serve tanto para trabalho de cliente quanto para a sua própria evolução.',
        confianca: 'hipotese',
      },
      {
        titulo: 'Tela dividida',
        texto:
          'Você de um lado, o material do outro, ao mesmo tempo. Serve para comentar enquanto mostra, sem cortar para o print.',
        confianca: 'hipotese',
      },
      {
        titulo: 'Talking head',
        texto:
          'Você falando direto para a câmera, sem produção. É o formato "yap", que já tem dossiê próprio nesta aba: aprofunda com quem já te viu e põe a sua cara no conteúdo.',
        confianca: 'hipotese',
      },
      {
        titulo: 'Timelapse',
        texto:
          'O trabalho acontecendo em velocidade acelerada. Mostra o esforço que existe por trás do resultado, o que é difícil de fingir.',
        confianca: 'hipotese',
      },
      {
        titulo: 'UGC',
        texto:
          'A peça no estilo de conteúdo de usuário, gravada como se fosse um cliente falando. Vale como formato de anúncio e como prova.',
        confianca: 'hipotese',
      },
    ],
  },

  {
    id: 'fundo',
    titulo: 'Fundo · converter quem já confia',
    icone: '🟡',
    resumo: 'Formatos que tiram a objeção e mostram o resultado de quem já comprou. É a etapa que a conta menos produz.',
    itens: [
      {
        titulo: 'Quadro',
        texto:
          'Você desenhando o conceito no quadro branco, explicando o método inteiro. É a aula que prova que existe método, e que ele cabe numa folha.',
        confianca: 'indicio',
        fonte: 'a etapa aparece escrita logo após o formato no vídeo',
      },
      {
        titulo: 'Podcast',
        texto:
          'O corte de conversa longa, com alguém do nicho ou um convidado conhecido. Fundo porque quem assiste um corte de 2 minutos já decidiu que quer te ouvir.',
        confianca: 'hipotese',
      },
      {
        titulo: 'Story nativo',
        texto:
          'O story cru, com a oferta ou o convite direto, no jeito da plataforma. No próprio vídeo o autor hesita nesta ("eu acho que é fundo"), então trate como aposta.',
        confianca: 'hipotese',
        fonte: 'o autor hesita na classificação, na legenda do próprio vídeo',
      },
      {
        titulo: 'Caixinha de pergunta',
        texto:
          'Responder a dúvida real que alguém mandou ("vale a pena começar em infoproduto?"). A objeção vem da audiência, então a resposta cai exatamente onde dói.',
        confianca: 'hipotese',
      },
    ],
  },

  {
    id: 'nosso-buraco',
    titulo: 'O buraco da nossa conta',
    icone: '🕳️',
    resumo: 'O que este cardápio revela quando comparado com o que a gente publica hoje.',
    itens: [
      {
        titulo: 'A conta é quase toda topo',
        texto:
          'O que publicamos é lista, ferramenta e conceito, que são formatos de topo e de meio. Não há praticamente nada de fundo: nenhum quadro, nenhum corte de podcast, nenhuma resposta de caixinha. A matrícula acontece no lançamento porque o conteúdo não faz esse trabalho no resto do mês.',
        confianca: 'indicio',
      },
      {
        titulo: 'O formato de fundo mais barato para começar',
        texto:
          'A caixinha de pergunta: custa uma pergunta real da audiência e um vídeo curto respondendo. Não precisa de produção, de convidado nem de roteiro, e ataca objeção nominal em vez de genérica.',
        confianca: 'hipotese',
      },
      {
        titulo: 'O de maior retorno, e o mais caro',
        texto:
          'O quadro. Ele é a prova de que existe um método, que é exatamente o que uma formação vende. Custa roteiro e uma gravação decente, mas rende peça que dura e pode ser recortada.',
        confianca: 'hipotese',
      },
    ],
  },
];

export const FUNIL_FONTES: Fonte[] = [
  {
    label: 'A referência que originou este cardápio (reel enviado pelo dono)',
    url: 'https://www.instagram.com/reel/DbgUDEkBaK3/',
  },
];

/** Data em que o cardápio foi extraído da referência. */
export const FUNIL_DOSSIE_EM = '20/08/2026';

/** Quantos formatos o cardápio lista (o selo do topo mostra este número). */
export const FUNIL_DOSSIE_TOTAL = FUNIL_DOSSIE.filter((s) => ['topo', 'meio', 'fundo'].includes(s.id)).reduce(
  (s, sec) => s + sec.itens.length,
  0,
);
