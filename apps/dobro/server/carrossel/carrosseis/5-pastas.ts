/**
 * apps/dobro — carrossel "as 5 pastas de ferramentas que todo dev precisa".
 *
 * Origem: referência ed074e61 (@cindiezhu, 781 curtidas e 513 comentários),
 * capturada pelo Telegram e lida slide a slide em 07/08/2026. O que fez aquele
 * post render NÃO foi a lista de ferramentas: foi a ORGANIZAÇÃO em 5 pastas
 * nomeadas mais a frase que tira a paralisia ("you don't need all of them, pick
 * the folder that hurts most today"). É essa estrutura que estamos pegando.
 *
 * NOMES E ORDEM (11/08/2026, decisão do dono): as pastas são PENSAR, CRIAR,
 * DOCUMENTAR, PUBLICAR e CRESCER, nesta ordem. Português porque o post é para
 * quem está começando, e a palavra tem de ser entendida na primeira leitura, sem
 * traduzir. Pensar vem antes de Criar porque é a ordem real do trabalho: a ideia
 * bagunçada vira plano, e só então vira código. (A versão de 10/08 usava os nomes
 * em inglês da referência, Build/Think/Ship/Grow, com Build na frente.)
 *
 * A estrutura de camadas e a frase que tira a paralisia continuam sendo o que
 * pegamos da referência; os nomes são nossos.
 *
 * As CORES dos slides não seguiram o conteúdo na troca: o ritmo claro/roxo é do
 * padrão da casa (ver memória carrossel-estilo-jarvis) e vale por posição, não
 * por pasta. Por isso Pensar herdou o slide claro e Criar o roxo, e o título de
 * quem cai no roxo perde o realce ** (some no fundo lilás).
 *
 * Precisão (Article IV): o que cada ferramenta faz, sem número e sem preço,
 * porque preço muda. Conferido em 10/08/2026:
 *   Antigravity CLI: CLI em Go do Google que substituiu o Gemini CLI; Antigravity
 *     está em preview público e sem custo para pessoa física. Por isso ela entra
 *     como "a IA grátis" e o Claude Code como "a IA paga".
 *   Spec Kit: toolkit open source do GitHub para Spec-Driven Development, em que
 *     a especificação guia o agente até o código.
 *   Context7: MCP que injeta no agente a documentação da versão da biblioteca que
 *     o projeto usa.
 *   DeepWiki: da Cognition; troca github.com por deepwiki.com e o repositório
 *     público vira wiki navegável com diagramas, de graça e sem login.
 *   Simplify: extensão que preenche candidatura em Workday, Greenhouse, Lever e
 *     Ashby e guarda o histórico, com camada grátis. NÃO é auto-apply: você ainda
 *     clica em enviar, e o slide não promete isso.
 *   dev.to entrou no lugar do Hashnode: o Hashnode tirou do grátis o domínio
 *     próprio e está sem atualização pública há mais de um ano.
 * O slide 8 diz onde o dinheiro aparece (Claude Code, e o plano que passa do
 * grátis em Supabase, Neon, Vercel, Sentry e PostHog) em vez de vender tudo como
 * gratuito. SEM travessão.
 *
 * CAPA (11/08/2026, 2ª versão): pixel art com as 5 pastas em cima, na mesma
 * ordem dos slides, e a casa em obra embaixo. A 1ª versão trazia Criar antes de
 * Pensar e está guardada em assets/5-pastas/capa-v1-ordem-antiga.png.
 * A arte é clara e tem o rodapé vazio de propósito, então a capa usa
 * `scrim: 'claro'`: sem preto por cima, texto escuro. O escurecido padrão comia
 * a casa até a metade e deixava uma faixa cinza sobre o creme.
 *
 * PRESENTE: a página do Notion em `linkPresente` já está com estas cinco pastas,
 * as mesmas ferramentas dos slides e a tabela de diagnóstico do slide 8
 * (conferida em 11/08/2026). Ela fecha com o convite pra Semana; se a data do
 * evento mudar, é lá que precisa mudar junto.
 */
import type { Carrossel } from '../types';

export const cincoPastas: Carrossel = {
  slug: '5-pastas',
  titulo: 'As 5 pastas de ferramentas que todo dev precisa',
  gancho: '5 pastas pra construir qualquer projeto com IA.',
  dataProgramada: '2026-08-16',
  refsLinks: 'https://www.instagram.com/p/Dbeuq_ACSbO/ (referência: @cindiezhu)',
  /** Presente do "comenta PASTA": o mapa das 5 pastas (Notion, 07/08/2026). */
  linkPresente: 'https://app.notion.com/p/3b56dd01fb48813185c4e7178872e894',
  /**
   * Capa (11/08/2026, 2ª versão): pixel art com as 5 pastas coloridas em cima, na
   * ordem dos slides, e a casa em construção com o anão embaixo. Segue o padrão
   * das capas campeãs, o objeto em tela cheia com o texto no rodapé (ver memória
   * capas-carrossel-padrao).
   */
  bgImage: 'server/carrossel/assets/5-pastas/capa.png',
  slides: [
    {
      variant: 'photo',
      cover: true,
      tituloMenor: true,
      // Texto branco com o realce roxo, como nas outras capas, mas o escurecido
      // vira uma FAIXA atrás do título em vez da rampa longa: a padrão subia até
      // a metade do slide e deixava um véu cinza por cima da casa.
      scrim: 'bloco',
      // O desenho vai quase até o rodapé, então o bloco de texto desce mais.
      baixo: true,
      bgPos: 'center top',
      // Título maior, pra o dedo parar nele. O teto é 1.10: em 1.15 a linha
      // "5 pastas pra construir" estoura a largura e quebra sozinha em quatro
      // linhas, e aí a primeira sobe pra fora da faixa escura.
      tituloEscala: 1.1,
      titulo: '5 pastas pra construir\n**qualquer projeto**\ncom IA',
      // Sem subtítulo: "você só vai abrir uma hoje" não se explica sozinha na
      // capa. A ideia é do slide 8, onde há o diagnóstico pra sustentar ela.
      // Sem `swipe` também: a seta do canto competia com o título e a barra de
      // progresso embaixo já diz que o post continua.
    },
    {
      variant: 'dark',
      topIcon: 'loop',
      eyebrow: 'Pra que serve',
      titulo: 'A mesma estrutura\nserve pros **dois**',
      corpo:
        'Você tem quarenta abas salvas e nenhum projeto no ar. O que falta não é ferramenta, é uma ordem pra usar as que você já conhece.',
      itens: [
        { icone: 'puzzle', titulo: 'Estudar programação', sub: 'Cada pasta é uma etapa do que você precisa aprender a fazer sozinho' },
        { icone: 'laptop', titulo: 'Criar projeto profissional', sub: 'Com as cinco na mão, dá pra sair da ideia e botar no ar em poucas horas' },
      ],
    },
    {
      variant: 'light',
      denso: true,
      eyebrow: 'Pasta 01',
      titulo: '**Pensar**',
      corpo: 'Antes de codar. É onde a ideia bagunçada vira um plano que cabe numa semana.',
      itens: [
        { icone: 'ai', titulo: 'Claude', sub: 'Decidir caminho, discutir arquitetura e achar o furo do seu plano' },
        { icone: 'robot', titulo: 'Manus', sub: 'Agente que faz a pesquisa e as tarefas de vários passos por você' },
        { icone: 'map', titulo: 'Obsidian', sub: 'Suas anotações ligadas umas nas outras, no seu computador' },
        { icone: 'bookmark', titulo: 'NotebookLM', sub: 'Joga os documentos dentro e pergunta em vez de ler tudo' },
      ],
    },
    {
      variant: 'purple',
      denso: true,
      eyebrow: 'Pasta 02',
      // Sem realce: no slide roxo o ** vira lilás claro sobre roxo e o nome da
      // pasta, que é a informação principal, fica apagado. Branco puro resolve.
      titulo: 'Criar',
      corpo: 'Onde o projeto sai do papel. Uma IA, um editor e um banco, e você já consegue montar.',
      itens: [
        { icone: 'robot', titulo: 'Antigravity CLI · a IA grátis', sub: 'Agente do Google no terminal, sem custo pra pessoa física' },
        { icone: 'ai', titulo: 'Claude Code · a IA paga', sub: 'Agente que escreve, refatora e revisa dentro do seu repositório' },
        { icone: 'laptop', titulo: 'VS Code ou Cursor · o editor', sub: 'Onde você acompanha e corrige o que o agente escreveu' },
        { icone: 'layers', titulo: 'Supabase ou Neon · o banco', sub: 'Guarda os dados do projeto sem você subir servidor' },
      ],
    },
    {
      variant: 'dark',
      eyebrow: 'Pasta 03',
      titulo: '**Documentar**',
      corpo: 'A pasta que a maioria pula. Documento bom é o que faz a IA acertar de primeira.',
      itens: [
        { icone: 'bookmark', titulo: 'Spec Kit', sub: 'Do GitHub: você escreve a especificação e ela guia o agente até o código' },
        { icone: 'code', titulo: 'Context7', sub: 'Entrega ao agente a documentação da versão que você usa, pra ele parar de inventar função' },
        { icone: 'git', titulo: 'DeepWiki', sub: 'Troca github.com por deepwiki.com e o repositório vira wiki com diagrama' },
      ],
    },
    {
      variant: 'light',
      denso: true,
      eyebrow: 'Pasta 04',
      titulo: '**Publicar**',
      corpo: 'Coloca no ar e mantém no ar. Projeto no seu PC não conta como portfólio.',
      itens: [
        { icone: 'globe', titulo: 'Vercel', sub: 'Sobe o projeto e te devolve um link pra mandar pro recrutador' },
        { icone: 'loop', titulo: 'GitHub Actions', sub: 'Roda os testes e publica sozinho a cada alteração que você envia' },
        { icone: 'skull', titulo: 'Sentry', sub: 'Avisa do erro em produção antes de o usuário te contar' },
        { icone: 'eye', titulo: 'PostHog', sub: 'Mostra como as pessoas usam de verdade, com gravação da tela' },
      ],
    },
    {
      variant: 'purple',
      denso: true,
      eyebrow: 'Pasta 05',
      // Idem Criar: nome da pasta em branco puro no fundo roxo.
      titulo: 'Crescer',
      corpo: 'Projeto que ninguém vê não vira vaga. Essa pasta transforma o que você fez em oportunidade.',
      itens: [
        { icone: 'git', titulo: 'GitHub', sub: 'Seu perfil com os projetos fixados é o portfólio que o recrutador abre primeiro' },
        { icone: 'ai', titulo: 'Claude no LinkedIn', sub: 'Reescreve seu perfil a partir do que você construiu, sem texto genérico' },
        { icone: 'code', titulo: 'dev.to', sub: 'Publica de graça o que você aprendeu, e a comunidade já está lá dentro' },
        { icone: 'follow', titulo: 'Simplify', sub: 'Preenche a candidatura nos sites de vaga e guarda onde você já se inscreveu' },
      ],
    },
    {
      variant: 'dark',
      eyebrow: 'Salva esse slide',
      titulo: 'Abre a que **mais dói** hoje',
      terminal: [
        'ideia bagunçada na cabeça  → Pensar',
        'travo na hora de escrever  → Criar',
        'a IA erra e inventa função → Documentar',
        'projeto parado no seu PC   → Publicar',
        'ninguém vê o que eu faço   → Crescer',
      ],
      corpo:
        'Você não precisa das cinco. Ninguém precisa. Resolve a camada que está doendo, e só depois abre a próxima. Aviso honesto: as pagas aqui são o Claude Code e o plano que passa do grátis em Supabase, Neon, Vercel, Sentry e PostHog. Pra projeto pessoal, o grátis dá conta.',
    },
    {
      // TESTE DE LAYOUT (11/08/2026): fundo cinza escuro neutro e a nossa foto
      // como avatar no topo, ao lado do nome, em vez do disco grande no rodapé.
      // A foto fica bem menor, e em troca a promessa das três entregas ganha o
      // slide inteiro — que é o que a pessoa lê antes de decidir comentar.
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o mapa\ndas 5 pastas?',
      // "Comenta", não "Comente": é o verbo dos CTAs que mais renderam comentário
      // (SAGA, REPO, SKILLS). A palavra-gatilho da automação é PASTA.
      botao: 'Comenta PASTA 👇',
      // TRÊS entregas, como o CTA campeão do perfil (SAGA, 31,2 coment./1k, o
      // único que prometia três). O slide é onde a promessa precisa caber inteira:
      // é ele que a pessoa vê antes de decidir comentar.
      // A Semana vem com o MOTIVO colado nela: convite sem dizer o que a pessoa
      // leva de lá não converte (é a regra da casa pra CTA de evento).
      corpo:
        'Te mando o mapa: o link de cada ferramenta, por onde começar em cada pasta e a entrada de graça na Semana, onde você aprende a programar guiado por IA.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  legenda:
    // ESTRUTURA DA REFERÊNCIA (relida em 10/08/2026, direto da captura do
    // Telegram). A legenda da @cindiezhu NÃO repete os slides: ela é curta, em
    // primeira pessoa, e vai CTA → confissão → o que surpreendeu → pra quem
    // serve. Quem lista as ferramentas é o carrossel; a legenda só dá o motivo de
    // comentar. A versão anterior daqui era um índice do post (as 5 pastas e as
    // 14 ferramentas de novo), que é justamente o que a referência não faz.
    // 1ª frase curta de propósito: a linha de follow come ~56 caracteres do
    // preview (ver memória descricao-insta-linha-follow).
    'Comenta PASTA que eu te mando o mapa das 5 pastas na sua DM. 🗂️\n\n' +
    'Eu achava que pra tirar um projeto do papel faltava ferramenta. Não falta. O que falta é saber qual das cinco ' +
    'camadas do trabalho está travando você hoje.\n\n' +
    'O que me surpreendeu foi por que tanta gente não publica nada: tenta arrumar as cinco camadas ao mesmo tempo. ' +
    'Você só precisa abrir a que mais dói hoje. Resolve ela, e só então vai pra próxima.\n\n' +
    'O mapa serve pra quem está aprendendo e pra quem já vive de código: dá pra usar pra entender o que você ' +
    'escreve, pra construir com IA, pra colocar no ar e pra não quebrar depois que está lá.\n\n' +
    'Aviso honesto: dá pra atravessar as cinco pastas de graça. Quem cobra é o Claude Code, e o plano que passa do ' +
    'grátis em Supabase, Neon, Vercel, Sentry e PostHog, o que só acontece quando o projeto cresce.\n\n' +
    // Fecho com a ENTREGA por extenso. A 1ª linha fica curta por causa do preview
    // (a linha de follow come ~56 caracteres), então é aqui que a promessa cabe
    // inteira. Mesma palavra-gatilho: é reforço do mesmo pedido, não um segundo CTA.
    'Comenta PASTA que eu te mando o mapa com o link de cada ferramenta, por onde começar em cada pasta e o passo ' +
    'a passo pra entrar de graça na Semana do Zero ao Programador Contratado, onde você aprende a programar ' +
    'guiado por IA.',
  hashtags:
    'programacao ferramentasdev claudecode inteligenciaartificial devbr carreiratech aprenderprogramar devemdobro portfoliodev vibecoding',
  ctaFinal:
    'Comenta PASTA que eu te mando o mapa das 5 pastas na sua DM, com o link de cada ferramenta e por onde ' +
    'começar em cada uma, mais o passo a passo pra entrar de graça na Semana do Zero ao Programador ' +
    'Contratado, onde você aprende a programar guiado por IA.',
  briefing:
    'FÓRMULA: a estrutura da referência @cindiezhu (781 curtidas, 513 comentários), que é o nosso melhor caso de ' +
    'CTA de comentário conhecido. O que rendeu ali não foi a lista de ferramentas, foi organizar o caos em pastas ' +
    'nomeadas e dizer "escolhe a que mais dói hoje". A proporção de comentário por curtida (65%) mostra a palavra ' +
    'gatilho funcionando.\n\n' +
    'O QUE ADAPTAMOS (nomes revistos em 11/08/2026): da referência pegamos a ideia de camadas nomeadas, não as ' +
    'palavras. As pastas são PENSAR, CRIAR, DOCUMENTAR, PUBLICAR e CRESCER, em português, porque o post é pra quem ' +
    'está começando e a palavra precisa ser entendida sem traduzir. Pensar vem antes de Criar: é a ordem real do ' +
    'trabalho, a ideia bagunçada vira plano e só então vira código. DOCUMENTAR (na referência era Make, de conteúdo ' +
    'com avatar de IA) é a camada que o dev pula e que decide se a IA acerta: Spec Kit pra escrever a especificação ' +
    'antes do código, Context7 pra doc da versão certa e DeepWiki pra entender repositório alheio. PENSAR copia as ' +
    'quatro ferramentas dela, que servem igual pra quem programa. CRESCER trocou as ferramentas de criador e B2B ' +
    'dela (Beehiiv, Semrush, ManyChat, Apollo) por GitHub, LinkedIn com Claude, dev.to e Simplify, que é o que leva ' +
    'o projeto do dev até a vaga.\n\n' +
    'CRIAR tem o par grátis/pago explícito (Antigravity CLI e Claude Code), porque a objeção número um do nosso ' +
    'público é achar que precisa pagar pra começar.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): número + a promessa grande, "5 pastas pra construir qualquer projeto com IA". Até ' +
    '11/08 a capa dizia "as 5 pastas que todo dev precisa" e prometia que você só ia abrir uma; construir qualquer ' +
    'projeto é promessa maior, e a de tirar a paralisia continua viva no slide 8, onde tem o diagnóstico do lado.\n' +
    'Regra 2 (o slide 2 confirma): diz pra que a estrutura serve (estudar programação OU tirar um projeto ' +
    'profissional do papel em poucas horas) e nomeia a dor, quarenta abas salvas e nenhum projeto no ar.\n' +
    'Regra 3 (slide sozinho): uma pasta por slide, cada uma com as ferramentas e o que cada uma faz.\n' +
    'Regra 4 (salvável): o slide 8 é o diagnóstico, que é o slide que a referência provou ser o mais forte.\n' +
    'Regra 5 (CTA único): comenta PASTA.\n\n' +
    'HIPÓTESE EM TESTE (11/08/2026) — CTA COM TRÊS ENTREGAS\n' +
    'Dos 6 carrosséis nossos com CTA medido, todos usam o mesmo molde ("Comenta PALAVRA que eu te mando X"), então ' +
    'o que separa um do outro é a ENTREGA prometida. Os dois melhores prometem mais de um item, e o líder é o único ' +
    'que promete três: SAGA, 31,2 comentários por 1k (link do jogo + doc técnico + inscrição na Semana). Os de item ' +
    'único ficam entre 6,0 e 12,8.\n' +
    'O QUE MUDOU AQUI: o slide de CTA e o fecho da legenda passaram a prometer as mesmas TRÊS coisas do ctaFinal ' +
    '(mapa com os links + por onde começar em cada pasta + entrada de graça na Semana). Antes o slide prometia duas ' +
    'e a legenda uma só, e é o slide e a legenda que a pessoa lê antes de decidir comentar.\n' +
    'COMO JULGAR: comentários por 1k de alcance contra os 6 medidos, e não o número absoluto. Ressalva honesta: o ' +
    'SAGA teve 31.980 de alcance, cinco vezes o segundo colocado, então parte da vantagem dele pode ser ' +
    'distribuição e não o CTA. Se este ficar acima de 13, a hipótese ganha força; se ficar na faixa dos 6 a 8, ' +
    'o que manda é outra coisa.\n\n' +
    'LEGENDA (refeita em 10/08/2026 depois de reler a captura): a da referência não repete os slides. Ela é curta, ' +
    'em primeira pessoa, e segue CTA na 1ª linha, confissão ("i used to think you needed a whole team"), o que ' +
    'surpreendeu ("most people never ship because they try to fix all five layers at once") e pra quem serve. ' +
    'Listar as 5 pastas e as 14 ferramentas na legenda, como estava antes, é o oposto do que rendeu ali: a lista é ' +
    'trabalho do carrossel, a legenda só dá o motivo de comentar.\n\n' +
    'CTA: a nossa foto no rodapé do último slide, como a polaroid que ela usa no slide de comentário. Rosto no ' +
    'slide do pedido é o que faz parecer conversa, e não anúncio.\n\n' +
    'PRECISÃO: sem número e sem preço, porque preço muda. Cada afirmação foi conferida em 10/08/2026 (ver o ' +
    'cabeçalho do arquivo). O slide 8 diz nominalmente o que cobra.\n\n' +
    'CAPA: pixel art com as 5 pastas em cima, na mesma ordem dos slides, e a casa em obra embaixo, no padrão das ' +
    'capas campeãs (objeto em tela cheia, texto no rodapé). Sem escurecido por cima: a arte é clara e o texto é que ' +
    'ficou escuro. A capa também não tem mais subtítulo, porque "você só vai abrir uma hoje" não se explica sozinha ' +
    'ali; a ideia inteira é do slide 8, que traz o diagnóstico junto.\n\n' +
    'PRESENTE: a página do Notion está pronta com estas cinco pastas, as mesmas ferramentas dos slides, o "por onde ' +
    'começar" de cada uma e a tabela de diagnóstico do slide 8. Ela fecha convidando pra Semana.',
};
