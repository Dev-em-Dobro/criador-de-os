/**
 * apps/dobro — carrossel "Agora o Claude se candidata em 500 vagas por você
 * enquanto você dorme".
 *
 * ORIGEM: referência mandada pelo dono e já ligada ao card do board, capturada
 * slide a slide em 19/08/2026 com a sessão logada (`conteudo:capturar-slides`):
 * https://www.instagram.com/p/Db5vNk8lSP7/ — carrossel do @rafa.grandi, no
 * formato "print de post", fundo branco, um passo por slide.
 *
 * ESTRUTURA DA REFERÊNCIA (copiada à risca, nesta ordem):
 *   1 gancho: "O que acontece quando você pede pro Claude se candidatar em 300
 *     vagas por você? Eu testei. E o resultado em 24 horas foi assustador.
 *     Arrasta que eu te mostro os prompts exatos"
 *   2 passo 1, prompt dos cargos + palavras-chave do ATS
 *   3 passo 2, prompt do currículo mestre com a fórmula XYZ, e a deixa "mas tem
 *     um detalhe que você não pode pular"
 *   4 o Claude abre o navegador e entra no LinkedIn (o login é você que faz)
 *   5 passo 3, prompt do garimpo com planilha e currículo por vaga
 *   6 passo final, prompt que dispara as candidaturas, fechando com "o Claude
 *     literalmente pode se candidatar enquanto você dorme"
 *
 * O QUE MUDOU AQUI, E POR QUÊ (pedido do dono: seguir a ref sem ficar igual):
 *   · Os QUATRO PROMPTS foram reescritos. Nenhum é tradução do de lá: cada um
 *     pede uma coisa a mais que a referência não pede (ordem por chance real, o
 *     que falta no currículo, nota de encaixe de 0 a 10, pausa quando o
 *     formulário pergunta o que não está no currículo).
 *   · "EU TESTEI" NÃO ENTRA. A referência afirma teste próprio e resultado em 24
 *     horas; a casa não testou, então afirmar isso seria inventar (Article IV).
 *     A prova aqui vem do que o produto declara fazer, com fonte.
 *   · ENTROU O SLIDE 5, que a referência não tem: a regra do LinkedIn. É o que
 *     separa este post do dela, e é o pedido de precisão do dono.
 *
 * PRECISÃO — TODA AFIRMAÇÃO VERIFICÁVEL, NA FONTE PRIMÁRIA (19/08/2026):
 *   · claude.com/claude-in-chrome, LITERAL: "Claude in Chrome reads the page
 *     you're signed in to, then clicks, types, and fills forms while you decide
 *     what happens next" e "Start a workflow and move on. Claude completes tasks
 *     while you focus elsewhere". Também: "Claude stops before taking sensitive
 *     actions". É isso que sustenta o "enquanto você dorme" do gancho.
 *   · support.claude.com (Get started with Claude in Chrome): "Claude in Chrome
 *     is available for all paid plans (Pro, Max, Team, and Enterprise)"; executa
 *     tarefas agendadas; com o 1Password "Claude never sees your password".
 *   · claude.com/pricing: Pro US$ 17 por mês no anual (US$ 200 cobrados de uma
 *     vez) ou US$ 20 no mensal. Claude in Chrome e Cowork aparecem só do Pro pra
 *     cima, NÃO no plano gratuito. NENHUM SLIDE fala isso (decisão do dono,
 *     19/08): o preço mora na parte 1 do presente. O post também não afirma em
 *     lugar nenhum que a ferramenta é de graça, então não engana ninguém.
 *   · linkedin.com/help/linkedin/answer/a1341387 (Software e extensões
 *     proibidas), LITERAL: o LinkedIn não permite "bots or other unauthorized
 *     automated methods to access the Services", nem "crawlers, browser plugins
 *     and add-ons or any other technology" para raspar o serviço, e quem usa
 *     arrisca ter "their accounts restricted or shut down".
 *   · Fórmula XYZ: é de Laszlo Bock, ex-vice-presidente sênior de People
 *     Operations do Google, "Accomplished [X] as measured by [Y] by doing [Z]",
 *     publicada por ele e no livro Work Rules!. A referência cita "fórmula XYZ
 *     do Google" sem dizer de quem é; aqui o nome dele fica no briefing e na
 *     página do presente.
 *   · ATS é o sistema que lê e filtra currículo por palavra-chave antes de um
 *     humano abrir. Já usado no carrossel vaga-com-claude.
 *
 * O NÚMERO 500, E POR QUE ELE É HONESTO AQUI: a referência escreve 300 no texto
 * e mostra 500 no print do prompt. O título do post (definido pelo dono) usa
 * 500, e o post entrega 500 de verdade: é o volume que o Claude GARIMPA e
 * PREPARA (slide 6, uma versão de currículo por vaga). O disparo sai no ritmo do
 * slide 7, uma por vez, que é o que a regra do LinkedIn permite. Em nenhum slide
 * a casa promete 500 candidaturas enviadas em 24 horas.
 *
 * SEM TRAVESSÃO em nenhum texto de conteúdo.
 */
import type { Carrossel } from '../types';

export const claude500Vagas: Carrossel = {
  slug: 'claude-500-vagas',
  // Título IGUAL ao do card que já está no board: o render acha o card pelo
  // título e, achando, preserva o agendamento (19/08, 21h) e o estado.
  //
  // ENCURTADO de 69 pra 53 caracteres (dono, 19/08/2026). Saiu o "Agora" e o
  // "por você", que eram gordura. O nome "Claude" FICA: é o traço de maior peso
  // da régua (30 pontos, ferramenta com nome próprio), e tirar ele pra caber em
  // 29 caracteres trocaria 30 pontos por 10.
  titulo: 'O Claude se candidata em 500 vagas enquanto você dorme',
  gancho: 'O Claude se candidata em 500 vagas enquanto você dorme',
  dataProgramada: '2026-08-19',
  refsLinks:
    'https://www.instagram.com/p/Db5vNk8lSP7/ (referência: @rafa.grandi, 6 slides transcritos em 19/08/2026)\n' +
    'https://claude.com/claude-in-chrome (clica, digita, preenche formulário e segue trabalhando sozinho)\n' +
    'https://support.claude.com/en/articles/12012173-get-started-with-claude-in-chrome (só planos pagos)\n' +
    'https://claude.com/pricing (Pro US$ 17 no anual, US$ 20 no mensal)\n' +
    'https://www.linkedin.com/help/linkedin/answer/a1341387 (software e extensões proibidas: conta pode ser restrita)',
  /**
   * Presente do "comenta VAGA", criado no Notion em 19/08/2026. Entrega as três
   * coisas prometidas no CTA: os 4 prompts completos (maiores que os dos
   * slides), o esqueleto do currículo mestre na fórmula XYZ, e a régua de ritmo
   * com a citação literal da página de software proibido do LinkedIn.
   *
   * O CTA do DevQuest está NO TOPO da página, antes do callout do presente,
   * que é o padrão dos presentes desta semana (pedido do dono).
   */
  linkPresente: 'https://app.notion.com/p/3c16dd01fb488127bf7cc6f84f219fe2',
  /**
   * Capa gerada pelo dono em 19/08/2026, na família "personagem que encarna o
   * conceito" (a mesma do gambá do 7-repos e do macaco do cara-de-caro), só que
   * em cartoon 3D: polvo coral operando um aparelho em cada um dos oito
   * tentáculos, com uma pessoa dormindo na poltrona atrás e os "z" no ar. Os
   * oito braços SÃO a piada do post (muitas candidaturas ao mesmo tempo), sem
   * precisar de legenda explicando.
   *
   * O arquivo já veio 1122x1402, que é 4:5 exato, então entra sem corte. O
   * terço de baixo é só a mesa de madeira, vazia, que é o que o scrim do
   * template espera. O polvo está fortemente iluminado pelas telas e ocupa os
   * dois terços de cima, onde o scrim é zero (memória prompt-de-capa-nao-pede-escuro).
   */
  bgImage: 'server/carrossel/assets/claude-500-vagas/capa.png',
  slides: [
    {
      variant: 'photo',
      cover: true,
      // A arte chegou em 19/08/2026 (ver bgImage). Saiu o `semFundo`, que era o
      // gradiente de fallback enquanto ela não vinha.
      //
      // `baixo` porque o desenho ocupa quase toda a altura: sem ele, a primeira
      // linha do título nasce na altura dos tentáculos e a terceira cobre o
      // laptop do meio, que é justamente o que mostra o polvo trabalhando.
      baixo: true,
      // O texto grande da capa é o TÍTULO do post, inteiro (memória
      // capa-repete-o-titulo). São 53 caracteres, então vai com `tituloMenor`
      // e quebras curtas, que a 25.8px cabem ~21 caracteres por linha.
      tituloMenor: true,
      // TRÊS linhas, não quatro: cada linha a menos devolve um pedaço da arte.
      // E a quebra aqui é semântica ("O Claude se candidata" / "em 500 vagas" /
      // "enquanto você dorme"), enquanto a de quatro linhas partia no meio das
      // ideias ("candidata em", "500 vagas enquanto").
      titulo: 'O Claude se candidata\nem **500 vagas**\nenquanto você dorme',
      // Subtítulo é TENSÃO, nunca argumento (memória subtitulo-da-capa-e-tensao).
      // E é tensão VERDADEIRA: o slide 5 mostra a regra do LinkedIn.
      subtitulo: 'São 4 prompts. E um detalhe que o LinkedIn não vai gostar.',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      topIcon: 'mouse',
      eyebrow: 'O que mudou',
      // O slide 2 CONFIRMA o gancho (Fura a Bolha, regra 2). A promessa da capa
      // é "ele se candidata"; aqui está por que isso deixou de ser conversa.
      titulo: 'Ele não te dá o\ntexto. Ele **clica**.',
      // Destaque só no verbo que prova o gancho. A primeira versão marcava a
      // frase inteira e o slide virava um bloco roxo, que é o oposto do que o
      // negrito serve (memória texto-de-slide-nunca-em-bloco).
      corpo:
        'A extensão do Claude no Chrome lê a página em que você já está logado e **clica, digita e preenche formulário**. E segue trabalhando enquanto você faz outra coisa.',
      // PREÇO SAIU DAQUI (decisão do dono, 19/08/2026): "nunca dissemos que
      // seria de graça, e se falar que é pago ninguém mais lê". O post não
      // afirma gratuidade em lugar nenhum, então não há promessa a desfazer; a
      // condição de plano pago está na PARTE 1 do presente, onde a pessoa já
      // decidiu que quer fazer. No lugar entrou a prova de que a extensão é
      // oficial, que é o que derruba a desconfiança nesse ponto do carrossel.
      calloutLabel: 'E não é gambiarra',
      callout: 'A extensão é da própria Anthropic, a dona do Claude. Instala no Chrome e trabalha na sua janela.',
      calloutDepois: true,
    },
    {
      variant: 'light',
      denso: true,
      eyebrow: 'Prompt 01',
      titulo: 'Descubra em que\nvagas você **passa**',
      corpo: 'Sobe o seu currículo atual, mesmo o feio, e cola isso num chat novo.',
      calloutLabel: 'Cola isso:',
      callout:
        '"Você é recrutador técnico. Anexei meu currículo. Liste os 15 cargos em que eu tenho a maior chance real hoje, do mais provável pro menos. Pra cada um: as palavras-chave que o filtro automático procura, e o que falta no meu currículo pra passar nele."',
      // A instrução ("sobe o currículo e cola isso") é PRÉ-REQUISITO do prompt,
      // então tem que ser lida antes dele. Sem isto o template põe o callout
      // entre o título e o corpo, e o passo aparece depois da ordem de colar.
      calloutDepois: true,
    },
    {
      variant: 'purple',
      denso: true,
      eyebrow: 'Prompt 02',
      // SEM **destaque** neste slide: no fundo roxo o realce vira lilás claro e
      // some (foi o que aconteceu com "qualquer um" e "Google" na primeira
      // renderização). Os carrosséis aprovados também não usam destaque em
      // slide purple.
      titulo: 'Um currículo mestre\nque vira qualquer um',
      calloutLabel: 'No mesmo chat:',
      callout:
        '"Transforme meu currículo em um modelo mestre que eu adapto em um minuto pra qualquer vaga da lista. Escreva cada conquista na fórmula XYZ (fiz X, medido por Y, fazendo Z), sem inventar nada que eu não fiz. E me aponte o que hoje me derruba, no filtro e no olho humano."',
      corpo: 'A fórmula XYZ é do cara que dirigia a contratação do Google. É o que separa "trabalhei com vendas" de "aumentei a venda em 25% abrindo uma linha nova".',
    },
    {
      variant: 'light',
      topIcon: 'ban',
      // ESTE SLIDE A REFERÊNCIA NÃO TEM. É o pedido de precisão do dono e é o
      // que dá razão pro ritmo do slide 7.
      eyebrow: 'O detalhe que ninguém conta',
      titulo: 'O LinkedIn **não deixa**\nrobô clicar por você',
      corpo:
        'Está escrito na página de software proibido deles: nada de bot ou extensão automatizando atividade no site. Quem faz em volume pode ter a **conta restrita ou desativada**.',
      calloutLabel: 'O que não queima',
      callout: 'O Claude prepara as 500 e dispara no seu ritmo, uma por vez. E o login é sempre seu: ele para antes de digitar senha.',
      calloutDepois: true,
    },
    {
      variant: 'dark',
      denso: true,
      eyebrow: 'Salva esse slide',
      titulo: 'Ele garimpa e já\ndeixa **500 prontas**',
      corpo: 'Aqui você pede pra ele abrir o navegador. Você faz o login, ele assume dali.',
      calloutLabel: 'O terceiro:',
      callout:
        '"Abra o navegador e procure as vagas dos cargos da lista publicadas nos últimos 7 dias. Monte uma planilha com empresa, cargo, modelo de trabalho, link e nota de 0 a 10 de encaixe comigo. Pras que tirarem 7 ou mais, gere uma versão do currículo já ajustada à descrição."',
      // Mesmo motivo do slide 3: "abre o navegador e faz o login" é o que a
      // pessoa precisa saber ANTES de ler o prompt.
      calloutDepois: true,
    },
    {
      variant: 'light',
      denso: true,
      eyebrow: 'Prompt 04',
      titulo: 'E aí ele **manda**,\nde madrugada',
      calloutLabel: 'O último:',
      callout:
        '"Comece a se candidatar pelas de nota mais alta, uma por vez, usando a versão do currículo daquela vaga. Pare e me chame se o formulário pedir dado que não está no meu currículo. No fim, me devolva a lista do que foi enviado, com data, link e o que ficou pendente."',
      corpo: 'Você fecha o notebook. **Ele continua**. De manhã tem a lista do que saiu e do que travou.',
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer os 4 prompts\nprontos pra colar?',
      botao: 'Comenta VAGA 👇',
      // Três entregas concretas e diferentes entre si (memória cta-tres-entregas).
      corpo:
        'Te mando os 4 prompts completos, o modelo de currículo mestre já na fórmula XYZ e a régua de quantas mandar por dia sem o LinkedIn restringir a sua conta.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  /**
   * REFEITA no molde da legenda da REFERÊNCIA (pedido do dono, 19/08/2026),
   * que foi lida do post em 19/08 e tem só 3 blocos e ~230 caracteres:
   *   1. CTA com a palavra-gatilho na 1ª linha, com emoji e "pelo direct"
   *   2. UMA frase de enquadramento ("essa é uma das melhores formas de usar o
   *      Claude para..."), que diz o que aquilo é sem contar como se faz
   *   3. pedido de follow
   * Ela NÃO explica o conteúdo: quem explica são os slides.
   *
   * A versão anterior daqui tinha 4 parágrafos recontando o post inteiro (o
   * problema, a virada, a regra do LinkedIn), que é exatamente o oposto do que
   * a referência faz e gasta o espaço que devia criar o motivo de comentar.
   *
   * O bloco 3 da referência (o "me segue") NÃO é copiado: a linha de follow é
   * montada na hora pela descricao-insta.ts e o pipeline proíbe gravá-la aqui,
   * senão sai duplicada. As hashtags também vivem em campo próprio.
   *
   * Fica bem abaixo dos 700 a 900 caracteres da régua da casa, e é de propósito:
   * aqui o molde da referência é a instrução mais recente e ganha da régua.
   */
  legenda:
    'Comenta VAGA que eu te mando os 4 prompts pelo direct. 🤯\n\n' +
    'Essa é uma das melhores formas de usar o Claude hoje: em vez de te devolver texto pra você copiar, ele abre o ' +
    'navegador, garimpa as vagas e deixa o seu currículo ajustado pra cada uma.\n\n' +
    'E tem um detalhe sobre o LinkedIn que quase ninguém conta. Está lá no post. 👀',
  // Cinco, uma de cada função: nicho exato, categoria, alcance, intenção, marca.
  hashtags: 'claudeai vagatech inteligenciaartificial primeiroemprego devemdobro',
  ctaFinal:
    'Comenta VAGA que eu te mando os 4 prompts completos, o modelo de currículo mestre já na fórmula XYZ e a régua de quantas candidaturas mandar por dia sem o LinkedIn restringir a sua conta.',
  briefing:
    'ORIGEM: referência do board (https://www.instagram.com/p/Db5vNk8lSP7/), carrossel do @rafa.grandi no formato ' +
    '"print de post". Os 6 slides foram capturados com a sessão logada e transcritos palavra por palavra em ' +
    '19/08/2026, não inferidos pela legenda.\n\n' +
    'DECISÃO DO DONO: seguir a referência à risca, mudando os prompts e os textos pra não ficar igual, e com ' +
    'precisão maior que a das vezes anteriores.\n\n' +
    'ESTRUTURA COPIADA: gancho com o número e o "arrasta que eu mostro os prompts" -> prompt dos cargos e ' +
    'palavras-chave do ATS -> prompt do currículo mestre com a fórmula XYZ -> o Claude abre o navegador e o login é ' +
    'seu -> prompt do garimpo com planilha e currículo por vaga -> prompt final que dispara as candidaturas, ' +
    'fechando em "enquanto você dorme".\n\n' +
    'O QUE MUDOU\n' +
    '1. Os quatro prompts foram reescritos, e cada um pede algo que o de lá não pede: ordem por chance real e o que ' +
    'falta no currículo (01), o que derruba você no filtro e no olho humano (02), nota de encaixe de 0 a 10 e ' +
    'currículo só pras notas 7+ (03), uma por vez e pausa quando o formulário pergunta o que não está no currículo (04).\n' +
    '2. O "eu testei, o resultado em 24 horas foi assustador" NÃO foi copiado. A casa não testou, e afirmar teste ' +
    'próprio seria invenção. A prova vem do que o produto declara fazer, com fonte.\n' +
    '3. Entrou o slide 5, que a referência não tem: a regra do LinkedIn.\n\n' +
    'AFIRMAÇÕES VERIFICÁVEIS E SUAS FONTES (conferidas em 19/08/2026)\n' +
    '  · "lê a página, clica, digita e preenche formulário" e "segue trabalhando enquanto você faz outra coisa": ' +
    'claude.com/claude-in-chrome, literal. A mesma página diz "Claude stops before taking sensitive actions".\n' +
    '  · o preço (Pro US$ 17 no anual, US$ 200 cobrados de uma vez, ou US$ 20 no mensal, e nada disso no plano ' +
    'gratuito) está conferido em claude.com/pricing, mas NÃO ENTRA EM SLIDE NENHUM. Decisão do dono em 19/08/2026: ' +
    '"nunca dissemos que seria de graça, e se falar que é pago ninguém mais lê". Fica na parte 1 do presente, onde ' +
    'a pessoa já decidiu fazer. O post não afirma gratuidade em lugar nenhum, então não existe promessa a desfazer.\n' +
    '  · "o login é seu, ele para antes de digitar senha": suporte do Claude in Chrome (com o 1Password, "Claude ' +
    'never sees your password"), e a própria referência mostra o Claude recusando inserir credencial.\n' +
    '  · "o LinkedIn não deixa": linkedin.com/help/linkedin/answer/a1341387, que proíbe bot, crawler, plugin e ' +
    'extensão automatizando atividade, e avisa que a conta pode ser restrita ou desativada.\n' +
    '  · fórmula XYZ: de Laszlo Bock, ex-vice-presidente sênior de People Operations do Google ("Accomplished X as ' +
    'measured by Y by doing Z", do livro Work Rules!). Por isso o slide 4 diz "o cara que dirigia a contratação do ' +
    'Google" em vez de repetir "fórmula do Google" sem dono.\n\n' +
    'O NÚMERO 500: a referência escreve 300 no texto e mostra 500 no print. O título do dono usa 500, e o post ' +
    'entrega 500 de verdade no slide 6, que é o garimpo e a preparação (uma versão de currículo por vaga). O ' +
    'disparo sai uma por vez, no ritmo do slide 7. Nenhum slide promete 500 candidaturas enviadas em 24 horas.\n\n' +
    'LACUNA (memória carrossel-lacuna-do-endereco): os prompts aparecem resumidos nos slides; o que fica de fora e ' +
    'vira o presente é a versão completa dos quatro, o modelo de currículo mestre preenchido e a régua de ritmo.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): o número e o absurdo do "enquanto você dorme".\n' +
    'Regra 2 (o slide 2 confirma): ele clica de verdade, não devolve texto.\n' +
    'Regra 3 (slide sozinho): cada prompt se explica sem o anterior.\n' +
    'Regra 4 (salvável): o slide 6, marcado com "salva esse slide".\n' +
    'Regra 5 (CTA único): comenta VAGA.\n\n' +
    'CAPA (chegou em 19/08/2026): polvo cartoon coral com um aparelho em cada um dos oito tentáculos e uma pessoa ' +
    'dormindo na poltrona atrás. Os oito braços são a piada do post sem precisar de legenda. Veio 1122x1402 (4:5 ' +
    'exato), entrou sem corte. O slide usa `baixo` e o título em TRÊS linhas: com quatro, o bloco subia até os ' +
    'tentáculos e as quebras partiam as ideias no meio.\n\n' +
    'PRESENTE (criado em 19/08/2026): app.notion.com/p/3c16dd01fb488127bf7cc6f84f219fe2, com o CTA do DevQuest no ' +
    'TOPO, antes do callout do presente, que é o padrão dos presentes desta semana.\n\n' +
    'LEGENDA NO MOLDE DA REFERÊNCIA (refeita em 19/08/2026, a pedido do dono). A legenda do @rafa.grandi foi lida do ' +
    'post e tem 3 blocos em ~230 caracteres: (1) "Comenta \'linkedin\' que te mando pelo direct! 🤯", (2) uma frase ' +
    'só, "essa é uma das melhores formas de utilizar o Claude para te auxiliar na otimização do seu linkedin", ' +
    '(3) "👇🏽 Me segue para mais conteúdo de IA". Ela não conta nada do conteúdo: quem conta são os slides.\n' +
    'A nossa copia os blocos 1 e 2 e fecha com a lacuna do LinkedIn. O bloco 3 não entra porque a linha de follow é ' +
    'montada na hora pela descricao-insta.ts. Isso deixa a legenda bem abaixo dos 700 a 900 caracteres da régua da ' +
    'casa, e é consciente: o molde da referência foi a instrução mais recente do dono.\n\n' +
    'NADA PENDENTE. Post fechado, agendado para 19/08 às 21h.',
};
