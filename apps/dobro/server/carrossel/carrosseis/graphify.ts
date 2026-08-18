/**
 * apps/dobro — carrossel "Graphify: o plano de $20 rendendo como o de $200".
 *
 * ORIGEM: a referência @kyle.disruptor (10.659 comentários / 12.360 curtidas), o
 * post com mais comentários de todo o nosso banco. ESTE é o tema dela.
 *
 * O ERRO QUE ISSO CORRIGE (12/08/2026): o rascunho que o pipeline gerou dessa
 * referência virou "CLAUDE.md: a memória do Claude Code", e não é isso que o
 * reels apresenta. O gerador só teve a LEGENDA ("your AI doesn't need to reread
 * your codebase every session") e deduziu CLAUDE.md a partir dela. O reels fala
 * do GRAPHIFY, com "70X YOUR TOKENS" escrito na tela e o locutor abrindo em
 * "torne $20 em um plano de $250". Sem ler a tela e ouvir a fala, o tema sai
 * errado (ver memória gancho-do-reels-nao-e-a-legenda).
 *
 * PRECISÃO (Article IV) — conferido em 12/08/2026 no repo oficial
 * github.com/Graphify-Labs/graphify (o antigo safishamsi/graphify redireciona):
 *   · invocação: `/graphify .` dentro do agente;
 *   · instalação (VERBATIM do README do branch PADRÃO v8):
 *       uv tool install graphifyy      # (ou: pipx install graphifyy)
 *       graphify install
 *     ⚠️ ARMADILHA DE BRANCH: o branch padrão do repo é `v8`, NÃO `main`. A URL
 *     raw.githubusercontent.com/.../main/README.md responde HTTP 200 com um README
 *     parado em 14/05/2026, e é ele que manda `pip install graphifyy`. A doc ATUAL
 *     pede pra EVITAR pip no Windows e no Mac (dá ModuleNotFoundError, porque a
 *     skill resolve o Python em graphify-out/.graphify_python). Confira o
 *     `default_branch` pela API do GitHub antes de ler qualquer raw.
 *   · requisitos declarados (v8): Python 3.10+, com uv recomendado e pipx como
 *     alternativa. Claude Code deixou de ser pré-requisito: são 20+ assistentes;
 *   · o pacote no PyPI é `graphifyy` (com dois "y") e o CLI é `graphify`;
 *   · "Code is parsed locally with tree-sitter AST: deterministic, no LLM,
 *     nothing leaves your machine" — vale pro CÓDIGO. Docs, PDF e imagem passam
 *     pelo modelo, e o aviso honesto diz isso;
 *   · "Graph build LLM credits: 0 per-token for most systems";
 *   · 105.5k estrelas (API do GitHub: 105.547);
 *   · licença Apache-2.0. NÃO é dual: o NOTICE diz que a MIT cobre só as
 *     contribuições anteriores ao relicenciamento, e a API reporta um único
 *     spdx_id Apache-2.0;
 *   · ~40 linguagens via tree-sitter, 20+ agentes (Claude Code, Codex, Cursor,
 *     Gemini CLI, Copilot CLI, Antigravity e outros);
 *   · limitação declarada: o HTML do grafo fica impraticável acima de ~5000 nós.
 *
 * O NÚMERO DA ECONOMIA É OFICIAL (corrigido em 12/08/2026 pelo revisor). O 71,5x
 * está em docs/how-it-works.md do branch padrão: "On a mixed corpus (Karpathy
 * repos + 5 papers + 4 images, 52 files): 71.5x fewer tokens per query vs reading
 * the raw files directly". A mesma página publica o contra-exemplo, httpx com 6
 * arquivos dando ~1x, e o repo guarda os artefatos em worked/karpathy-repos/.
 * A versão anterior deste arquivo dizia que o número era de terceiro, e estava
 * errada.
 * MESMO ASSIM o multiplicador não entra em slide, e agora por decisão EDITORIAL,
 * não factual: o mecanismo (consultar um mapa pronto em vez de reler os arquivos)
 * vende melhor que o número, e número grande em slide é o que todo perfil faz. Se
 * o dono quiser usar, é atribuível e o aviso honesto já tem o par (52 arquivos
 * dando 71,5x contra 6 arquivos dando ~1x).
 *
 * PREÇOS conferidos em 12/08/2026: Claude Pro $20, Max $100 e $200. O reels diz
 * $250, que não é um plano que existe. Se a Anthropic mexer nos planos, a capa
 * precisa ser refeita. É exceção consciente à regra de não pôr preço em slide:
 * aqui o preço É o gancho.
 *
 * SEM TRAVESSÃO em nenhum texto de conteúdo.
 *
 * CAPA: pronta (arte do dono, 12/08/2026). O conceito saiu do MÉTODO da casa, que
 * é olhar as capas das REFERÊNCIAS que estão indo bem e criar a partir delas, e
 * não a partir do nosso assunto. A campeã (@kyle.disruptor) é ele sentado no topo
 * de uma montanha de moedas douradas com "70X YOUR TOKENS"; a nossa é o macaco de
 * smoking no mesmo enquadramento, com moedas gravadas com o asterisco e a nota de
 * $20 na mão. A 1ª tentativa foi um print de editor com o arquivo aberto, ou seja,
 * o assunto literal, e o dono cortou: capa de assunto literal não para scroll.
 */
import type { Carrossel } from '../types';

export const graphify: Carrossel = {
  slug: 'graphify',
  // O título do card é o MESMO texto da capa (decisão do dono, 12/08/2026), sem
  // as quebras de linha e sem o destaque. Ele é a chave de idempotência do
  // render: mudar aqui sem renomear o card antes cria um card novo e o antigo
  // fica órfão, levando junto a data e o estado que estavam na tela.
  titulo: 'Um comando faz o plano de $20 do Claude render como o de $200',
  gancho: 'Um comando faz o plano de $20 do Claude render como o de $200.',
  dataProgramada: '2026-08-12',
  refsLinks:
    'https://www.instagram.com/reel/DagrcRcnFll/ (referência campeã: @kyle.disruptor, 10.659 comentários, "70X YOUR TOKENS")\n' +
    'https://github.com/Graphify-Labs/graphify (fonte primária, lida em 12/08/2026; safishamsi/graphify redireciona pra cá)',
  /**
   * Presente do "comenta GRAFO" (Notion, 12/08/2026). Traz a instalação com os
   * três caminhos (uv, pipx e o aviso de evitar pip no Windows e no Mac), a nota
   * do PowerShell, as três perguntas que valem fazer depois do mapa pronto
   * (`path`, `explain`, `query`), como manter o mapa vivo e o aviso honesto com a
   * tabela 52 arquivos / 6 arquivos que o próprio projeto publica.
   *
   * SEM captação pra Semana e sem o GIF da landing, pela decisão de 12/08/2026 de
   * tirar o evento do CTA. É a única página de presente da casa que não fecha com
   * o convite; se a decisão mudar, é aqui que entra de volta.
   */
  linkPresente: 'https://app.notion.com/p/3ba6dd01fb488149b3cdfbf82dbc8a80',
  /**
   * Capa (imagem do dono, 12/08/2026): o macaco de smoking e óculos escuros no
   * topo de uma montanha de moedas douradas gravadas com o asterisco, segurando
   * uma nota de $20, num galpão industrial com luz vinda de cima. É o
   * enquadramento da capa campeã do @kyle.disruptor (ele no topo da pilha de
   * moedas "AI" com "70X YOUR TOKENS"), com o personagem da casa no lugar dele.
   * Já vem em 4:5 (1122×1402) e com o terço de baixo em preto chapado, então
   * `scrim: 'bloco'` basta: a rampa longa padrão subiria por cima das moedas.
   */
  bgImage: 'server/carrossel/assets/graphify/capa.png',
  slides: [
    {
      variant: 'photo',
      cover: true,
      scrim: 'bloco',
      baixo: true,
      tituloMenor: true,
      tituloEscala: 1.05,
      // O gancho da referência campeã, que está no texto da TELA do reels e na
      // fala do locutor, não na legenda.
      titulo: 'Um comando faz o plano\nde **$20** do Claude\nrender como o de $200',
      // Subtítulo de TENSÃO, não de informação (decisão do dono, 12/08/2026). A
      // 1ª versão dizia "e o seu código não sai do seu computador": é o melhor
      // argumento do post, mas argumento não para o dedo de ninguém. Privacidade
      // é assunto do aviso honesto, e na capa ela roubava o lugar do conflito, que é o
      // que a referência campeã usa pra prender.
      subtitulo: 'A Anthropic tá LOUCA com isso',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      eyebrow: 'Onde o seu limite queima',
      // Regra 2 do Fura a Bolha: confirmar a promessa da capa mostrando ONDE o
      // dinheiro vai embora hoje.
      titulo: 'Ele **relê** o seu projeto\ntoda vez',
      // Corpo curto e com destaque na frase que importa: bloco corrido de texto
      // cansa e a pessoa desliza embora (regra da casa, 12/08/2026).
      corpo:
        'Você pede uma alteração pequena. Antes da primeira linha, ele abre arquivo atrás de arquivo pra descobrir onde as coisas estão. **Em projeto grande, é isso que come o seu limite**, não o trabalho em si.',
      terminal: [
        '→ procurando onde essa função é usada',
        '→ abrindo 40 arquivos pra descobrir',
        '→ mesma busca na sessão de amanhã',
        '✗ você paga a redescoberta toda vez',
      ],
    },
    {
      variant: 'light',
      eyebrow: 'A solução',
      titulo: 'Um **mapa** do projeto,\nfeito uma vez',
      // Explicação curta do que ele RESOLVE, e só. O comando de instalação saiu
      // daqui em 12/08/2026 e vive no slide "salva esse post": mostrar instalação
      // antes de a pessoa entender o problema é pedir pra ela deslizar embora.
      corpo:
        'O Graphify lê o projeto **uma vez** e monta um mapa: qual arquivo importa qual, qual função chama qual. Depois o agente **consulta o mapa** em vez de abrir arquivo por arquivo.',
      // O print PROVA o que o texto diz: é open source, está no GitHub e passou
      // de 100 mil estrelas. Capturado em 12/08/2026 com capturar-print.cjs.
      imagem: 'server/carrossel/assets/graphify/repo.png',
    },
    // REMOVIDO em 12/08/2026 (decisão do dono): havia aqui um slide roxo "O seu
    // código não sai daqui", sobre o grafo ser montado localmente. Ficou difícil
    // de entender: no meio do carrossel a pessoa ainda não tem o modelo mental de
    // onde o processamento acontece, então "não sai daqui" não tinha "daqui"
    // definido. A informação não se perdeu, continua no aviso honesto, onde
    // aparece junto do contraste que a torna legível (código local, doc e PDF
    // pelo modelo).
    {
      variant: 'dark',
      eyebrow: 'Não é só código',
      titulo: 'Ele mapeia o **projeto inteiro**',
      itens: [
        { icone: 'code', titulo: 'Código', sub: 'Cerca de 40 linguagens, do Python ao Rust, lidas pela estrutura real' },
        { icone: 'bookmark', titulo: 'Documentação e PDF', sub: 'O que está escrito entra no mesmo mapa que o código' },
        // "config", não "infraestrutura": .sql, MCP config e manifest de pacote
        // saem de fábrica, mas Terraform/HCL exige o extra graphifyy[terraform],
        // e o slide não declara pré-requisito.
        { icone: 'layers', titulo: 'Schema de banco e config', sub: 'A tabela e a config ficam ligadas ao código que usa elas' },
      ],
    },
    {
      // Slide que EXPLICA o grafo (pedido do dono, 12/08/2026). Antes o carrossel
      // usava a palavra "grafo" e "mapa" sem nunca mostrar o que isso é, e ia
      // direto pro comando de instalação. A imagem é o print do próprio Graphify
      // respondendo `graphify path`: os pontos, as ligações rotuladas e o
      // "3 hops. Zero files opened." embaixo, que é a prova do benefício.
      variant: 'dark',
      eyebrow: 'Mas o que é um grafo',
      titulo: 'São **pontos e ligações**',
      corpo:
        'Cada ponto é um pedaço do seu projeto. Cada linha diz **como um chega no outro**. Aí "o que liga isso àquilo" vira um caminho de três saltos, **sem abrir arquivo nenhum**.',
      // grafo-full.png é o RECORTE do grafo (650×420) tirado do print original
      // grafo.png (1055×432, que traz o terminal do lado esquerdo). Refazer com:
      //   ffmpeg -i grafo.png -vf "crop=650:420:402:6" grafo-full.png
      //
      // POR QUE RECORTAR E NÃO ACOLCHOAR: a janelinha do template recorta no
      // estilo `cover`, e o print inteiro é bem mais largo que ela. Acolchoando
      // pra caber, tudo encolhe e o texto do terminal fica ilegível no celular,
      // que é onde o post é lido. O recorte perde o "3 hops. Zero files opened.",
      // mas essa informação já está no corpo do slide, em português, que serve
      // melhor ao nosso público. O caminho de três saltos continua visível no
      // grafo, que é o que o slide precisa provar.
      imagem: 'server/carrossel/assets/graphify/grafo-full.png',
    },
    {
      variant: 'light',
      // "Salva esse post pra fazer depois" no lugar de "Salva esse slide"
      // (decisão do dono, 12/08/2026). O pedido é mais honesto com o que a pessoa
      // realmente faz: instalar exige o computador na frente, então o post é
      // guardado pra hora de sentar e rodar, não pra reler o slide.
      eyebrow: 'Salva esse post pra fazer depois',
      // "Passos", não "comandos": a instalação virou duas linhas depois da
      // correção, e o slide passaria a contar errado o que está na tela.
      titulo: 'Os **dois passos**',
      // VERBATIM do README do branch PADRÃO (v8), lido em 12/08/2026.
      // Este slide já errou DUAS vezes: primeiro com um comando tirado de resumo
      // de terceiro, depois com `pip install` lido do README de `main`, que está
      // parado desde 14/05/2026. Ver o aviso sobre branch no cabeçalho.
      terminal: [
        '# 1. instala (pede Python 3.10+)',
        '$ uv tool install graphifyy',
        '$ graphify install',
        '# 2. no Claude Code, na pasta do projeto',
        '/graphify .',
      ],
      corpo:
        'O pacote é **graphifyy**, com dois "y", mas o comando que você digita é graphify. Não usa uv? Troque por **pipx install graphifyy**. A doc pede pra **evitar o pip** no Windows e no Mac.',
    },
    {
      variant: 'dark',
      topIcon: 'puzzle',
      eyebrow: 'Não é só pro Claude',
      titulo: 'Funciona em **20+ agentes**',
      corpo:
        'Claude Code, Codex, Cursor, Gemini CLI, Copilot CLI e outros. Skill aberta, Apache-2.0, com **mais de 100 mil estrelas** no GitHub. O mapa que você montar hoje **continua servindo** se trocar de ferramenta amanhã.',
    },
    {
      variant: 'light',
      eyebrow: 'Aviso honesto',
      titulo: 'O quanto economiza\n**depende do projeto**',
      // A 1ª linha é o que sobrou do slide de privacidade removido em 12/08/2026.
      // Sem ela, "doc, PDF e imagem passam pelo modelo" ficava sozinha e convidava
      // à leitura oposta, de que o código também passa. O melhor argumento do
      // projeto tem que estar em ALGUM slide, não só na legenda.
      terminal: [
        '✓ o código é lido na sua máquina',
        '✓ projeto grande, ganho grande',
        '✗ projeto de 6 arquivos, cerca de 1x',
        '✗ doc, PDF e imagem passam pelo modelo',
        '✗ acima de 5000 nós, o HTML trava',
      ],
      corpo:
        'E quem diz isso é a doc do **próprio Graphify**: em projeto pequeno o ganho some, porque ele já cabe no contexto. Parte das ligações do mapa também é **dedução** da ferramenta, e vem marcada como tal.',
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o passo a passo\ndo Graphify?',
      // Uma palavra só, como a referência campeã ("REPO").
      botao: 'Comenta GRAFO 👇',
      // SEM captação pra Semana (decisão do dono, 12/08/2026, valendo daqui pra
      // frente). O CTA entrega só o que é do próprio post. A hipótese das TRÊS
      // entregas, em que a Semana era a terceira, sai de teste junto.
      corpo:
        'Te mando o passo a passo pra instalar e rodar no seu projeto, e as perguntas que valem fazer depois que o mapa fica pronto.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  legenda:
    'Comenta GRAFO que eu te mando o passo a passo. 🗺️\n\n' +
    'Antes de assinar o plano caro do Claude, olha onde o seu limite está queimando. O agente relê o seu projeto ' +
    'toda vez que você abre ele, e em projeto grande é isso que come a maior parte do que você paga.\n\n' +
    'O Graphify monta um mapa do projeto uma vez, e depois o agente consulta esse mapa em vez de abrir arquivo por ' +
    'arquivo. O código é lido na sua máquina, sem sair dela.\n\n' +
    'Comenta GRAFO que eu te mando o passo a passo pra instalar e rodar no seu projeto, e as perguntas que valem ' +
    'fazer depois que o mapa fica pronto.',
  hashtags:
    'claudecode programacao devbr iaparadevs ferramentasdev inteligenciaartificial opensource aitools devemdobro vibecoding',
  ctaFinal:
    'Comenta GRAFO que eu te mando o passo a passo do Graphify e as perguntas que valem fazer depois que o mapa ' +
    'fica pronto.',
  briefing:
    'FÓRMULA: a referência @kyle.disruptor (10.659 comentários / 12.360 curtidas), o post com mais comentários do ' +
    'nosso banco inteiro. Ela guarda o artefato atrás do comentário e usa CTA de uma palavra só ("REPO").\n\n' +
    'ESTE É O TEMA CERTO DELA. O rascunho que o pipeline gerou virou "CLAUDE.md", porque o gerador só recebeu a ' +
    'legenda e deduziu o assunto a partir dela. O reels apresenta o GRAPHIFY, tem "70X YOUR TOKENS" escrito na ' +
    'tela e o locutor abre em "torne $20 em um plano de $250". Regra que fica: em reels, o tema e o gancho estão ' +
    'no texto da tela e na fala, nunca na legenda.\n\n' +
    'GANCHO: dinheiro mais conflito, que é o par que a referência usa. O título traz o dinheiro (plano barato ' +
    'rendendo como o caro) e o subtítulo traz a tensão ("A Anthropic tá LOUCA com isso"), no espírito da fala do ' +
    'locutor. $250 virou $200, que é o plano Max que existe.\n\n' +
    'SOBRE O SUBTÍTULO (decisão do dono, 12/08/2026): é hipérbole de rede social, não notícia, e a casa assume ' +
    'isso. A ressalva registrada é que a Anthropic não se manifestou sobre o Graphify e distribui skills desse ' +
    'tipo, então se alguém cobrar nos comentários, a resposta honesta é que a frase é força de expressão e o ' +
    'argumento real está nos slides. A 1ª versão do subtítulo era "e o seu código não sai do seu computador", ' +
    'trocada porque argumento não para o dedo.\n\n' +
    'O NÚMERO NÃO ENTRA EM SLIDE, por decisão EDITORIAL: o 71,5x É oficial (docs/how-it-works.md do branch padrão), ' +
    'então dava pra usar. Ficamos com o mecanismo porque multiplicador grande na tela é o que todo perfil faz, e o ' +
    'que diferencia a gente é o aviso honesto trazer o contra-exemplo que o próprio projeto publica: 52 arquivos rendem ' +
    '71,5x, 6 arquivos rendem cerca de 1x. Se for pra usar o número, use com o par, nunca sozinho.\n\n' +
    'REVISÃO DE FATO (12/08/2026, agente revisor-carrossel): o carrossel reprovou na primeira passada com 3 erros ' +
    'bloqueantes. O comando de instalação estava lido do README de `main`, que está parado há 3 meses, enquanto o ' +
    'branch padrão é `v8`. A licença virou Apache-2.0 (a MIT cobre só contribuições anteriores ao relicenciamento), ' +
    'a lista do que passa pelo modelo ganhou "imagem", e o aviso honesto ganhou o teto de 5000 nós. Nenhum carrossel ' +
    'com comando vai pro ar sem passar por esse agente.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): dinheiro, o plano de $20 rendendo como o de $200.\n' +
    'Regra 2 (o slide 2 confirma): onde o limite queima, com o terminal mostrando a redescoberta que se repete.\n' +
    'Regra 3 (slide sozinho): uma ideia por slide, o mapa, o local, o que mapeia, os comandos, os agentes, o aviso.\n' +
    'Regra 4 (salvável): o slide dos dois passos, com o pedido mudado pra "salva esse post pra fazer depois". ' +
    'Instalar exige o computador na frente, então o que a pessoa guarda é o POST pra hora de sentar e rodar, e não ' +
    'o slide pra reler. O slide chegou a ser removido em 12/08/2026, pra empurrar todo mundo pro comentário como a ' +
    'referência campeã faz, e voltou: entregar o comando não impede o CTA, porque o presente promete o passo a ' +
    'passo completo e as perguntas que valem fazer depois do mapa pronto.\n' +
    'Regra 5 (CTA único): comenta GRAFO.\n\n' +
    'PRIVACIDADE: em 12/08/2026 ela tinha slide próprio ("o seu código não sai daqui"), removido pelo dono por ' +
    'ficar difícil de entender no meio do carrossel, onde a pessoa ainda não sabe onde o processamento acontece. ' +
    'Ela vive agora no aviso honesto, junto do contraste que a torna legível: código local, doc e PDF pelo modelo. ' +
    'Continua sendo um diferencial contra os outros posts da ferramenta, que só falam de economia, e num próximo ' +
    'carrossel vale testar como GANCHO, não como slide do meio.\n\n' +
    'PRESENTE: pronto (Notion, em linkPresente). O carrossel entrega os dois comandos no slide "salva esse post", e ' +
    'o presente entrega o que não cabe em slide: os três caminhos de instalação com o aviso do pip, a nota do ' +
    'PowerShell e, principalmente, as TRÊS perguntas que valem fazer depois que o mapa fica pronto (path, explain e ' +
    'query), que é a parte que quase ninguém sabe usar. Fecha com o aviso honesto e a tabela 52 arquivos contra 6 ' +
    'arquivos, publicada pelo próprio projeto.\n' +
    'SEM captação pra Semana e sem o GIF da landing, pela decisão de 12/08/2026. É a primeira página de presente da ' +
    'casa sem o convite: se a decisão mudar, é lá que ele volta.',
};
