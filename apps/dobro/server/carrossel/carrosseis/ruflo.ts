/**
 * apps/dobro — carrossel "98 agentes trabalhando no seu projeto enquanto você dorme".
 *
 * ORIGEM: referência @fabianocarvalhojr (7.614 comentários / 5.483 curtidas), a #5
 * do nosso banco. A legenda dela abre em "Ninguém tá falando disso. Tem um
 * repositório em primeiro lugar no GitHub, totalmente de graça, que transforma o
 * Claude Code num sistema de mais de 60 agentes".
 *
 * A REFERÊNCIA NÃO INVENTOU NADA (corrigido em 12/08/2026 pelo revisor). A 1ª
 * versão deste arquivo acusava a referência de inventar dois números, e a acusação
 * era falsa: eu tinha lido só o README. Conferido no repo inteiro:
 *   · "60+ agentes" está na descrição OFICIAL do pacote no npm ("Deploy 60+
 *     specialized agents") e no docs/USERGUIDE.md ("Agent registry (60+ agent
 *     types)"). Não é leitura errada dela;
 *   · "corta tokens em até 50%" e "estica o limite em 250%" estão no
 *     docs/USERGUIDE.md, que o próprio README indica como referência diária:
 *     "Reduces token usage 30-50%" e "Extend your Claude Code subscription by
 *     250%".
 * A LIÇÃO: ler só o README não é ler a fonte primária quando o projeto tem
 * docs/. Antes de dizer que alguém inventou um número, procure no repositório
 * inteiro, incluindo o guia do usuário e o registro do pacote.
 *
 * POR QUE MESMO ASSIM NÃO USAMOS o 50% e o 250%: eles vêm sem método de medição
 * publicado, diferente dos números de memória vetorial, que vêm com a condição e
 * até com o caso em que a técnica PERDE ("~1.9x faster at N=20k, ~3.2x-4.7x at
 * N=5k vs brute force (recall@10 ~0.99); ANN wins above the crossover, ties/loses
 * at small N"). É decisão editorial, não acusação. Se cobrarem nos comentários, a
 * resposta honesta é: existe na doc, a gente preferiu não repassar sem prova.
 *
 * PRECISÃO (Article IV) — tudo VERBATIM do README, lido em 12/08/2026:
 *   · o projeto se chamava `claude-flow` e virou `ruflo` (repo ruvnet/ruflo);
 *   · comando: `npx ruflo@latest init wizard`, ou global com
 *     `npm install -g ruflo@latest`;
 *   · nota do README pra quem usa Windows: a forma `curl ... | bash` precisa de
 *     shell POSIX, e "The `npx ruflo@latest init wizard` line works natively in
 *     PowerShell and cmd";
 *   · DUAS rotas de instalação com superfícies bem diferentes: o plugin do Claude
 *     Code deixa "Zero" arquivos no workspace, e a rota CLI cria `.claude/`,
 *     `.claude-flow/`, `CLAUDE.md`, helpers e settings;
 *   · "Queen-led hierarchy (Raft, Byzantine, Gossip)" na coordenação;
 *   · "Intelligent routing (89% accuracy)" no roteamento de tarefa;
 *   · "12 auto-triggered workers (audit, optimize, testgaps, etc.)";
 *   · multi-provedor: "Claude, GPT, Gemini, Cohere, Ollama with smart routing",
 *     e a tabela comparativa diz "5 providers with failover";
 *   · "33 native Claude Code plugins + 21 npm plugins";
 *   · licença MIT, 67.721 estrelas (API do GitHub, 12/08/2026).
 *
 * SOBRE O "ENQUANTO VOCÊ DORME" (gancho pedido pelo dono): sustenta, COM CONDIÇÃO.
 * A maior parte dos 12 workers dispara por atividade sua, e o guia diz
 * "automatically while you work". O que roda de verdade sem ninguém na frente são
 * os agendados por TEMPO, e só com o daemon ligado (USERGUIDE: map 5min, audit
 * 10min, optimize 15min, testgaps 20min, consolidate 30min). Por isso o slide diz
 * "com o daemon ligado": sem essa condição, a própria doc contradiz o gancho.
 * E o daemon é da rota CLI, não do plugin (README: "Hooks installed | No | Yes").
 * O que eles fazem é MANUTENÇÃO, não construir projeto do zero.
 *
 * ATENÇÃO: o slide de aviso honesto foi removido pelo dono. As ressalvas acima
 * vivem agora na página do presente. Quem só vê o carrossel não recebe elas.
 *
 * MÉRITO DA FONTE: o README do Ruflo é honesto de um jeito raro. Todo número de
 * desempenho vem com a condição em que foi medido, inclusive dizendo onde a
 * técnica PERDE ("ties/loses at small N"). Vale imitar, e é por isso que o nosso
 * aviso honesto é grande.
 *
 * SEM TRAVESSÃO em conteúdo. CTA sem captação pra Semana.
 *
 * CAPA: pendente.
 */
import type { Carrossel } from '../types';

export const ruflo: Carrossel = {
  slug: 'ruflo',
  titulo: '98 agentes trabalhando no seu projeto enquanto você dorme',
  gancho: 'Um comando põe 98 agentes pra trabalhar no seu projeto, e 12 deles rodam sozinhos.',
  dataProgramada: '2026-08-14',
  refsLinks:
    'https://www.instagram.com/reel/DYr3pu2ETzB/ (referência: @fabianocarvalhojr, 7.614 comentários)\n' +
    'https://github.com/ruvnet/ruflo (fonte primária, lida em 12/08/2026)',
  /**
   * Presente do "comenta ENXAME" (Notion, 12/08/2026). Abre com o que quase
   * ninguém sabe, que dá pra testar em flo.ruv.io sem instalar nada, e vai direto
   * pra decisão que importa: a comparação entre as duas rotas de instalação, com o
   * aviso de que a CLI escreve no CLAUDE.md da pessoa. Traz a ordem do que ligar
   * primeiro e fecha com as ressalvas, inclusive a de que o "50% de token e 250%
   * de limite" EXISTE no guia oficial, mas sem método de medição publicado.
   * Este presente carrega o aviso honesto que saiu do carrossel.
   */
  linkPresente: 'https://app.notion.com/p/3ba6dd01fb4881da80dce21c86e1e128',
  /**
   * Capa (imagem do dono, 12/08/2026): escritório de madrugada visto da altura da
   * mesa, com abelhas de óculos escuros e camisa social carregando pilhas de papel,
   * a cadeira humana VAZIA ao fundo e um monitor aceso em roxo. É o enxame em
   * imagem, e a cadeira vazia conta o "enquanto você dorme" sem escrever.
   * Veio em 1092×1440 (0.76) e foi recortada pra 4:5 tirando 75px do TOPO, pra
   * preservar o tampo escuro do rodapé, que é onde o título cai:
   *   ffmpeg -i capa.png -vf "crop=1092:1365:0:75" capa.png
   */
  bgImage: 'server/carrossel/assets/ruflo/capa.png',
  slides: [
    {
      variant: 'photo',
      cover: true,
      scrim: 'bloco',
      baixo: true,
      tituloMenor: true,
      // 1.09 = os 0.95 anteriores mais 15% (decisão do dono, 12/08/2026).
      tituloEscala: 1.09,
      titulo: '**98 agentes**\ntrabalhando no seu projeto\nenquanto você dorme',
      // NÃO dizer "o repositório número 1 do GitHub", que é o que a referência
      // afirma: é falso. São 67.720 estrelas contra 453.892 do repositório mais
      // estrelado. A prova social real já é forte o bastante.
      subtitulo: 'De graça, código aberto, 67 mil estrelas no GitHub',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      eyebrow: 'O que é',
      titulo: 'Um **enxame** em cima\ndo Claude Code',
      corpo:
        'O Claude Code sozinho trabalha um de cada vez, sem lembrar da sessão passada. O Ruflo põe **98 agentes** pra trabalhar juntos, com memória compartilhada. É de graça e open source.',
      // Banner do próprio README (imagem do dono, 12/08/2026) no lugar do print da
      // página do repositório: é mais bonito e traz a prova social em selo legível
      // no slide, licença MIT, 68 mil estrelas e 8,1 milhões de downloads. O print
      // da página anterior está guardado em assets/ruflo/repo.png.
      imagem: 'server/carrossel/assets/ruflo/banner.png',
    },
    {
      variant: 'light',
      eyebrow: 'Como eles se organizam',
      titulo: 'Tem uma **rainha**\nmandando neles',
      corpo:
        'Não é bagunça de 98 agentes falando ao mesmo tempo. A organização é **hierárquica**, com uma rainha distribuindo o trabalho, e o roteamento de tarefa acerta o agente certo em **89% das vezes**, número do próprio projeto.',
    },
    {
      variant: 'purple',
      titulo: '12 deles trabalham\nsem você pedir',
      // A CONDIÇÃO É OBRIGATÓRIA. A maior parte dos 12 dispara por atividade sua
      // ("automatically while you work", diz o guia), e o que sustenta o "enquanto
      // você dorme" são os que rodam por TEMPO, e só com o daemon ligado. Sem
      // dizer isso, a própria doc contradiz o gancho do post.
      corpo:
        'Essa é a parte do "enquanto você dorme". Com o daemon ligado, eles disparam em ciclo: auditoria de segurança a cada **10 minutos**, otimização a cada 15, caça a buraco de teste a cada 20.',
    },
    {
      variant: 'dark',
      eyebrow: 'Não prende você',
      titulo: 'Roda com **cinco**\nprovedores',
      corpo:
        'Claude, GPT, Gemini, Cohere e Ollama, com troca automática se um falhar. Dá pra misturar: o modelo caro no que é difícil e o local no que é repetitivo.',
    },
    {
      variant: 'light',
      eyebrow: 'Salva esse post pra fazer depois',
      titulo: 'É **um comando**',
      terminal: [
        '# no seu projeto',
        '$ npx ruflo@latest init wizard',
      ],
      corpo:
        'O assistente pergunta o que você quer e monta. **No Windows funciona direto no PowerShell**, sem precisar de WSL, que é onde a maioria trava. Precisa do **Node 20** ou mais novo.',
    },
    // REMOVIDO em 12/08/2026 (decisão do dono): havia aqui o aviso honesto sobre
    // as duas rotas de instalação (o plugin não deixa arquivo, a CLI cria
    // .claude/, .claude-flow/ e escreve no CLAUDE.md) e sobre os 12 trabalhadores
    // fazerem manutenção e não construírem produto sozinhos.
    // ATENÇÃO: este carrossel ficou SEM slide de aviso honesto, o que é exceção ao
    // padrão da casa. A informação toda migrou pra página do presente, que abre
    // com a comparação das duas rotas e fecha com as ressalvas, inclusive a de que
    // o "50% de token / 250% de limite" existe no guia, mas sem método de medição.
    // Quem comenta ENXAME recebe. Quem só vê o carrossel, não.
    {
      // TESTE DE LAYOUT (12/08/2026): CTA em duas colunas, texto à esquerda e a
      // nossa foto à direita, sem o botão pill. O pedido virou o TÍTULO, grande,
      // pra ler como alguém falando com você e não como cartaz. Hipótese: CTA que
      // parece conversa rende mais comentário que CTA que parece anúncio.
      // COMO JULGAR: comentários por 1k contra os CTAs de botão (o padrão até
      // aqui), com o mesmo cuidado de sempre, o alcance distorce o número absoluto.
      variant: 'grafite',
      tipo: 'cta',
      ctaLado: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Comenta **ENXAME**\nque eu te envio\nna DM',
      // Corpo CURTO neste layout: a coluna de texto é metade do slide, e frase
      // longa desce até a altura dos rostos e some atrás deles.
      corpo: 'O passo a passo, qual rota escolher e o que ligar primeiro.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  legenda:
    'Comenta ENXAME que eu te mando o passo a passo. 🐝\n\n' +
    'Tem um repositório de graça que transforma o Claude Code num sistema de 98 agentes trabalhando juntos, com ' +
    'memória compartilhada e uma hierarquia organizando quem faz o quê.\n\n' +
    'O que mais me chamou atenção foram os 12 trabalhadores que disparam sozinhos, fazendo auditoria e caçando ' +
    'buraco de teste sem ninguém pedir. Mas já aviso: é manutenção rodando em segundo plano, não é acordar com um ' +
    'produto pronto.\n\n' +
    'Comenta ENXAME que eu te mando o passo a passo, qual das duas rotas de instalação escolher e o que ligar ' +
    'primeiro pra não virar bagunça no seu projeto.',
  hashtags:
    'claudecode programacao devbr iaparadevs opensource ferramentasdev inteligenciaartificial aitools devemdobro vibecoding',
  ctaFinal:
    'Comenta ENXAME que eu te mando o passo a passo do Ruflo, qual das duas rotas de instalação escolher pro seu ' +
    'caso, e o que ligar primeiro pra não virar bagunça no seu projeto.',
  briefing:
    'FÓRMULA: a referência @fabianocarvalhojr (7.614 comentários) abre em "ninguém tá falando disso" com um ' +
    'repositório em primeiro lugar do GitHub. O gancho é ESCALA: um comando vira um time inteiro.\n\n' +
    'DOIS PONTOS DA REFERÊNCIA QUE A GENTE CONFERIU NA FONTE, e nos dois ela está certa. Primeiro, o número de ' +
    'agentes: ela diz "mais de 60" e a gente usa 98. Os dois estão em documento oficial. O README diz "98 agents, ' +
    '60+ commands, 30 skills" na coluna da rota CLI e "100+ Agents" na tabela de capacidades; a descrição do pacote ' +
    'no npm diz "Deploy 60+ specialized agents"; e o inventário auditado do próprio projeto (docs/STATUS.md) conta ' +
    '45 definições de agente. Usamos o 98 porque é o número da rota que este post ensina. Se cobrarem, a resposta é ' +
    'essa: o projeto publica contagens diferentes e a nossa está citada.\n\n' +
    'Segundo, os números de token. Ela fala em cortar tokens em 50% e esticar o limite em 250%. Não está no README, ' +
    'mas ESTÁ no guia oficial (docs/USERGUIDE.md): "Reduces token usage 30-50%" e "Extend your Claude Code ' +
    'subscription by 250%". Escolhemos não usar porque vêm sem método de medição, diferente dos números de memória ' +
    'vetorial, que trazem a condição e até onde a técnica perde. É decisão editorial, não acusação: se alguém ' +
    'cobrar, a gente diz que existe na doc e que preferiu não repassar sem prova.\n\n' +
    'O GANCHO "ENQUANTO VOCÊ DORME" (pedido do dono) se sustenta nos 12 background workers auto-disparados, que o ' +
    'README nomeia: auditoria, otimização, buraco de teste. O que NÃO se sustenta é "cria projetos incríveis" ' +
    'sozinho, então o aviso honesto diz na cara que é manutenção e que ninguém vai acordar com produto pronto. Sem ' +
    'esse slide o post promete o que a ferramenta não entrega, e quem instalar volta decepcionado nos comentários.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): escala e o "enquanto você dorme", que é o benefício em imagem.\n' +
    'Regra 2 (o slide 2 confirma): mostra o repositório no print e explica o enxame.\n' +
    'Regra 3 (slide sozinho): uma ideia por slide, a rainha, os 12, os cinco provedores.\n' +
    'Regra 4 (salvável): o slide do comando único, com a nota do PowerShell, que é onde o público Windows trava.\n' +
    'Regra 5 (CTA único): comenta ENXAME.\n\n' +
    'O AVISO HONESTO É GRANDE DE PROPÓSITO, e tem dois motivos. Um: a rota CLI enche o projeto de arquivo e mexe no ' +
    'CLAUDE.md da pessoa, o que é exatamente o tipo de surpresa que faz alguém desinstalar com raiva. Dois: o README ' +
    'do Ruflo é honesto de um jeito raro, dando a condição de cada medição e dizendo até onde a técnica perde. Copiar ' +
    'essa postura é o que separa a gente de quem só repassa print.\n\n' +
    'PRESENTE: pronto (Notion, em linkPresente), e é ele que carrega o aviso honesto que saiu do carrossel. Traz a ' +
    'comparação das duas rotas, o que ligar primeiro e as ressalvas que a doc declara e quase ninguém conta: a ' +
    'instalação padrão baixa cerca de 340MB, o /plugin é comando de dentro do Claude Code e não do terminal, o ' +
    'Claude Code precisa estar instalado antes, e os daemons antigos em shell só rodam em Linux e macOS. Sem ' +
    'captação pra Semana.',
};
