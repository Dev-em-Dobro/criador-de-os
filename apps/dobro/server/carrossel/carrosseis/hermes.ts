/**
 * apps/dobro — carrossel "Um JARVIS que aprende sozinho" (Hermes Agent).
 *
 * EPISÓDIO 1 DO QUADRO "Ferramenta em 5 minutos" (decisão do dono, 15/08/2026).
 * O quadro nasceu de duas leituras do banco:
 *   · o JARVIS (04/07/2026) é o maior post da conta: 3.905 comentários, 59.825 de
 *     alcance, 767 seguidores, 65,3 comentários por mil. Ele não explicou nada:
 *     prometeu uma fantasia que a pessoa já tinha na cabeça.
 *   · a preocupação do dono ("pro leigo o Hermes é difícil") tem base: o que
 *     afasta não é a palavra técnica (título com jargão rende 18,4/1k contra
 *     3,1/1k), é a definição sem fantasia. "O agente de IA que lembra de tudo",
 *     que era o gancho do card antigo, é definição.
 *
 * A ANATOMIA COPIADA DO JARVIS (slides originais lidos um a um em 15/08/2026):
 *   1. capa: fantasia nomeada + barreira derrubada + posse ("no seu PC")
 *   2. o que é, por analogia, sem termo técnico
 *   3. slide inteiro só pedindo pra salvar, cedo
 *   4. o que faz, com UM item sensorial (no JARVIS era "ativa com 2 palmas";
 *      aqui é a mensagem que chega sozinha no seu Telegram de manhã)
 *   5. pré-requisitos curtos, com o "só isso"
 *   6. passo a passo numerado
 *   7. como saber que funcionou
 *   8. CTA com palavra e três entregas
 *
 * ⚠️ A ALAVANCA PRINCIPAL, E O MOTIVO DE O COMANDO NÃO ESTAR EM SLIDE NENHUM:
 * o JARVIS ensina o caminho inteiro e esconde só o ENDEREÇO (o slide de
 * instalação dele diz "baixa o projeto no GitHub" e nunca diz qual). Foi isso que
 * fez 3.905 pessoas comentarem. O contra-exemplo está no mesmo banco: o "12
 * coisas para instalar no Claude" (09/08/2026) trouxe um slide com os comandos
 * prontos pra colar, teve o segundo maior alcance da semana (20.511) e a PIOR
 * taxa de comentário dos posts de ferramenta, 7,3/1k. Se numa próxima passada
 * alguém colocar o `curl` do Hermes num slide, o CTA perde o motivo de existir.
 *
 * FATOS CONFERIDOS NA FONTE PRIMÁRIA (API do GitHub + README, 15/08/2026):
 *   · NousResearch/hermes-agent, licença MIT, escrito em Python
 *   · 231.022 estrelas e 45.866 forks
 *   · release v2026.8.13, publicada em 13/08/2026, com push no mesmo dia
 *   · README: "The self-improving AI agent built by Nous Research. It's the only
 *     agent with a built-in learning loop — it creates skills from experience,
 *     improves them during use"
 *   · canais listados: Telegram, Discord, Slack, WhatsApp, Signal, email e CLI
 *   · agendador embutido: "daily reports, nightly backups, weekly audits, all in
 *     natural language, running unattended"
 *   · requisitos: Python 3.11 e chave de um modelo (Nous Portal, OpenRouter,
 *     OpenAI ou endpoint próprio). Node.js, ripgrep e ffmpeg vêm no instalador
 *   · roda em Linux, macOS, WSL2 e Termux (Android)
 *   · depois de instalado, `hermes` abre a interface
 *
 * O QUE SAIU DO CARD ANTIGO POR NÃO TER SIDO RECONFIRMADO: "no Windows não pede
 * admin" e "monta um perfil seu". Não estão no README que li hoje, então não
 * entram em slide.
 *
 * SEM TRAVESSÃO em nenhum texto de conteúdo.
 */
import type { Carrossel } from '../types';

export const hermes: Carrossel = {
  slug: 'hermes',
  titulo: 'Um JARVIS que aprende sozinho',
  gancho:
    'Você não precisa ser bilionário pra ter um JARVIS no seu PC, e esse aprende sozinho.',
  dataProgramada: '2026-08-17',
  refsLinks:
    'https://github.com/NousResearch/hermes-agent (fonte primária: README e API do GitHub, 15/08/2026)\n' +
    'https://hermes-agent.nousresearch.com (site oficial)\n' +
    'molde: nosso carrossel do JARVIS, 04/07/2026 (3.905 comentários, 59.825 de alcance, 767 seguidores)',
  /**
   * Presente do "comenta JARVIS": é ele que carrega o endereço e o comando de
   * instalação, que de propósito não aparecem em slide nenhum.
   *
   * Criado em 15/08/2026. Traz o comando de instalação por sistema, o endereço
   * do repositório, quatro tarefas prontas pra colar (a primeira ensina ele a te
   * conhecer), o teste dos 5 minutos, o que é o laço de aprendizado e, no fim, o
   * convite do DevQuest no lugar do convite da Semana.
   *
   * LINK PRIVADO: trocar pelo `.notion.site` depois de Compartilhar > Publicar.
   * PENDENTE: colar o link de inscrição do DevQuest no lugar do placeholder.
   */
  linkPresente: 'https://app.notion.com/p/3bd6dd01fb488123871af5c8936afd21',
  /**
   * Capa: o Tony Stark de braços abertos no deserto (arte do dono, 17/08/2026).
   * A escolha fecha o loop do gancho: a capa promete um JARVIS, e o JARVIS é
   * DELE. O post campeão de 04/07 também abriu com arte cinematográfica.
   *
   * A arte é HORIZONTAL (740×425) e o slide é vertical, então ela não entra
   * direto: `node server/scripts/arte-hermes-capa.cjs` encaixa a foto por
   * largura nos 46% de cima e DISSOLVE a base dela no preto. Sem isso a emenda
   * entre a foto e o fundo vira uma linha reta atravessando o slide. Encaixar
   * por largura (e não por `cover`) é o que salva os braços abertos, que com
   * cover sairiam cortados nas laterais.
   *
   * DUAS CAPAS ANTERIORES ficaram no repo e voltam a valer se esta cair: o vídeo
   * da orbe (`orb.webm` + `videoCaixa`, que o render encaixa por cima do PNG) e
   * o print de conversa desenhado por `arte-hermes.cjs`.
   */
  bgImage: 'server/carrossel/assets/hermes/capa-ironman-encaixada.jpg',
  slides: [
    {
      variant: 'photo',
      cover: true,
      // A arte já vem no tamanho do slide (o script encaixou a foto no topo e
      // dissolveu a base), então entra em `cover` sem bgSize/bgPos. 'faixa'
      // garante o contraste do texto na metade de baixo.
      scrim: 'faixa',
      baixo: true,
      // SEM eyebrow (decisão do dono, 17/08/2026): o selo "Ferramenta em 5
      // minutos" saiu da capa. Ele empurrava o título pra baixo e disputava
      // atenção com a arte, e o quadro continua identificado na legenda.
      /**
       * GANCHO REPLICADO DO CAMPEÃO, não escrito do zero (decisão do dono,
       * 17/08/2026). A capa anterior ("Um JARVIS que aprende sozinho") era uma
       * DESCRIÇÃO da ferramenta e não derrubava barreira nenhuma.
       *
       * O que o banco diz sobre gancho e comentário (medições reais):
       *   · JARVIS 04/07: "Você não precisa ser bilionário pra ter um JARVIS no
       *     seu PC" → 65,3 comentários por mil, o maior post da conta
       *   · 07/07, "Claude Code de graça, e não é pirataria" → 54,4/1k
       *   · graphify, "faz o plano de $20 render como o de $200" → 38,1/1k
       *   · Odysseus 06/07, "PewDiePie largou o ChatGPT e criou uma IA que roda
       *     100% na sua máquina" → 32,8/1k
       * O padrão dos cinco é o mesmo: algo caro ou inacessível, e a resposta
       * rodando na máquina de quem lê. Descrição de funcionalidade não aparece
       * em nenhum dos ganchos de taxa alta.
       *
       * A promessa nova do post ("aprende sozinho") não some: ela desce pro
       * subtítulo, que é onde o JARVIS punha a instrução de deslizar.
       *
       * ⚠️ O QUE NÃO DEU PRA REPLICAR: o "de graça" da sublinha do JARVIS. Lá o
       * post inteiro rodava local sem custo. Aqui o Hermes é MIT, mas o modelo
       * que você pluga nele cobra, e o slide 5 diz isso com todas as letras. Pôr
       * "de graça" na capa brigaria com o próprio carrossel.
       *
       * 25.8 × 1.05 = 27,1px, ~23 caracteres por linha nos 308px úteis. As três
       * linhas abaixo têm 20, 22 e 19.
       */
      tituloMenor: true,
      tituloEscala: 1.05,
      titulo: 'Você não precisa ser\n**bilionário** pra ter\num JARVIS no seu PC',
      // A sublinha do JARVIS era instrução de deslizar ("passa pro lado que eu
      // te ensino"). Texto do dono, 17/08/2026.
      subtitulo: 'Passa pro lado pra ver a\nferramenta que torna possível',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      eyebrow: 'O que é, sem termo técnico',
      titulo: 'Um ajudante que **mora\nno seu computador**',
      corpo:
        'Não é site e não é aba de navegador. É um programa que fica **ligado na sua máquina** e faz tarefa por você, mesmo com o navegador fechado.\n\n' +
        'O nome dele é **Hermes**, saiu da Nous Research, e o código é aberto: **231 mil pessoas** já marcaram ele no GitHub.',
      /**
       * Print da home oficial (captura do dono, 17/08/2026). Mostrar a ferramenta
       * em vez de só descrever, e o selo "OPEN SOURCE · MIT LICENSE" aparece de
       * graça na imagem, o que sustenta o "não precisa ser bilionário" da capa.
       *
       * ⚠️ O PRINT FOI CORTADO EM 535px DE ALTURA, e o corte não é estético: a
       * home traz uma caixa "INSTALL VIA TERMINAL" com o endereço e o comando de
       * instalação prontos. É exatamente o que este carrossel esconde de
       * propósito, porque é o motivo de a pessoa comentar JARVIS (a lacuna do
       * endereço vale 65,3 comentários por mil contra 7,3 de quem põe o comando
       * no slide). Se alguém trocar por um print inteiro, o CTA morre junto.
       *
       * Recorte gerado com:
       *   ffmpeg -i "hermes 1.png" -vf "crop=1651:535:0:0" assets/hermes/site.png
       */
      imagem: 'server/carrossel/assets/hermes/site.png',
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'bookmark',
      titulo: 'Salva esse post\npra fazer depois',
      corpo: 'O passo a passo completo vem nos próximos slides.',
      /**
       * Selo da Nous Research (arte do dono, 17/08/2026) no espaço que sobrava
       * embaixo do pedido de salvar, que era metade do slide em branco. A arte
       * vem branca com fundo transparente, por isso o bloco azul: sem ele o logo
       * sumiria no slide claro. O azul é o do site oficial, amostrado do print
       * da home com ffmpeg: #2D00F0.
       */
      selo: 'server/carrossel/assets/hermes/nous.webp',
      seloFundo: '#2D00F0',
    },
    {
      variant: 'purple',
      eyebrow: 'Na prática',
      // Sem **destaque**: em slide roxo o realce (#a78bfa) tem luminosidade
      // parecida com o fundo e a palavra some. Conferido no PNG do 1º render.
      titulo: 'O que ele faz por você',
      // Quatro itens com sub de UMA linha (memória slide-com-4-itens-nao-cabe-corpo).
      // O terceiro é o item sensorial do post, o equivalente às 2 palmas do JARVIS.
      itens: [
        { icone: 'ai', titulo: 'Lembra do que você ensinou', sub: 'Explica seu projeto uma vez, e acabou' },
        { icone: 'globe', titulo: 'Te acha onde você já conversa', sub: 'Telegram, WhatsApp, Discord, Slack ou email' },
        { icone: 'loop', titulo: 'Acorda na hora que você marcar', sub: 'Relatório às 7h, backup de madrugada, sozinho' },
        { icone: 'puzzle', titulo: 'Escreve os próprios atalhos', sub: 'Resolveu algo difícil, guarda o caminho e reusa' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'O que você precisa antes',
      titulo: '**Três coisas**, e só',
      itens: [
        { icone: 'laptop', titulo: 'Um computador', sub: 'Windows, Mac ou Linux. No Android também roda' },
        { icone: 'code', titulo: 'Python 3.11', sub: 'O instalador traz o resto junto' },
        { icone: 'ai', titulo: 'Um modelo de IA', sub: 'De graça no seu PC, ou pago na nuvem' },
      ],
      /**
       * CORRIGIDO EM 17/08/2026 (pergunta do dono: "não dá pra usar modelos
       * gratuitos?"). A versão anterior dizia que a chave de IA era "onde, e só
       * onde, entra custo", o que estava errado: existe caminho de graça, e a
       * própria Nous documenta.
       *
       * FONTE PRIMÁRIA, docs oficiais lidas em 17/08/2026:
       *   · README: "Use any model you want — Nous Portal, OpenRouter, OpenAI,
       *     your own endpoint, and many others" e "Switch with `hermes model` —
       *     no code changes, no lock-in"
       *   · guia oficial /docs/guides/local-ollama-setup, intitulado "Run Hermes
       *     Locally with Ollama — Zero API Cost": "Your only cost is electricity
       *     — roughly $0.01–0.05 per session", contra $0.60–0.80 por sessão de
       *     API na nuvem
       *
       * A RESSALVA QUE PRECISA ESTAR NO SLIDE, e está: rodar de graça não basta
       * pra ele AGIR. O mesmo guia diz que "Hermes requires at least 64,000
       * tokens for agentic work with tools" e que, entre os modelos listados,
       * "only `gemma4:31b` has reliable tool calling" (~20 GB). Modelo pequeno
       * roda em qualquer PC, mas só conversa, não executa tarefa. Prometer "de
       * graça" sem isso faria a pessoa instalar e achar que quebrou.
       */
      corpo:
        'O Hermes é **de graça** e o código é aberto. Rodando **no seu PC** o gasto é a luz, uns centavos por sessão. Pra ele fazer tarefa, e não só conversar, o modelo local pede uma máquina parruda.',
    },
    {
      variant: 'dark',
      eyebrow: 'Instalação',
      titulo: 'Passo a passo',
      // SEM o comando e SEM o endereço: é a lacuna que faz o CTA existir.
      steps: [
        { n: '01', titulo: 'Abre o terminal', sub: 'No Windows, o PowerShell' },
        { n: '02', titulo: 'Cola o comando de instalação', sub: 'Um comando só, ele baixa tudo que precisa' },
        { n: '03', titulo: 'Escolhe onde falar com ele', sub: 'Telegram, WhatsApp, Discord ou email' },
        { n: '04', titulo: 'Cola a chave do modelo', sub: 'A conta do modelo continua sendo sua' },
        { n: '05', titulo: 'Diz o que ele deve lembrar', sub: 'Seu projeto, seu jeito, suas manias' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Teste',
      titulo: 'Como saber que\n**tá vivo**',
      terminal: ['$ hermes', '→ ligado, esperando você', '✓ relatório diário marcado para 07:00'],
      // O fecho amarra de volta na promessa da capa (pedido do dono, 17/08/2026):
      // o slide de teste terminava provando que o programa subiu, e o post nunca
      // dizia POR QUE aquilo é um JARVIS. Os três verbos aqui são os mesmos três
      // que o slide 4 já mostrou, então não entra promessa nova no fim.
      corpo:
        'Quando a primeira mensagem chegar **sozinha** no seu Telegram, de manhã, sem você abrir nada, ele está de pé.\n\n' +
        'Aí ele vira o seu **JARVIS**: acorda na hora que você marcou, fala com você onde você já conversa e lembra do que aprendeu ontem.',
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o comando e as\ntarefas prontas?',
      botao: 'Comenta JARVIS 👇',
      corpo:
        'Te mando o comando de instalação do seu sistema, uma lista de tarefas prontas pra colar e o que pedir no primeiro teste.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  legenda:
    'Comenta JARVIS que eu te mando o comando e as tarefas prontas. 🤖\n\n' +
    'Toda IA te conhece durante a conversa e esquece você inteiro quando a aba fecha. No dia seguinte lá vai você colar de novo o que está construindo, qual é a stack, como gosta que responda.\n\n' +
    'O Hermes ataca exatamente isso. É um programa que fica ligado no seu computador, não num site, e continua de pé com o navegador fechado. Saiu da Nous Research, o código é aberto com licença MIT e já passou de 231 mil estrelas no GitHub.\n\n' +
    'O que ele faz na prática:\n\n' +
    'Lembra do que você ensinou, então você explica seu projeto uma vez só.\n' +
    'Te acha onde você já conversa: Telegram, WhatsApp, Discord, Slack, Signal e email.\n' +
    'Acorda na hora que você marcar. Você pede em português "me manda o relatório às 7h" e ele faz sozinho.\n' +
    'Escreve os próprios atalhos: quando resolve uma tarefa difícil, guarda o caminho que funcionou e usa de novo.\n\n' +
    'Pra rodar, você precisa de três coisas: um computador (Windows, Mac, Linux, e no Android também roda), o Python 3.11, e uma chave de IA.\n\n' +
    'E a parte honesta, que quase ninguém fala: o Hermes é de graça, o modelo não. Você aponta pra Nous Portal, OpenRouter, OpenAI ou um endereço seu, e a conta do modelo continua sendo sua.\n\n' +
    'Esse é o primeiro post do quadro Ferramenta em 5 minutos: uma ferramenta explicada do zero, sem termo que você precise procurar no Google.\n\n' +
    'Salva esse post e comenta JARVIS aqui embaixo que eu te mando o comando de instalação do seu sistema, a lista de tarefas prontas e o que pedir no primeiro teste. 👇',
  hashtags:
    'inteligenciaartificial iaparadev opensource automacao programacao devbr telegram tecnologia produtividade devemdobro',
  ctaFinal:
    'Comenta JARVIS que eu te mando o comando de instalação do seu sistema, a lista de tarefas prontas pra colar e o que pedir no primeiro teste.',
  briefing:
    'EPISÓDIO 1 DO QUADRO "Ferramenta em 5 minutos" (decisão do dono, 15/08/2026). O quadro é a fórmula do JARVIS ' +
    'virando formato fixo, com uma régua: nenhuma palavra técnica sem tradução na mesma linha, a promessa cabe numa ' +
    'frase que qualquer pessoa entende, e o endereço da ferramenta nunca aparece no slide.\n\n' +
    'POR QUE ESTE POST EXISTE ASSIM: o card antigo abria com "O agente de IA que lembra de tudo que você faz", que é ' +
    'uma definição. O JARVIS, maior post da conta (3.905 comentários, 65,3/1k), abria com uma fantasia que a pessoa já ' +
    'tinha pronta na cabeça. A capa aqui faz o mesmo: JARVIS é o atalho que explica o Hermes pra quem nunca ouviu ' +
    'falar de agente.\n\n' +
    'O NÚMERO QUE SUSTENTA A DECISÃO DE ESCONDER O COMANDO: post que entrega o comando no slide não precisa de ' +
    'comentário. O "12 coisas para instalar no Claude" tinha um slide chamado "Os comandos que instalam tudo isso" e ' +
    'fez 7,3 comentários por mil, a pior taxa entre os posts de ferramenta, com 20.511 de alcance. O JARVIS escondeu ' +
    'o endereço e fez 65,3/1k. Por isso o slide 6 tem os cinco passos e nenhum comando.\n\n' +
    'ITEM SENSORIAL (o "2 palmas" deste post): a mensagem que chega sozinha no Telegram de manhã, sem a pessoa abrir ' +
    'nada. É o que dá vontade de testar hoje, e é o que o slide 7 usa como prova de que funcionou.\n\n' +
    'FATOS CONFERIDOS NA FONTE PRIMÁRIA (15/08/2026): 231.022 estrelas, 45.866 forks, licença MIT, Python, release ' +
    'v2026.8.13 de 13/08/2026, canais Telegram/Discord/Slack/WhatsApp/Signal/email/CLI, agendador embutido em ' +
    'linguagem natural, Python 3.11 e chave de modelo como requisitos, roda em Linux, macOS, WSL2 e Termux (Android), ' +
    'e `hermes` abre a interface depois de instalado.\n\n' +
    'SAIU DO CARD ANTIGO POR FALTA DE RECONFIRMAÇÃO: "no Windows não pede admin" e "monta um perfil seu".\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): JARVIS é reconhecimento imediato, e "aprende sozinho" é a novidade.\n' +
    'Regra 2 (o slide 2 confirma): explica o que é sem exigir nenhum termo técnico.\n' +
    'Regra 3 (slide sozinho): o que faz, o que precisa, como instalar, como testar.\n' +
    'Regra 4 (salvável): o slide 3 pede o salvamento cedo, igual ao JARVIS.\n' +
    'Regra 5 (CTA único): comenta JARVIS.\n\n' +
    'SEMANA DE CARRINHO DO DEVQUEST (17 a 21/08): o carrossel não vende. A matrícula aparece só na página do ' +
    'presente, e o presente desta semana troca o convite da Semana pela inscrição no DevQuest, sem o GIF do GTA 6 ' +
    '(decisão do dono, 15/08/2026).\n\n' +
    'PENDENTE ANTES DE PUBLICAR:\n' +
    '  1. criar a página do presente no Notion (comando por sistema, tarefas prontas, primeiro teste) e colar o link ' +
    'em linkPresente e no campo do card;\n' +
    '  2. link de inscrição do DevQuest, que o dono vai passar;\n' +
    '  3. arte de capa: hoje a capa usa o gradiente de fallback, sem imagem.',
};
