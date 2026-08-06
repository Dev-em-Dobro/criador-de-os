/**
 * apps/dobro — carrossel "12 coisas pra instalar no Claude: para usuários acima
 * da média".
 *
 * Origem: referência mandada no Telegram em 05/08/2026, carrossel do
 * @iampascio ("12 things to install in Claude / for power-users", 2.007 curtidas
 * e 298 comentários). Decisão: COPIAR a estrutura (capa com o número + 3 blocos
 * de 4 itens: Plugins, Skills, MCP Servers + CTA de palavra-gatilho na legenda)
 * e trocar os 12 itens por coisas verificadas na documentação oficial, apontadas
 * pro nosso público (dev web que usa IA e automação).
 *
 * Precisão (Article IV): TUDO conferido em code.claude.com em 05/08/2026.
 *   Plugins: o marketplace oficial (`claude-plugins-official`) já vem registrado;
 *     instala com `/plugin install <nome>@claude-plugins-official`.
 *     `typescript-lsp` está na tabela de code intelligence e exige o binário
 *     typescript-language-server; dá diagnóstico depois de cada edição e
 *     navegação por definição/referência.
 *     `security-guidance` revisa cada mudança que o Claude faz procurando
 *     vulnerabilidade comum e manda corrigir na mesma sessão.
 *     `pr-review-toolkit` traz agentes especializados em revisar PR.
 *     `commit-commands` traz commit, push e criação de PR.
 *   Skills: são bundled, já vêm instaladas. `/security-review` roda uma passada
 *     de segurança na branch atual; `/batch` decompõe o trabalho em 5 a 30
 *     unidades independentes e roda subagentes; `/deep-research` dispara buscas
 *     em paralelo, valida fonte e sintetiza relatório citado; `/doctor` é um
 *     checkup que diagnostica e corrige a instalação.
 *   MCP: a doc lista plugins que já embrulham MCP server pronto (notion, slack,
 *     sentry, supabase, entre outros). A rota manual é `claude mcp add`, e o
 *     endereço do Notion aparece literal na doc:
 *     `claude mcp add --transport http notion https://mcp.notion.com/mcp`.
 *   Custo de contexto: o painel `/plugin` mostra um "Context cost" estimado por
 *     turno, e existe uma seção "Not used recently" pra você achar plugin que
 *     ainda custa contexto sem você usar. É a base do slide de aviso honesto.
 * NÃO afirmamos preço, licença nem número de plugins do catálogo. SEM travessão.
 */
import type { Carrossel } from '../types';

export const instalarNoClaude: Carrossel = {
  slug: 'instalar-no-claude',
  titulo: '12 coisas para instalar no Claude: para usuários acima da média',
  gancho: '12 coisas pra instalar no Claude. É o que separa quem usa do que sabe usar.',
  refsLinks: 'https://www.instagram.com/p/Da7ZkTblprI/',
  dataProgramada: '2026-08-07',
  /** Capa (06/08): o polvo cercado dos elementos, cada um sendo uma das 12 coisas. */
  bgImage: 'server/carrossel/assets/instalar-no-claude/capa.png',
  slides: [
    {
      variant: 'photo',
      cover: true,
      // 0.92 = os 15% a mais que tinham sido pedidos, menos 20%: o gancho segue
      // sendo o maior elemento, mas parou de cobrir o polvo.
      tituloEscala: 0.92,
      gruda: true,
      titulo: '12 coisas pra\ninstalar no **Claude**',
      subtitulo: 'Para usuários acima da média.',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      eyebrow: '1. Plugins',
      titulo: 'Um comando e o\nClaude **ganha uma\nhabilidade nova**',
      itens: [
        { icone: 'code', titulo: 'typescript-lsp', sub: 'Ele passa a ver erro de tipo na hora que edita o arquivo' },
        { icone: 'eye', titulo: 'security-guidance', sub: 'Revisa cada mudança atrás de vulnerabilidade e corrige na hora' },
        { icone: 'bookmark', titulo: 'pr-review-toolkit', sub: 'Agentes especializados em revisar pull request' },
        { icone: 'loop', titulo: 'commit-commands', sub: 'Commit, push e abertura de PR sem sair do terminal' },
      ],
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'follow',
      eyebrow: 'Antes de continuar',
      titulo: 'Segue o\n**@devemdobro**',
      corpo: 'Toda semana eu mostro como usar IA de verdade no seu código, não só pedir função pronta. Segue pra não perder.',
    },
    {
      variant: 'purple',
      eyebrow: '2. Skills',
      titulo: 'Essas você já tem\ne nunca usou',
      itens: [
        { icone: 'eye', titulo: '/security-review', sub: 'Uma passada de segurança na branch que você vai subir' },
        { icone: 'layers', titulo: '/batch', sub: 'Quebra a mudança grande em até 30 partes e roda em paralelo' },
        { icone: 'map', titulo: '/deep-research', sub: 'Pesquisa em várias frentes e devolve relatório com a fonte' },
        { icone: 'ai', titulo: '/doctor', sub: 'Checkup que conserta a instalação e liga o que estava desligado' },
      ],
    },
    {
      variant: 'dark',
      eyebrow: '3. MCP Servers',
      titulo: 'Aqui ele para de\nviver **só no chat**',
      itens: [
        { icone: 'bookmark', titulo: 'Notion', sub: 'Lê e atualiza seus documentos e bases direto' },
        { icone: 'globe', titulo: 'Slack', sub: 'Puxa o histórico do canal e responde por você' },
        { icone: 'skull', titulo: 'Sentry', sub: 'Abre o erro que seu app reportou em produção' },
        { icone: 'layers', titulo: 'Supabase', sub: 'Conecta no seu banco e trabalha nos dados de verdade' },
      ],
    },
    {
      variant: 'light',
      denso: true,
      eyebrow: 'Salva esse slide',
      titulo: 'Os comandos que\ninstalam **tudo isso**',
      terminal: [
        '$ /plugin install typescript-lsp',
        '→ o marketplace oficial já vem ligado',
        '$ /security-review',
        '→ skill já instalada, é só digitar a barra',
        '$ claude mcp add --transport http notion \\',
        '    https://mcp.notion.com/mcp',
      ],
      corpo: 'No plugin, o nome completo é typescript-lsp@claude-plugins-official. O painel /plugin faz o mesmo sem digitar.',
    },
    {
      variant: 'dark',
      eyebrow: 'Um aviso honesto',
      titulo: 'Instalar tudo **cobra\num preço**',
      corpo:
        'Cada plugin e cada MCP ocupa espaço no contexto a cada resposta. O próprio painel mostra esse custo antes de instalar e separa os que você não usa há semanas. Instala o que resolve a sua dor, não os 12 de uma vez.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer a lista das 12\ncom os comandos?',
      botao: 'Comente CLAUDE 👇',
      corpo: 'Comenta CLAUDE que eu te mando a lista das 12 com o comando de instalação de cada uma, pronta pra colar.',
    },
  ],
  legenda:
    'A maioria instala o Claude Code e usa 10% do que ele faz. Essas 12 coisas são o que separa quem usa de quem sabe ' +
    'usar, e todas saem da documentação oficial.\n\n' +
    'PLUGINS (instala com /plugin install nome@claude-plugins-official, o marketplace oficial já vem ligado):\n' +
    '1. typescript-lsp: ele passa a ver erro de tipo na hora em que edita o arquivo, e navega por definição e ' +
    'referência. Precisa do typescript-language-server instalado.\n' +
    '2. security-guidance: revisa cada mudança atrás de vulnerabilidade comum e corrige na mesma sessão.\n' +
    '3. pr-review-toolkit: agentes especializados em revisar pull request.\n' +
    '4. commit-commands: commit, push e abertura de PR sem sair do terminal.\n\n' +
    'SKILLS (essas já vêm instaladas, é só digitar a barra):\n' +
    '5. /security-review: uma passada de segurança nas mudanças da sua branch.\n' +
    '6. /batch: quebra uma mudança grande em até 30 partes independentes e roda subagentes em paralelo.\n' +
    '7. /deep-research: dispara buscas em várias frentes, valida as fontes e devolve um relatório citado.\n' +
    '8. /doctor: checkup que diagnostica e corrige a instalação e liga otimizações.\n\n' +
    'MCP SERVERS (é o que tira o Claude do chat e coloca dentro dos seus apps):\n' +
    '9. Notion, 10. Slack, 11. Sentry, 12. Supabase. Todos existem como plugin pronto no marketplace oficial, ou você ' +
    'conecta na mão: claude mcp add --transport http notion https://mcp.notion.com/mcp\n\n' +
    'Um aviso honesto: cada plugin e cada MCP ocupa espaço no contexto a cada resposta. O painel /plugin mostra esse ' +
    'custo antes de instalar e separa os que você não usa há semanas. Instala o que resolve a sua dor, não os 12 de ' +
    'uma vez.\n\n' +
    'Comenta CLAUDE aqui embaixo que eu te mando a lista das 12 com o comando de instalação de cada uma. 👇',
  hashtags: 'claudecode claude inteligenciaartificial devweb programacao mcp aiagents vibecoding devemdobro carreiratech',
  ctaFinal: 'Comenta CLAUDE que eu te mando a lista das 12 com o comando de instalação de cada uma, pronta pra colar.',
  /** Presente entregue no CTA: página do Notion com as 12 e os comandos (criada em 05/08/2026). */
  linkPresente: 'https://app.notion.com/p/3b36dd01fb488192b2f1c13cd799b51c',
  briefing:
    'ORIGEM: referência do Telegram (05/08/2026), carrossel do @iampascio "12 things to install in Claude / for ' +
    'power-users", com 2.007 curtidas e 298 comentários (ratio alto de comentário, puxado pela palavra-gatilho).\n\n' +
    'ESTRUTURA COPIADA DA REFERÊNCIA\n' +
    'Capa com o número e a promessa de status ("for power-users" vira "para usuários acima da média").\n' +
    'Três blocos de 4 itens: Plugins, Skills, MCP Servers, cada item com nome próprio e o que faz.\n' +
    'CTA de palavra-gatilho pra receber na DM (lá foi STANLEY, aqui é CLAUDE).\n\n' +
    'O QUE FOI ADAPTADO E POR QUÊ\n' +
    'Os 12 itens dele são de terceiros e não dava pra conferir um a um. Trocamos por 12 verificados na documentação ' +
    'oficial (code.claude.com, 05/08/2026) e apontados pro nosso público: dev web que usa IA.\n' +
    'Ganhamos dois slides que a referência não tem: o dos comandos (slide salvável de verdade) e o aviso honesto ' +
    'sobre custo de contexto, que é o que dá autoridade e evita o efeito "lista de hype".\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 capa: número + promessa de status, uma ideia só.\n' +
    'Regra 2: o slide 2 já entrega o primeiro bloco, não repete o problema.\n' +
    'Regra 4 slide salvável: o slide 6 tem os comandos literais.\n' +
    'Regra 5: CTA único, comenta CLAUDE.\n\n' +
    'PENDENTE: arte de capa (hoje sai no gradiente). Sugestão: print do painel /plugin com a aba Discover aberta, ' +
    'capturável com o server/scripts/capturar-prints.ts.',
};
