/**
 * apps/dobro — carrossel do n8n, com o eixo na TESE DO DONO: quem ganha dinheiro
 * com tecnologia é quem usa a tecnologia pra devolver tempo ou dinheiro pra outra
 * pessoa. A ferramenta é meio, não assunto.
 *
 * REESCRITA (pedido do dono, 19/08/2026). O que mudou e por quê:
 *   · A TESE virou o slide 2, antes de qualquer ferramenta. A versão anterior
 *     abria apresentando o n8n, o que é conversa de dev. O público é quem quer
 *     construir com IA (memória publico-alvo-vibe-code), e pra esse público o
 *     assunto é o problema do cliente, não o software.
 *   · Entrou a CONTA da clínica (slide 3), que é o coração do argumento: a clínica
 *     grande deixa dinheiro na mesa em atendimento lento e em paciente que nunca
 *     é chamado de volta. Sem esse número, "R$ 1.500" fica caro; com ele, barato.
 *   · O 4º item do serviço deixou de ser "lembra na véspera" repetido e virou
 *     "chama quem sumiu": o retorno que ninguém cobra, que o dono apontou como a
 *     segunda fonte de perda.
 *   · Entrou o comparativo (slide 7): o que ela paga × o que ela para de perder.
 *     É a conta que fecha a venda, e é a resposta pra objeção do preço.
 *   · O CTA saiu de "N8N" pra "FLUXO". A palavra do comentário precisa ser
 *     pronunciável: "n8n" mistura letra e número, e cada pessoa que digita n8m,
 *     nan ou N8 é um comentário que o robô não responde.
 *   · O PRESENTE mudou de natureza (pedido do dono): NÃO ensina a conectar o n8n
 *     no WhatsApp, que é complexo demais pra entregar em página. Ensina o que é o
 *     n8n e como PLANEJAR o fluxo antes de abrir a ferramenta, que é a parte que
 *     separa quem vende de quem só mexe.
 *
 * AIDA, slide a slide:
 *   Atenção   1  a capa, com o número e o dinheiro
 *   Interesse 2  a tese  ·  3 a conta que mostra o dinheiro parado
 *   Desejo    4  o que você entrega  ·  5 dá pra montar sem código  ·  6 o preço
 *   Ação      7  por que é barato pra ela  ·  8 o pedido
 *
 * ⚠️ PREÇO É AFIRMAÇÃO VERIFICÁVEL, e por isso não saiu da cabeça de ninguém.
 * Faixas conferidas em DUAS fontes brasileiras independentes (15/08/2026):
 *   · horadecodar.com.br, guia "Quanto cobrar automação n8n": simples (integração
 *     básica entre dois sistemas) R$ 400 a R$ 900; intermediária (várias
 *     integrações, lógica condicional, tratamento de erro) R$ 900 a R$ 2.500;
 *     avançada (várias plataformas, APIs externas, notificação por WhatsApp)
 *     R$ 2.500 a R$ 10.000 ou mais.
 *   · automacaohoje.com, guia de 14/07/2026: as mesmas duas primeiras faixas, e
 *     "o dinheiro consistente está na operação mensal", com a mensalidade tendo
 *     que cobrir VPS (US$ 20 a 50 por cliente), consumo de API de IA, horas de
 *     suporte e margem.
 * O R$ 1.500 cai no MEIO da faixa intermediária das duas fontes.
 *
 * ⚠️ A CONTA DA CLÍNICA É EXEMPLO, E O SLIDE DIZ ISSO. Não existe pesquisa citada
 * ali: são 300 pacientes por semana, 1 em cada 10 faltando e ticket de R$ 200,
 * declarados como exemplo no próprio corpo do slide. É aritmética à vista, não
 * alegação de mercado. Se algum dia entrar um número de fonte (taxa real de falta
 * em consulta odontológica, por exemplo), ele precisa vir com a fonte no briefing.
 *
 * FATOS DA FERRAMENTA, NA FONTE PRIMÁRIA (15/08/2026):
 *   · n8n-io/n8n, 200.765 estrelas, TypeScript, push no mesmo dia
 *   · a licença NÃO é open source padrão: é modelo fair-code, sob Sustainable
 *     Use License e n8n Enterprise License (a API do GitHub devolve NOASSERTION).
 *     Nenhum slide usa o termo "open source".
 *   · docs.n8n.io: sobre a Community, LITERAL: "You can stick with the basic
 *     Community edition for free, indefinitely".
 *   · o comando de instalação e o endereço do editor (localhost:5678) NÃO entram
 *     em slide: vivem no presente (ver memória carrossel-lacuna-do-endereco).
 *   · número de integrações NÃO é afirmado: o README diz 1500+ e a descrição do
 *     repositório diz 400+, então a casa não repassa nenhum dos dois.
 *
 * SEM TRAVESSÃO em nenhum texto de conteúdo.
 */
import type { Carrossel } from '../types';

export const n8nSelfHost: Carrossel = {
  slug: 'n8n-self-host',
  titulo: 'O n8n é de graça. O cliente paga R$ 1.500.',
  gancho:
    'O n8n é de graça e o cliente paga R$ 1.500, porque pra ele isso ainda é barato.',
  dataProgramada: '2026-08-19',
  refsLinks:
    'https://docs.n8n.io/choose-how-to-use-n8n/ (Community gratuita, indefinidamente)\n' +
    'https://github.com/n8n-io/n8n (README: fair-code, Sustainable Use License)\n' +
    'https://www.horadecodar.com.br/quanto-cobrar-automacao-n8n/ (faixas de preço no Brasil)\n' +
    'https://automacaohoje.com/guias/automacao-como-servico-agencia-n8n/ (14/07/2026, faixas e modelo mensal)',
  /**
   * Presente do "comenta FLUXO" — REFAZER NO NOTION (19/08/2026). O presente
   * antigo ensinava a subir o n8n e desenhava o fluxo do agendamento passo a
   * passo; o dono cortou isso porque conectar n8n ao WhatsApp é complexo demais
   * pra caber numa página e frustra quem chega do zero.
   *
   * O presente novo tem três partes, na ordem:
   *   1. O que é o n8n em um minuto: pra que serve, por que é de graça, e o que
   *      você vê quando abre (sem comando de instalação como pré-requisito).
   *   2. O mapa pra planejar o fluxo ANTES de abrir a ferramenta: as quatro peças
   *      (gatilho, dado, decisão, ação) com um exemplo preenchido e um em branco.
   *   3. As cinco perguntas de diagnóstico que revelam onde o cliente perde
   *      dinheiro, mais a conta pronta pra transformar a resposta em proposta.
   *
   * Página criada em 19/08/2026. O presente ANTIGO continua existindo em
   * /p/3bd6dd01fb4881359911fd3f83db4351 (o que ensinava a subir o n8n e desenhava
   * o fluxo do agendamento caixa por caixa); ele não foi apagado, só saiu do card.
   *
   * PENDENTE na página nova: o link de inscrição do DevQuest, que está como
   * placeholder no último bloco.
   */
  linkPresente: 'https://app.notion.com/p/3c16dd01fb488150a6dec3d4078a4310',
  /**
   * Capa gerada pelo dono em 19/08/2026, na família "personagem que encarna o
   * conceito" (a mesma do gambá do 7-repos e do macaco do cara-de-caro): preguiça
   * de terno e óculos escuros contando dinheiro na cadeira do dentista. A preguiça
   * é o "sem escrever código" e a cadeira amarra com o exemplo do slide 3.
   *
   * O arquivo já veio em 4:5 com o bicho nos dois terços de cima e o rodapé
   * escuro e vazio, que é exatamente o que o scrim do template espera.
   */
  bgImage: 'server/carrossel/assets/n8n-self-host/capa.png',
  slides: [
    {
      variant: 'photo',
      cover: true,
      baixo: true,
      // Título 30% menor (25.8px), como nas duas capas campeãs da conta (gambá do
      // 7-repos e macaco do cara-de-caro). No primeiro render a 36.8px o texto
      // subia até o meio do slide e cobria o maço de dinheiro nas mãos da
      // preguiça, que é justamente o que faz a cena significar alguma coisa.
      tituloMenor: true,
      // GANCHO TROCADO em 19/08/2026. O anterior era "A automação que você monta
      // sem código e vende por R$ 1.500": linear, 57 caracteres, e sem o "de
      // graça", que é o traço com maior lift medido nos 150 carrosséis da conta.
      //
      // Os campeões de dinheiro daqui não enfileiram, CONTRASTAM: "Enquanto você
      // brinca com IA, outros ganham de R$ 2.000 a R$ 5.000", "Transcrição custa
      // R$ 225 a hora e o seu PC faz de graça", "7 repos que substituem software
      // pago". Sempre o caro de um lado e o grátis do outro. A assimetria é a
      // tese deste post, e estava fora da capa.
      //
      // Agora tem os quatro traços de uma vez: "de graça", contraste, número e
      // título curto (45 caracteres). O "sem código" não se perdeu, desceu pro
      // subtítulo. Quebras curtas de propósito: a 36.8px cabem ~15 caracteres por
      // linha, e "R$" nunca se separa do número.
      // NOME PRÓPRIO na capa, medido em 19/08/2026 sobre os 150 carrosséis:
      // título com nome de ferramenta (Claude, n8n, GitHub, MCP) tem mediana de
      // 50,5 salv/1k, 17,2 com/1k e 22 SEGUIDORES; com termo genérico (IA,
      // automação, código) cai pra 14,2 / 3,2 / 1 seguidor; e sem âncora nenhuma,
      // 12,3 / 4,5 / ZERO. Categoria não dá o que salvar, nome próprio dá.
      //
      // A versão anterior ("Você monta de graça. O cliente paga R$ 1.500") caía
      // na terceira faixa. Mantém o contraste, o "de graça", o número e as três
      // linhas; troca só o sujeito por quem tem nome.
      titulo: 'O n8n é de graça.\nO cliente paga\n**R$ 1.500**',
      // Subtítulo é TENSÃO, nunca argumento (memória subtitulo-da-capa-e-tensao).
      // "E ele ainda acha barato" é a curiosidade que só fecha no slide 7.
      subtitulo: 'Sem escrever uma linha de código. E ele ainda acha barato.',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      topIcon: 'ai',
      eyebrow: 'A virada',
      titulo: 'Ninguém paga pela\n**ferramenta**',
      corpo:
        'Pagam pelo que ela devolve: **tempo** ou **dinheiro**. Quem ganha com tecnologia é quem resolve o problema de outra pessoa com ela. O resto é hobby.',
      // Callout DEPOIS do corpo, e SEM citar a clínica: aqui ela ainda não foi
      // apresentada (a capa fala de automação e preço, não de cliente), e entrar
      // com "nenhuma clínica quer um robô" soa como continuação de uma conversa
      // que o leitor não teve. O exemplo da clínica só nasce no slide 3, com
      // artigo indefinido, que é o que apresenta.
      calloutLabel: 'Traduzindo',
      callout: 'Ninguém compra um robô. Compram o problema resolvido.',
      calloutDepois: true,
    },
    {
      variant: 'light',
      // O eyebrow é a PRIMEIRA linha lida do slide, e é onde o exemplo se
      // apresenta: a pessoa sabe que vem uma clínica odontológica antes de ler
      // "uma clínica perde". Era "Onde o dinheiro vaza", que anunciava o assunto
      // mas não o caso.
      eyebrow: 'Exemplo: clínica odontológica',
      // "Uma clínica", não "A clínica": é aqui que o exemplo é APRESENTADO. O
      // artigo definido pressupunha uma clínica que o leitor nunca viu.
      titulo: 'Uma clínica perde\nna **cadeira vazia**',
      terminal: [
        '300 pacientes por semana',
        '1 em cada 10 falta   → 30 cadeiras vazias',
        'ticket de R$ 200     → R$ 6 mil na semana',
        'no mês               → R$ 24 mil parados',
      ],
      corpo:
        'Números de exemplo, e a conta é essa. Ninguém na recepção tem tempo de ligar pra 30 pessoas, nem de chamar quem sumiu há seis meses.',
    },
    {
      variant: 'purple',
      eyebrow: 'O que roda sozinho',
      titulo: 'O que você entrega\npra ela',
      // Quatro itens, sub de uma linha (memória slide-com-4-itens-nao-cabe-corpo).
      itens: [
        { icone: 'chat', titulo: 'Responde na hora', sub: 'Mensagem de madrugada não espera até segunda' },
        { icone: 'map', titulo: 'Marca na agenda', sub: 'Confere o horário livre e grava a consulta' },
        { icone: 'loop', titulo: 'Lembra na véspera', sub: 'É o lembrete que derruba a falta' },
        { icone: 'follow', titulo: 'Chama quem sumiu', sub: 'Paciente sem retorno há meses recebe convite' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'A ferramenta',
      // Título é o NOME, e o subtítulo diz o que ele faz numa frase: é o uso que
      // o `subtitulo` tem fora da capa (ver types.ts).
      titulo: 'Chama **n8n**',
      subtitulo: 'Você monta arrastando caixas, sem escrever uma linha de código.',
      corpo:
        'A edição Community é **gratuita, sem prazo**, e roda no seu computador ou num servidor barato. Não precisa saber programar pra montar o primeiro fluxo.',
      // Logo oficial montado num cartão branco: o bloco `.selo` dimensiona pela
      // ALTURA, então o logo cru (458x124) viraria gigante e sairia cortado.
      selo: 'server/carrossel/assets/n8n-self-host/n8n-card.png',
      seloFundo: '#ffffff',
    },
    {
      variant: 'dark',
      eyebrow: 'Salva esse slide',
      titulo: 'Quanto **cobrar**',
      // Era um bloco de terminal com quatro linhas ("SIMPLES R$ 400 a 900 / 2
      // sistemas"), e o dono derrubou por dois motivos: a fonte do terminal é
      // pequena demais pro número, que é o que interessa aqui, e as descrições
      // estavam resumidas a ponto de não explicar nada ("2 sistemas", "com
      // decisão", "agente que responde").
      //
      // Como itens, o VALOR vira o título do item (grande) e a explicação ganha
      // uma frase inteira, com exemplo concreto. Três itens, não quatro, pra
      // sobrar espaço pro corpo levar a âncora do R$ 1.500.
      //
      // FIDELIDADE À FONTE: a faixa de cima é definida pelos dois guias como
      // "várias plataformas, APIs externas, notificação por WhatsApp", NÃO por
      // ter IA. O texto anterior dizia "COM IA / agente que responde", que era
      // interpretação nossa em cima do número da fonte. Corrigido.
      itens: [
        {
          icone: 'loop',
          titulo: 'R$ 400 a 900',
          sub: 'Liga dois sistemas e acabou: chegou formulário no site, cai na planilha e te avisa',
        },
        {
          icone: 'puzzle',
          titulo: 'R$ 900 a 2.500',
          sub: 'Vários sistemas juntos, e o fluxo decide sozinho o que fazer com cada caso',
        },
        {
          icone: 'ai',
          titulo: 'R$ 2.500 ou mais',
          sub: 'Muita peça conectada, com aviso no WhatsApp e plano pra quando algo falha',
        },
      ],
      corpo:
        'Faixas praticadas no Brasil em 2026, segundo dois guias de precificação. **O agendamento da clínica é o do meio, uns R$ 1.500.** A manutenção mensal se cobra à parte.',
    },
    {
      variant: 'light',
      eyebrow: 'A conta que fecha a venda',
      titulo: 'Por que R$ 1.500 é\n**barato** pra ela',
      // As duas colunas são lidas EM PARES, linha a linha. A primeira versão
      // quebrava uma frase única em três linhas do lado direito ("R$ 24 mil" /
      // "em cadeira vazia" / "todo mês"), e no PNG cada pedaço ganhou seu próprio
      // ✓, virando três itens que não pareavam com nada à esquerda. Agora cada
      // linha da esquerda tem a resposta dela na mesma altura, à direita.
      versus: {
        ruim: { rotulo: 'O que ela paga', linhas: ['R$ 1.500 uma vez', 'mais a manutenção'] },
        bom: { rotulo: 'O que ela recupera', linhas: ['R$ 24 mil por mês', 'todo mês, sozinho'] },
      },
      corpo:
        'Seu preço não é pela sua hora. É por **uma fração do que ela deixa de perder** enquanto ninguém responde.',
      // Fechamento pedido pelo dono (19/08/2026): o argumento não para em "1.500
      // é barato", ele estica até o teto. R$ 10 mil NÃO é número inventado pra
      // impressionar: é o topo da faixa avançada nos dois guias de precificação
      // (R$ 2.500 a R$ 10.000 ou mais), e a frase é condicional de propósito
      // ("dependendo do negócio"), porque o que sustenta o preço é o tamanho do
      // que o cliente deixa de perder, não a automação em si.
      calloutLabel: 'Ou seja',
      callout: 'Se você cobrasse R$ 10 mil por essa automação, dependendo do negócio o cliente ainda paga feliz.',
      calloutDepois: true,
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer montar o\nseu primeiro?',
      botao: 'Comenta FLUXO 👇',
      corpo:
        'Te mando o que é o n8n em um minuto, o mapa pra planejar o fluxo antes de abrir a ferramenta e as 5 perguntas que revelam onde o cliente está perdendo dinheiro.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  // Legenda pela METADE e 5 hashtags (padrão do dono, 17/08/2026). A linha
  // "Segue @devemdobro..." NÃO entra aqui: ela é montada na hora pela
  // descricao-insta.ts, e o pipeline proíbe gravá-la na legenda.
  legenda:
    'Comenta FLUXO que eu te mando o mapa pra planejar a sua primeira automação. 🤖\n\n' +
    'Quem ganha dinheiro com tecnologia não é quem sabe mexer na ferramenta. É quem usa a ferramenta pra devolver ' +
    'tempo ou dinheiro pra outra pessoa.\n\n' +
    'Pensa numa clínica grande, com centenas de pacientes por semana. Se 1 em cada 10 falta e o ticket é de R$ 200, ' +
    'são uns R$ 24 mil parados por mês em cadeira vazia. E ninguém na recepção tem tempo de ligar pra 30 pessoas, ' +
    'nem de chamar quem sumiu há seis meses.\n\n' +
    'A automação que resolve isso você monta arrastando caixas no n8n, sem escrever código. Ela responde na hora, ' +
    'marca na agenda, lembra na véspera e chama quem sumiu.\n\n' +
    'Quanto cobrar: os guias brasileiros de 2026 colocam esse tipo de fluxo entre R$ 900 e R$ 2.500. Uns R$ 1.500. ' +
    'Pra ela, é uma fração do que para de perder.\n\n' +
    'Comenta FLUXO aqui embaixo. 👇',
  // Cinco, uma de cada função: nicho exato, categoria, alcance, intenção, marca.
  hashtags: 'n8n automacao inteligenciaartificial freelancer devemdobro',
  ctaFinal:
    'Comenta FLUXO que eu te mando o que é o n8n em um minuto, o mapa pra planejar o fluxo antes de abrir a ferramenta e as 5 perguntas que revelam onde o cliente está perdendo dinheiro.',
  briefing:
    'TESE DO DONO (19/08/2026), e é o eixo do post inteiro: quem ganha dinheiro com tecnologia é quem usa ela pra ' +
    'ajudar OUTRAS pessoas a terem mais resultado, seja mais tempo ou mais dinheiro. A ferramenta é meio, não ' +
    'assunto. Por isso a tese vem no slide 2, antes do n8n aparecer.\n\n' +
    'O EXEMPLO ÂNCORA: clínica odontológica grande, centenas de pacientes por semana. Ela deixa dinheiro na mesa em ' +
    'dois lugares: atendimento lento (mensagem que ninguém responde) e retorno que ninguém cobra (paciente que ' +
    'sumiu e nunca é chamado de volta). Uma automação montada sem saber programar resolve os dois, e vale no mínimo ' +
    'R$ 1.500 pra quem monta. Pra clínica é barato, porque o que está parado é ordem de grandeza maior.\n\n' +
    'A CONTA DO SLIDE 3 É EXEMPLO DECLARADO, não pesquisa: 300 pacientes por semana, 1 em cada 10 faltando, ticket ' +
    'de R$ 200, dá R$ 24 mil por mês. O próprio slide diz "números de exemplo". Nenhum número de fonte é alegado ' +
    'ali. Se um dia entrar taxa real de falta, tem que vir com a fonte.\n\n' +
    'PREÇOS CONFERIDOS EM DUAS FONTES INDEPENDENTES (15/08/2026), porque preço é afirmação verificável:\n' +
    '  · horadecodar.com.br: simples R$ 400 a 900; intermediária R$ 900 a 2.500; avançada R$ 2.500 a 10.000+.\n' +
    '  · automacaohoje.com (14/07/2026): mesmas faixas, e "o dinheiro consistente está na operação mensal".\n' +
    'O R$ 1.500 cai no meio da faixa intermediária das duas fontes, que é onde esse serviço mora.\n\n' +
    'A PALAVRA DO CTA MUDOU DE N8N PRA FLUXO: palavra de comentário precisa ser pronunciável. As que renderam na ' +
    'conta foram HACKER, GRANA, JARVIS, TIMES, PASTA, DESIGN, REPO. "N8N" mistura letra e número e cada pessoa que ' +
    'digita n8m, nan ou N8 é um comentário que o robô não responde.\n\n' +
    'PRESENTE (refazer no Notion): NÃO ensina a conectar n8n no WhatsApp, que é complexo demais pra página e ' +
    'frustra quem chega do zero. Ensina, nesta ordem: (1) o que é o n8n em um minuto, (2) o mapa das quatro peças ' +
    'pra planejar o fluxo ANTES de abrir a ferramenta, com um exemplo preenchido e um em branco, (3) as cinco ' +
    'perguntas de diagnóstico que revelam onde o cliente perde dinheiro, com a conta pronta pra virar proposta.\n\n' +
    'A LACUNA: as quatro peças do fluxo saíram dos slides de propósito e viraram o miolo do presente. É o que dá ' +
    'razão pro CTA existir (memória carrossel-lacuna-do-endereco).\n\n' +
    'OUTROS SERVIÇOS COM O MESMO FLUXO (pauta pra outros posts): qualificação de lead; orçamento que some, com ' +
    'cobrança automática em 24h, 3 e 7 dias; relatório de segunda pronto no WhatsApp do dono; onboarding de cliente ' +
    'novo disparando pastas, e-mail e call.\n\n' +
    'AUXÍLIO VISUAL EM TODO SLIDE (pedido do dono, 19/08/2026): eyebrow anunciando o que vem, ícone no slide da ' +
    'tese, quatro ícones no slide do serviço, logo do n8n no slide da ferramenta, bloco de terminal com seta nos ' +
    'slides 3 e 6, comparativo de duas colunas no 7 e o swipe na capa.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): o contraste "de graça x R$ 1.500", que é a tese do post na primeira linha.\n' +
    'Regra 2 (o slide 2 confirma): a tese, que é a promessa da capa dita por extenso.\n' +
    'Regra 3 (slide sozinho): a conta, o serviço, a ferramenta, o preço, o comparativo.\n' +
    'Regra 4 (salvável): o slide do preço, marcado com "salva esse slide".\n' +
    'Regra 5 (CTA único): comenta FLUXO.\n\n' +
    'PENDENTE ANTES DE PUBLICAR: arte de capa (hoje é o gradiente de fallback) e a página nova do presente no ' +
    'Notion, com o link trocado em linkPresente.',
};
