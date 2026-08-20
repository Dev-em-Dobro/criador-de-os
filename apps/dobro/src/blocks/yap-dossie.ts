/**
 * apps/dobro — DOSSIÊ do formato "yap content" (reels falando pra câmera).
 *
 * Dados PUROS, sem React e sem IA em runtime: é a pesquisa de campo que abastece
 * a aba Estrategista enquanto ainda não temos reels medidos no banco. Quando
 * houver reels em `v_conteudo_desempenho`, esta parte vira a régua contra a qual
 * os números reais são comparados (mesmo papel que o ranking de estruturas faz
 * hoje pro carrossel).
 *
 * Cada afirmação com número traz a FONTE junto (campo `fonte`), pra ninguém
 * repetir benchmark sem saber de onde veio. Pesquisa consolidada em 20/08/2026.
 */

// Os tipos saíram daqui em 20/08/2026, quando o dossiê de carrossel nasceu e os
// dois passaram a compartilhar a mesma forma. O re-export mantém quem importava
// `Confianca`, `DossieSecao` e `CONFIANCA_LABEL` deste arquivo funcionando.
export type { Confianca, DossieItem, DossieSecao, Fonte } from './dossie-tipos';
export { CONFIANCA_LABEL } from './dossie-tipos';

import type { DossieSecao, Fonte } from './dossie-tipos';

export const YAP_DOSSIE: DossieSecao[] = [
  {
    id: 'oque-e',
    titulo: 'O que é, na prática',
    icone: '🎙️',
    resumo: 'Vídeo de selfie falando pra câmera, sem roteiro decorado e com edição mínima.',
    itens: [
      {
        titulo: 'A definição de campo',
        texto:
          'Vídeo gravado na mão, sem script, edição quase nula, legenda queimada e uma manchete de texto por cima. Parece um Story que virou reels. O valor está inteiro no que é dito, não na produção.',
        confianca: 'consenso',
        fonte: 'Manychat, tendências IG 2026',
      },
      {
        titulo: 'Não é "vídeo de talking head bonitinho"',
        texto:
          'O que define o formato não é a câmera parada na sua cara: é a ausência de polimento. Iluminação de estúdio, corte no ritmo e trilha de fundo matam o efeito, porque o formato vende justamente o oposto disso.',
        confianca: 'consenso',
        fonte: 'Rachel Havekost',
      },
      {
        titulo: 'O que aparece na tela',
        texto:
          'Sua cara enquadrada do peito pra cima, uma manchete de texto fixa no topo e a legenda automática. Cenário real: cozinha, mesa, carro, rua. O cenário perfeito é o que denuncia que é raro.',
        confianca: 'consenso',
        fonte: 'Merra, talking head',
      },
    ],
  },
  {
    id: 'porque-funciona',
    titulo: 'Por que está funcionando agora',
    icone: '⚡',
    resumo: 'É o formato que a IA não consegue fabricar, e o rosto humano tem vantagem neurológica.',
    itens: [
      {
        titulo: 'É à prova de IA',
        texto:
          'Nenhum modelo consegue reproduzir a coisa específica e bagunçada que você viveu ontem. Num feed inundado de conteúdo gerado, o relato de experiência vivida virou o sinal de que tem gente ali.',
        confianca: 'consenso',
        fonte: 'Rachel Havekost / Personal Brand Accelerator',
      },
      {
        titulo: 'O cérebro tem uma área só pra rosto',
        texto:
          'Existe uma região dedicada ao processamento de faces, e ela dispara mais forte do que pra qualquer outro estímulo visual. Falar pra câmera larga com essa vantagem embutida antes de você dizer a primeira palavra.',
        confianca: 'indicio',
        fonte: 'Digivizer',
      },
      {
        titulo: 'Fundador falando bate criativo de marca',
        texto:
          'Especialista, fundador ou dono falando direto pra câmera está superando o criativo polido de marca em alcance e engajamento. É a razão de o formato ter escapado do nicho de creator e chegado em empresa.',
        confianca: 'indicio',
        fonte: 'Digivizer',
      },
      {
        titulo: 'A janela pode fechar',
        texto:
          'A crítica mais dura ao formato: se todo mundo copiar a fórmula do cru, o cru vira o novo polido. Quem apenas imita o formato fica tão artificial quanto o que tentava combater. O que sustenta o yap ao longo do tempo é ter o que dizer.',
        confianca: 'consenso',
        fonte: 'Rachel Havekost',
      },
    ],
  },
  {
    id: 'objetivo',
    titulo: 'Pra que serve (e pra que NÃO serve)',
    icone: '🎯',
    resumo: 'Yap é formato de confiança e nutrição, não a máquina principal de seguidor novo.',
    itens: [
      {
        titulo: 'O objetivo primário é proximidade',
        texto:
          'Falar pra câmera simula conversa cara a cara e é o que constrói confiança. No funil, é conteúdo de aquecimento e conversão: aprofunda com quem já te viu, mostra como é trabalhar com você.',
        confianca: 'consenso',
        fonte: 'quso.ai, funil Shorts/Reels',
      },
      {
        titulo: 'Alcance frio continua sendo trabalho do gancho',
        texto:
          'O formato não distribui sozinho. Yap que alcança gente nova é yap com opinião forte o bastante pra parar o dedo de quem não te conhece. Sem isso, ele fica circulando entre quem já te segue, que também é um resultado válido, mas outro.',
        confianca: 'indicio',
        fonte: 'quso.ai / OpusClip',
      },
      {
        titulo: 'A divisão de trabalho aqui dentro',
        texto:
          'Nosso carrossel já é a peça que traz seguidor e comentário, com 153 posts medidos provando isso. A aposta é o yap assumir o que o carrossel não faz: pôr a nossa cara no conteúdo. Isso precisa ser confirmado com número, não aceito de saída.',
        numero: '153 carrosséis medidos vs 0 reels medidos',
        confianca: 'hipotese',
        fonte: 'nosso banco',
      },
    ],
  },
  {
    id: 'cara',
    titulo: 'Por que a cara importa (o motivo que não aparece no alcance)',
    icone: '🫵',
    resumo: 'O carrossel cresce a conta sem construir a pessoa. Numa conta que fala de IA, isso cobra caro.',
    itens: [
      {
        titulo: 'O carrossel é impessoal por construção',
        texto:
          'Ele entrega informação bem desenhada e some. A pessoa salva o post, segue a conta e continua sem saber quem está do outro lado. Isso é ótimo pra alcance e ruim pra tudo que depende de confiar em alguém.',
        confianca: 'consenso',
        fonte: 'leitura do dono',
      },
      {
        titulo: 'Falar de IA sem mostrar rosto levanta suspeita',
        texto:
          'Numa conta cujo assunto é justamente inteligência artificial, o conteúdo anônimo e bem acabado é indistinguível do conteúdo gerado por máquina. O rosto deixa de ser estética e vira prova de que existe gente aqui.',
        confianca: 'hipotese',
      },
      {
        titulo: 'Quem compra formação compra de uma pessoa',
        texto:
          'O modelo é lançamento mensal com uma formação no fim. Ninguém se matricula com uma conta: se matricula com um professor. Se a base cresce sem conhecer o rosto, o lançamento tem que fazer num mês o trabalho de apresentação que o conteúdo não fez em doze.',
        confianca: 'hipotese',
      },
      {
        titulo: 'A régua do carrossel mata o yap pelo motivo errado',
        texto:
          'Carrossel é máquina de alcance, yap é máquina de reconhecimento. Medir o yap por alcance por peça garante que ele sempre perde, e a gente descarta a coisa certa olhando o número errado.',
        confianca: 'consenso',
      },
      {
        titulo: 'A métrica que traduz isso',
        texto:
          'Visita ao perfil é a métrica de "quis saber quem é você". No nosso carrossel ela roda em 4,03 por mil de alcance, mediana de 0,32% do alcance, 51 visitas por post. É esse número que o yap precisa bater, e não o de alcance.',
        numero: 'carrossel: 4,03 visitas/1k · 51 por post',
        confianca: 'indicio',
        fonte: 'nosso banco (jul+ago 2026)',
      },
      {
        titulo: 'O buraco que impede a comparação hoje',
        texto:
          'Nos 88 reels do histórico, visitas ao perfil, seguidores e duração estão todos NULL. Nunca foram preenchidos. Sem esses três campos nos reels novos, o piloto termina sem veredito.',
        numero: '88 reels sem nenhuma métrica de pessoalidade',
        confianca: 'consenso',
        fonte: 'nosso banco',
      },
    ],
  },
  {
    id: 'pauta',
    titulo: 'De onde sai a pauta: o método da demanda validada',
    icone: '🔎',
    resumo: 'Não inventa assunto. Pesquisa o que já estourou no nicho e refaz com a sua verdade.',
    itens: [
      {
        titulo: 'O problema que ele resolve',
        texto:
          'Com 21 peças por semana, o gargalo não é gravar: é ter sobre o que falar. Este método troca "pensar num assunto" por "achar um assunto que já provou que tem demanda".',
        confianca: 'consenso',
        fonte: 'Cast de Coragem (ref do dono)',
      },
      {
        titulo: '1. Pesquisa o termo do nicho no buscador do Instagram',
        texto:
          'Parte da dor real do público e joga a palavra no campo de busca. No exemplo dele, nicho de relacionamento, a dor mais comum é traição, então o termo pesquisado é "traição". Os nossos termos saem do eixo novo: vibe coding, criar site com IA, agente de IA, automação com n8n, ganhar dinheiro com IA, cobrar por site.',
        confianca: 'consenso',
        fonte: 'Cast de Coragem',
      },
      {
        titulo: '2. Filtra pelos de mais visualização',
        texto:
          'Ordena pelo que tem mais views e fica de preferência com o que passou de 1 milhão. O corte é alto de propósito: abaixo disso você não sabe se foi o assunto ou o tamanho da conta.',
        numero: 'acima de 1 milhão de views',
        confianca: 'consenso',
        fonte: 'Cast de Coragem',
      },
      {
        titulo: '3. Salva de 10 a 20 vídeos',
        texto:
          'Vira o seu banco de assuntos da semana. Aqui dentro isso encaixa direto no pipeline de referências que já existe: cada vídeo salvo vira uma referência com autor e link.',
        numero: '10 a 20 por rodada',
        confianca: 'consenso',
        fonte: 'Cast de Coragem',
      },
      {
        titulo: '4. Refaz o MESMO assunto com a sua verdade',
        texto:
          'Não copia o vídeo: refaz o assunto colocando a sua história, a sua experiência e a sua personalidade. É exatamente aqui que o método encontra o yap, porque o que você acrescenta é a parte que ninguém consegue reproduzir.',
        confianca: 'consenso',
        fonte: 'Cast de Coragem',
      },
      {
        titulo: 'Por que funciona, na explicação dele',
        texto:
          'O assunto já está validado pelo algoritmo. Ele entende que desse jeito, sobre esse assunto, as pessoas têm interesse, e distribui. Você sai na frente de quem está apostando num tema 100% novo e torcendo.',
        confianca: 'indicio',
        fonte: 'Cast de Coragem',
      },
      {
        titulo: 'O que eu tiraria daqui com ressalva',
        texto:
          'O método é ótimo pra achar assunto e péssimo se virar cópia de formato. A crítica que já está neste dossiê vale: quem imita a fórmula fica tão artificial quanto o que tentava combater. A regra segura é copiar o ASSUNTO e nunca o roteiro.',
        confianca: 'hipotese',
      },
    ],
  },
  {
    id: 'eixo',
    titulo: 'Sobre o que a gente vai falar',
    icone: '🧭',
    resumo: 'Ferramenta de vibe coding e construção de site, agente e sistema — pra quem quer ganhar dinheiro com isso.',
    itens: [
      {
        titulo: 'O eixo mudou: vibe coding, não programação',
        texto:
          'O peso sai de ensinar a programar e vai pras ferramentas de vibe coding. Isso muda quem é o interlocutor: não é quem quer virar dev, é quem quer construir sem ter virado dev.',
        confianca: 'consenso',
        fonte: 'decisão do dono, 20/08/2026',
      },
      {
        titulo: 'O que a pessoa quer construir',
        texto:
          'Site, agente e sistema. São coisas entregáveis, com começo e fim, que existem no mundo depois de prontas. Cada uma delas é uma família inteira de pauta.',
        confianca: 'consenso',
        fonte: 'decisão do dono',
      },
      {
        titulo: 'E o motivo é ganhar dinheiro',
        texto:
          'Não é hobby nem curiosidade: é quem quer faturar com isso. Isso muda o fim de todo vídeo. A pergunta que fecha a peça deixa de ser "entendeu?" e passa a ser "dá pra cobrar por isso, e quanto".',
        confianca: 'consenso',
        fonte: 'decisão do dono',
      },
      {
        titulo: 'A consequência prática na régua',
        texto:
          'Peça sobre ferramenta sem dizer o que dá pra vender com ela fica pela metade. Já temos essa régua no carrossel, com faixa de preço conferida; no yap ela fica mais fácil, porque o preço cabe numa frase falada.',
        confianca: 'hipotese',
        fonte: 'nossa régua de carrossel',
      },
      {
        titulo: 'O que isso descarta',
        texto:
          'Assunto de fundamento de programação (Git, CSS, JavaScript) sai do centro. No carrossel esse tipo de tema salva bem e traz pouco seguidor, 0,45 contra 0,91 por mil. Não é o público que a gente quer atrair agora.',
        numero: '0,45 vs 0,91 seg/1k',
        confianca: 'indicio',
        fonte: 'nosso banco',
      },
    ],
  },
  {
    id: 'gancho',
    titulo: 'O gancho: os 3 primeiros segundos',
    icone: '🪝',
    resumo: 'Texto grande na tela mais a fala dizendo a mesma coisa, porque quase ninguém liga o som.',
    itens: [
      {
        titulo: '70% da decisão acontece em 2 segundos',
        texto:
          'A decisão de continuar ou pular se resolve quase toda antes do segundo 2. Se metade some antes do 3, o vídeo praticamente não recebe distribuição.',
        numero: '70% decidem em 2s',
        confianca: 'indicio',
        fonte: 'Koko / Agenciagram',
      },
      {
        titulo: 'Escreva o gancho na tela, não só na boca',
        texto:
          'A maioria assiste sem som no autoplay. Os reels que estouram fazem as duas coisas ao mesmo tempo: manchete grande em texto nos 3 primeiros segundos e a narração repetindo a mesma frase.',
        numero: '85% assistem sem som no 1º autoplay',
        confianca: 'indicio',
        fonte: 'Koko',
      },
      {
        titulo: 'Tamanho do gancho',
        texto: 'Uma frase que cabe em 2 a 3 segundos de fala. Em português, isso dá 10 a 18 palavras.',
        numero: '10 a 18 palavras',
        confianca: 'consenso',
        fonte: 'Koko',
      },
      {
        titulo: 'As 5 famílias de gancho que mais seguram',
        texto:
          'Pergunta provocativa, choque numérico, paradoxo, promessa específica e confissão. Confissão é a que mais combina com yap, porque já entrega o relato pessoal que o formato pede.',
        confianca: 'indicio',
        fonte: 'Agenciagram / OpusClip',
      },
      {
        titulo: 'A régua que já usamos no carrossel vale aqui',
        texto:
          'Gancho não se inventa: puxa do que já deu comentário no nosso banco. A fórmula de maior comentário por mil é barreira cara derrubada mais posse na própria máquina. Traduzir isso pra fala é o atalho mais curto.',
        confianca: 'hipotese',
        fonte: 'nosso banco',
      },
    ],
  },
  {
    id: 'anatomia',
    titulo: 'A anatomia de um yap que fecha',
    icone: '🧱',
    resumo: 'Um ponto só, com a história que o originou e a sua posição escancarada.',
    itens: [
      {
        titulo: '1. Um ponto claro',
        texto:
          'Uma mensagem central por vídeo, e ela não precisa ser sofisticada. Yap que tenta entregar três ideias não entrega nenhuma.',
        confianca: 'consenso',
        fonte: 'Personal Brand Accelerator',
      },
      {
        titulo: '2. A história de onde veio',
        texto:
          'De qual experiência real essa ideia nasceu. É esse pedaço que não pode ser gerado por máquina e é ele que faz o vídeo parecer seu.',
        confianca: 'consenso',
        fonte: 'Personal Brand Accelerator',
      },
      {
        titulo: '3. Energia de quem se importa',
        texto:
          'Precisa importar de verdade com o assunto. O formato não tem edição pra esconder desinteresse: o desinteresse aparece na voz.',
        confianca: 'consenso',
        fonte: 'Personal Brand Accelerator',
      },
      {
        titulo: '4. Uma posição evidente',
        texto:
          'A reação alvo é "finalmente alguém disse isso". Você articula o que a audiência sente mas não consegue formular. Neutralidade não gera essa reação.',
        confianca: 'consenso',
        fonte: 'Personal Brand Accelerator',
      },
      {
        titulo: '5. Um pedido só no fim',
        texto:
          'Mesma regra que já vale no nosso carrossel: um CTA único. Os últimos 3 segundos merecem tanta atenção quanto os 3 primeiros.',
        confianca: 'indicio',
        fonte: 'OpusClip + nossa régua',
      },
    ],
  },
  {
    id: 'cta',
    titulo: 'O pedido no fim: o que o yap faz de diferente',
    icone: '🤝',
    resumo: 'A maioria pede no fim, mas quase ninguém chega lá. Em yap, o pedido que funciona é pedir opinião.',
    itens: [
      {
        titulo: 'O costume da casa',
        texto:
          'A maioria dos criadores guarda o pedido de seguir, comentar ou salvar pro fim do vídeo. Só que a análise de retenção mostra que pouquíssima gente ainda está assistindo naquele ponto: o pedido é feito pra uma sala quase vazia.',
        confianca: 'consenso',
        fonte: 'ShortsFaceless / FX Productions',
      },
      {
        titulo: 'Onde o pedido rende mais',
        texto:
          'Conteúdo educativo rende mais com o pedido no MEIO do vídeo; conteúdo de entretenimento e opinião rende mais com o pedido no fim. Yap de bastidor e de opinião está mais perto do segundo grupo.',
        confianca: 'indicio',
        fonte: 'ShortsFaceless',
      },
      {
        titulo: 'Pedido enlatado quebra o formato',
        texto:
          'O CTA não pode soar forçado: tem que parecer conversa entre amigos. Num formato cujo valor inteiro é parecer não produzido, a frase decorada de call to action é o que mais denuncia a produção.',
        confianca: 'consenso',
        fonte: 'Writer’s Life / PlayPlay',
      },
      {
        titulo: 'O pedido nativo do yap é pedir opinião',
        texto:
          'Em vez de pedir ação, você devolve a pergunta: "me diz se sou só eu que acho isso". Isso gera comentário sem soar vendedor, e comentário é exatamente a métrica que a nossa automação de DM usa.',
        confianca: 'hipotese',
        fonte: 'nossa leitura da pesquisa',
      },
      {
        titulo: 'Não corte o fim de propósito',
        texto:
          'Terminar incompleto pra forçar replay funciona uma vez. Depois o público desconfia do próximo post, e confiança é justamente o que esse formato existe pra construir.',
        confianca: 'consenso',
        fonte: 'faceless.so',
      },
      {
        titulo: 'A proporção que eu recomendo aqui',
        texto:
          'Em 21 peças por semana com objetivo de aquecer: 4 em cada 5 fecham no ponto, sem pedido, no máximo devolvendo a pergunta. A quinta carrega um pedido de verdade, e ele entra no MEIO do vídeo, não no fim.',
        numero: '1 pedido real a cada 5 peças',
        confianca: 'hipotese',
      },
    ],
  },
  {
    id: 'duracao',
    titulo: 'Duração e ritmo',
    icone: '⏱️',
    resumo: 'Porcentagem assistida importa mais que segundos: 30s inteiro ganha de 60s pela metade.',
    itens: [
      {
        titulo: 'A faixa de melhor conclusão',
        texto: 'De 21 a 34 segundos é onde a taxa de conclusão fica mais alta.',
        numero: '21 a 34s',
        confianca: 'indicio',
        fonte: 'OpusClip',
      },
      {
        titulo: 'Quando vale passar de 30s',
        texto:
          'De 31 a 60 segundos costuma gerar mais tempo total assistido e mais empurrão do algoritmo, mas só se a retenção ficar acima de 60%. Abaixo disso, o vídeo mais longo perde do curto.',
        numero: 'retenção > 60%',
        confianca: 'indicio',
        fonte: 'OpusClip',
      },
      {
        titulo: 'O termômetro do gancho',
        texto:
          'A retenção da abertura deveria passar de 70%. Se estiver abaixo, o problema não é o assunto nem a duração: é o gancho.',
        numero: 'intro > 70%',
        confianca: 'indicio',
        fonte: 'OpusClip',
      },
      {
        titulo: 'Quebra de padrão a cada 3 a 5 segundos',
        texto:
          'Um corte, uma palavra que aparece na tela, uma mudança de enquadramento. Sem isso o plano fixo vira estático e o público sai no meio, mesmo gostando do assunto.',
        numero: 'a cada 3 a 5s',
        confianca: 'indicio',
        fonte: 'OpusClip',
      },
      {
        titulo: 'A divergência que vale registrar',
        texto:
          'A referência do Cast de Coragem crava um teto diferente: 40 a 45 segundos no máximo. O raciocínio dele é o mesmo dos dados, só que puxado pra outro ponto: quem nunca te viu não tem motivo pra ficar até o fim de um vídeo de 2 minutos, e o algoritmo olha primeiro quantos chegaram até o final. As duas leituras concordam no que importa: vídeo longo só se justifica com retenção alta.',
        numero: '40 a 45s (ref) vs 21 a 34s (dados)',
        confianca: 'indicio',
        fonte: 'Cast de Coragem + OpusClip',
      },
      {
        titulo: 'As três métricas que ele acompanha',
        texto:
          'Taxa dos 3 primeiros segundos acima de 60%, taxa alta de salvamento e taxa alta de compartilhamento. Repare que comentário não está na lista dele: no reels a moeda é salvar e compartilhar, diferente do nosso carrossel, onde a meta é o comentário que dispara a DM.',
        numero: '3s > 60% · salvar e compartilhar altos',
        confianca: 'indicio',
        fonte: 'Cast de Coragem',
      },
      {
        titulo: 'E depois é repetir o que funcionou',
        texto:
          'Fechado o ciclo, o trabalho vira manutenção: continuar repetindo o que já provou que funciona, em vez de recomeçar do zero toda semana. É o mesmo loop de prever, medir e aprender que a gente já tenta fechar no carrossel.',
        confianca: 'consenso',
        fonte: 'Cast de Coragem',
      },
    ],
  },
  {
    id: 'producao',
    titulo: 'Como produzir em lote',
    icone: '🎬',
    resumo: 'Parece improviso, é intencional: escreve o ponto, grava longo, corta o melhor.',
    itens: [
      {
        titulo: 'O erro de leitura mais comum',
        texto:
          'Achar que quem faz bem está improvisando. Não está: está sendo intencional. O improviso é o acabamento, não o método.',
        confianca: 'consenso',
        fonte: 'Personal Brand Accelerator',
      },
      {
        titulo: 'O teste do "e daí?"',
        texto:
          'Se você não consegue responder "e daí?" antes de ligar a câmera, o vídeo não existe ainda. Esse é o filtro que separa volume de lixo.',
        confianca: 'consenso',
        fonte: 'Personal Brand Accelerator',
      },
      {
        titulo: 'Grave longo, entregue curto',
        texto:
          'Grava 5 a 10 minutos falando solto sobre o ponto e depois extrai os melhores 60 segundos. Sai mais natural do que tentar acertar em 30 segundos de primeira.',
        numero: '5 a 10 min gravados por vídeo',
        confianca: 'consenso',
        fonte: 'Personal Brand Accelerator',
      },
      {
        titulo: 'Sessão de lote',
        texto:
          'Dá pra gravar de 5 a 10 vídeos numa sessão de 1 hora. É assim que o volume alto deixa de ser fantasia.',
        numero: '5 a 10 vídeos por hora',
        confianca: 'indicio',
        fonte: 'Merra',
      },
      {
        titulo: 'O caderno de pautas',
        texto:
          'Anotar durante a semana os momentos, as reações e as conversas que te irritaram ou surpreenderam. A pauta do yap não se inventa na hora de gravar: ela se coleta.',
        confianca: 'consenso',
        fonte: 'Personal Brand Accelerator',
      },
    ],
  },
  {
    id: 'volume',
    titulo: 'O alerta sobre 40 e 100 por semana',
    icone: '🚨',
    resumo: 'Volume ajuda, mas 40/semana é 6 por dia e a literatura toda para em 3 a 4 por dia.',
    itens: [
      {
        titulo: 'A conta',
        texto:
          '40 por semana são cerca de 6 por dia. 100 por semana são cerca de 14 por dia. É bom ter os dois números na cara antes de decidir.',
        numero: '40/sem = 5,7/dia · 100/sem = 14,3/dia',
        confianca: 'consenso',
      },
      {
        titulo: 'O argumento a favor do volume',
        texto:
          'Cada vídeo é uma chance nova do algoritmo te pegar. Formato curto é de alta frequência: mais peças, mais sinais, mais distribuição. A faixa citada como saudável pra crescer é 1 a 3 por dia por plataforma.',
        numero: '1 a 3 por dia por plataforma',
        confianca: 'indicio',
        fonte: 'LTX / Influencers-time',
      },
      {
        titulo: 'O teto que aparece em toda fonte',
        texto:
          'Não existe limite oficial de reels por dia, mas publicar muitos em sequência curta é lido como spam e derruba distribuição. A recomendação corrente é não passar de 3 a 4 por dia.',
        numero: 'teto sugerido: 3 a 4/dia',
        confianca: 'consenso',
        fonte: 'SocialChamp / Metricool',
      },
      {
        titulo: 'Distribuição bate quantidade',
        texto:
          'Postar 10 num dia e sumir por uma semana performa pior do que 1 a 2 por dia constantes. Se formos de volume, ele precisa ser espalhado no dia e nos dias, não empilhado.',
        confianca: 'indicio',
        fonte: 'LTX',
      },
      {
        titulo: 'O caso que mais dói',
        texto:
          'Criadora postando 7 por semana estagnou e queimou. Caiu pra 5 por semana investindo em gancho e edição: as views médias por reels subiram 40% e a taxa de crescimento de seguidores dobrou em 6 semanas.',
        numero: '+40% de views médias ao CORTAR volume',
        confianca: 'indicio',
        fonte: 'Kometmedia',
      },
      {
        titulo: 'Conteúdo repetido demais é sinalizado',
        texto:
          'Publicar peças muito parecidas em série pode ser marcado como comportamento repetitivo. Volume alto com pauta rasa aumenta esse risco, não só o risco de cansar o público.',
        confianca: 'indicio',
        fonte: 'Spikerz / SocialChamp',
      },
      {
        titulo: 'A escada que eu recomendo',
        texto:
          'Começar em 3 por dia, ou seja 21 por semana, medindo retenção de 3 segundos por duas semanas. Só sobe pra 40 se a retenção não cair. Pra passar de 40 sem virar spam, o caminho é distribuir a mesma peça em TikTok e Shorts, não empilhar mais no Instagram.',
        numero: 'começar em 21/semana, subir por medição',
        confianca: 'hipotese',
      },
    ],
  },
];

export const YAP_FONTES: Fonte[] = [
  { label: 'Digivizer — a estratégia por trás do talk-to-camera', url: 'https://digivizer.com/blog/the-art-of-yapping-the-strategy-behind-talk-to-camera-video-content/' },
  { label: 'Personal Brand Accelerator — the rise of yapping', url: 'https://personalbrandaccelerator.com/blog/the-rise-of-yapping-and-how-to-do-it-well' },
  { label: 'Rachel Havekost — yap content is taking over', url: 'https://rachelhavekost.substack.com/p/yap-content-is-taking-over-social' },
  { label: 'Manychat — tendências do Instagram em 2026', url: 'https://manychat.com/blog/instagram-trends-for-creators-2026/' },
  { label: 'OpusClip — duração e retenção com dados', url: 'https://www.opus.pro/blog/ideal-youtube-shorts-length-format-retention' },
  { label: 'Koko — 30 ganchos que seguram nos 3 primeiros segundos', url: 'https://koko.ag/blog/hooks-aberturas-reels/' },
  { label: 'Kometmedia — quantos reels por semana', url: 'https://www.kometmedia.com/blogs/how-many-reels-should-you-post-per-week-to-see-growth' },
  { label: 'SocialChamp — limites do Instagram em 2026', url: 'https://www.socialchamp.com/blog/instagram-limits/' },
  { label: 'quso.ai — funil de Reels e Shorts', url: 'https://quso.ai/blog/youtube-shorts-and-reels-funnel-strategy-for-coaching-businesses-in-2026' },
  { label: 'ShortsFaceless — CTAs que realmente engajam', url: 'https://www.shortsfaceless.com/blog/7-ctas-that-actually-make-viewers-engage' },
  { label: 'faceless.so — roteiro de vídeo curto e retenção', url: 'https://faceless.so/blog/short-form-video-script-the-retention-guide' },
  { label: 'Cast de Coragem — o método de pauta validada (ref do dono)', url: 'https://www.instagram.com/reel/DcJhZ2LBKPQ/' },
];

/** Data em que a pesquisa foi consolidada, mostrada no rodapé do dossiê. */
export const YAP_PESQUISA_EM = '20/08/2026';
