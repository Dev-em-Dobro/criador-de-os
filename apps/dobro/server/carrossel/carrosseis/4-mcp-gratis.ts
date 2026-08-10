/**
 * apps/dobro — carrossel "4 MCP grátis que destravam o Claude".
 *
 * Origem: referência ee56ced6 (reel do @sebastianhardy_, 655 curtidas e 2.326
 * comentários), capturada pelo Telegram em 07/08/2026. O que fez aquele post
 * render foi a estrutura de lista curta de MCP com nome próprio + CTA de palavra
 * gatilho. É isso que estamos pegando.
 *
 * A REFERÊNCIA lista Perplexity, Firecrawl, Playwright e Context7. Trocamos o
 * Perplexity: o MCP oficial dele roda na API da Perplexity, que é PAGA por uso,
 * e a promessa da capa é "grátis". No lugar entrou o Memory (servidor de
 * referência oficial do MCP), que é grátis, sem chave, e cobre uma dor que os
 * outros três não cobrem: o Claude esquecer tudo entre uma sessão e outra. A
 * pesquisa na web que o Perplexity fazia continua coberta pelo Firecrawl, que
 * tem busca além da raspagem.
 *
 * Precisão (Article IV): tudo conferido em 07/08/2026.
 *   Playwright MCP: pacote oficial @playwright/mcp, da Microsoft. A doc do
 *     próprio Playwright manda `claude mcp add playwright npx
 *     @playwright/mcp@latest` e pede Node 18+. Open source, sem chave.
 *   Context7 (Upstash): `claude mcp add --transport http context7
 *     https://mcp.context7.com/mcp`. Funciona SEM chave com limite básico; a
 *     chave grátis do dashboard só aumenta o limite. Entrega doc da versão certa.
 *   Memory: servidor de referência do repo modelcontextprotocol/servers, um dos
 *     que seguem mantidos (Everything, Fetch, Filesystem, Git, Memory,
 *     Sequential Thinking, Time). Roda com `npx -y
 *     @modelcontextprotocol/server-memory`. Memória persistente em grafo, local.
 *   Firecrawl: `claude mcp add firecrawl -e FIRECRAWL_API_KEY=… -- npx -y
 *     firecrawl-mcp`. Plano grátis de 1.000 páginas por mês, renovando todo mês.
 *     É o único dos quatro que pede cadastro pra gerar a chave, e o slide diz
 *     isso em vez de esconder.
 * NÃO afirmamos preço de plano pago, número de estrelas nem limite de rate.
 * SEM travessão.
 *
 * PENDENTE 1 (arte): a capa sai no gradiente JARVIS. O teste combinado é meme de
 * gato em tela cheia, pra ver se para o dedo (ver o briefing). Quando o arquivo
 * chegar, é só apontar `bgImage` e re-renderizar.
 * PENDENTE 2 (presente): o CTA promete um guia na DM. Falta a página do Notion e
 * o `linkPresente` aqui.
 */
import type { Carrossel } from '../types';

export const quatroMcpGratis: Carrossel = {
  slug: '4-mcp-gratis',
  // Igual ao título do rascunho que o pipeline gerou: o render apaga o card com
  // este título e grava o novo, então bater o texto é o que evita card duplicado.
  titulo: '4 MCP grátis que destravam o Claude',
  gancho: 'Sozinho, o Claude não sai do chat. Quatro MCP de graça mudam isso.',
  dataProgramada: '2026-08-12',
  refsLinks: 'https://www.instagram.com/reel/Dbs-uI9sY2w/ (referência: @sebastianhardy_)',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      titulo: 'Sozinho, o Claude\nnão sai do **chat**',
      subtitulo: '4 MCP de graça mudam isso.',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      topIcon: 'puzzle',
      eyebrow: 'Antes da lista',
      titulo: 'MCP é a **tomada**\ndo Claude',
      corpo:
        'Model Context Protocol, um padrão aberto da Anthropic. É por ele que ferramenta de fora entra no Claude: o navegador, os sites, a documentação da sua lib, a memória do projeto. Sem MCP, ele só conversa.',
      calloutLabel: 'A real:',
      callout: '"Sem MCP você tem um chat esperto. Com MCP você tem alguém que executa."',
    },
    {
      variant: 'light',
      topIcon: 'mouse',
      eyebrow: '1. Playwright MCP',
      titulo: 'Ele abre o navegador\ne **usa de verdade**',
      corpo:
        'Clica, preenche formulário, tira print e lê o que apareceu na tela. É o pacote oficial do Playwright, mantido pela Microsoft, open source e sem chave de API. Só precisa de Node 18 pra cima.',
      calloutLabel: 'Serve pra:',
      callout: '"Conferir se a sua tela quebrou depois da última mudança, sem você abrir o Chrome."',
    },
    {
      variant: 'purple',
      topIcon: 'globe',
      eyebrow: '2. Firecrawl MCP',
      // Sem destaque: no fundo roxo o realce vira roxo claro sobre roxo e some.
      titulo: 'Qualquer site vira\ntexto limpo pra IA',
      corpo:
        'Ele raspa a página e devolve só o conteúdo, sem menu e sem propaganda, e também busca na web. É o que tira o Claude do "eu só sei até a data do treino". O plano grátis dá mil páginas por mês e renova todo mês.',
    },
    {
      variant: 'dark',
      topIcon: 'bookmark',
      eyebrow: '3. Context7',
      titulo: 'A documentação\n**da versão que\nvocê usa**',
      corpo:
        'Ele injeta a doc atualizada da biblioteca na resposta, na hora. O Claude para de chamar função que foi removida três versões atrás. Funciona sem chave nenhuma, e a chave grátis só serve pra aumentar o limite.',
    },
    {
      variant: 'light',
      topIcon: 'map',
      eyebrow: '4. Memory',
      titulo: 'Ele **lembra** do seu\nprojeto amanhã',
      corpo:
        'Servidor oficial do próprio MCP. Guarda o que importa (a decisão que vocês tomaram, o padrão do time, o que já deu errado) num grafo na sua máquina e lê de volta na sessão seguinte. Você para de reexplicar o projeto toda vez.',
    },
    {
      variant: 'dark',
      denso: true,
      eyebrow: 'Salva esse slide',
      titulo: 'Os 4 comandos,\n**um de cada vez**',
      terminal: [
        '$ claude mcp add playwright \\',
        '    npx @playwright/mcp@latest',
        '$ claude mcp add --transport http context7 \\',
        '    https://mcp.context7.com/mcp',
        '$ claude mcp add memory \\',
        '    npx -y @modelcontextprotocol/server-memory',
        // Em 3 linhas de propósito: numa só, o `firecrawl-mcp` estoura a caixa.
        '$ claude mcp add firecrawl \\',
        '    -e FIRECRAWL_API_KEY=sua-chave \\',
        '    -- npx -y firecrawl-mcp',
        '✓ claude mcp list',
      ],
      corpo:
        'Só o Firecrawl pede cadastro pra gerar a chave. Roda o último comando pra ver os quatro conectados antes de sair usando.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o passo a passo\ndos quatro?',
      botao: 'Comente MCP 👇',
      corpo:
        'Comenta MCP que eu te mando o guia com o comando de cada um, o que fazer quando der erro na instalação e o que pedir pro Claude no primeiro teste de cada MCP.',
    },
  ],
  legenda:
    // A 1ª frase é curta de propósito: a linha de follow come o começo do preview
    // (ver memória descricao-insta-linha-follow). "MCP" aparece logo e se repete.
    'Seu Claude está preso no chat, e não é falta de plano pago.\n\n' +
    'MCP (Model Context Protocol) é um padrão aberto da Anthropic. É por ele que ferramenta de fora entra no Claude: ' +
    'navegador, sites, documentação, memória. Esses quatro são de graça e mudam o que ele consegue fazer.\n\n' +
    '1. Playwright MCP (@playwright/mcp, da Microsoft): abre o navegador de verdade, clica, preenche formulário e tira ' +
    'print. Open source, sem chave de API, só pede Node 18 pra cima.\n' +
    'claude mcp add playwright npx @playwright/mcp@latest\n\n' +
    '2. Firecrawl MCP: raspa qualquer site e devolve o conteúdo limpo, e também busca na web, então ele para de ' +
    'responder só do que decorou até a data do treino. Plano grátis de mil páginas por mês.\n' +
    'claude mcp add firecrawl -e FIRECRAWL_API_KEY=sua-chave -- npx -y firecrawl-mcp\n\n' +
    '3. Context7 (Upstash): injeta a documentação atualizada da sua lib na resposta, então o Claude para de chamar ' +
    'função que já foi removida. Funciona sem chave; a chave grátis só aumenta o limite.\n' +
    'claude mcp add --transport http context7 https://mcp.context7.com/mcp\n\n' +
    '4. Memory (servidor oficial do MCP): memória que sobrevive ao fim da sessão. Guarda decisão, padrão do time e o ' +
    'que já deu errado num grafo na sua máquina, e lê de volta amanhã.\n' +
    'claude mcp add memory npx -y @modelcontextprotocol/server-memory\n\n' +
    'Aviso honesto: só o Firecrawl pede cadastro pra gerar a chave. E cada MCP instalado ocupa um pedaço do contexto ' +
    'em toda resposta, então instala o que resolve a sua dor, não os quatro de uma vez por empolgação.\n\n' +
    'Comenta MCP aqui embaixo que eu te mando o guia com o comando de cada um e o que pedir pro Claude no primeiro ' +
    'teste. 👇',
  hashtags:
    'mcp claudecode claude inteligenciaartificial programacao devweb iagratis vibecoding devemdobro produtividadedev',
  ctaFinal:
    'Comenta MCP que eu te mando o guia com o comando de cada um, o que fazer quando der erro e o que pedir pro Claude ' +
    'no primeiro teste.',
  briefing:
    '🐱 TESTE DE CAPA (só neste carrossel): meme de gato na capa.\n' +
    'Por quê: a previsão deu capa 3/5 no Fura a Bolha, longa e explicativa demais pra parar o dedo. O meme entra como ' +
    'isca visual: segura o scroll primeiro, o conteúdo convence depois.\n' +
    'Como medir: alcance e quantos passam do slide 1, comparados com a média dos últimos carrosséis. Subiu, testa em ' +
    'mais capas; não subiu, volta o padrão (objeto em tela cheia + texto no rodapé).\n' +
    'Escopo: só este post, é experimento. Hoje a capa está no gradiente, esperando a arte.\n\n' +
    'ORIGEM: reel do @sebastianhardy_ (655 curtidas, 2.326 comentários), capturado pelo Telegram em 07/08/2026. ' +
    'Ratio de comentário altíssimo, puxado pela palavra gatilho.\n\n' +
    'O QUE MUDOU EM RELAÇÃO À REFERÊNCIA\n' +
    'Ele lista Perplexity, Firecrawl, Playwright e Context7. O MCP oficial da Perplexity roda na API dela, que é paga ' +
    'por uso, e a capa promete grátis. Trocamos pelo Memory (servidor de referência oficial do MCP, sem chave), que ' +
    'ainda cobre uma dor que os outros três não cobrem: o Claude esquecer tudo entre sessões. A busca na web que o ' +
    'Perplexity fazia continua no Firecrawl.\n' +
    'A capa encurtou: o gancho do rascunho tinha duas frases competindo. Ficou uma ideia só.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 capa: uma tensão só (ele não sai do chat).\n' +
    'Regra 2: o slide 2 explica o que é MCP em uma frase e já dá a metáfora da tomada.\n' +
    'Regra 3: cada MCP funciona printado sozinho.\n' +
    'Regra 4 slide salvável: o slide 7 tem os quatro comandos literais.\n' +
    'Regra 5: CTA único, comenta MCP.\n\n' +
    '🔮 PREVISÃO DA IA (registrada em 07/08/2026, ANTES de publicar)\n' +
    'Classe esperada: Saudável (confiança média). Números previstos: salvamentos 2,3% do alcance, compartilhamentos ' +
    '0,6% do alcance. Fura a Bolha: 22/25 (capa 3, slide 2 4, slide sozinho 5, salvável 5, CTA 5).\n' +
    'Aposta principal: salvamentos, puxados pelo slide dos comandos.\n' +
    'Riscos: tema de nicho (quem não usa Claude rola direto); o post lista mas não mostra a instalação na tela; a ' +
    'capa do rascunho era longa demais (foi encurtada e vai ganhar o meme).\n' +
    '⏳ INSIGHTS A VERIFICAR depois de publicar: alcance, salvamentos, compartilhamentos e comentários com a palavra ' +
    'MCP. Lançar no "Resumo de desempenho" e comparar previsto x real.\n\n' +
    'PENDENTE: página do Notion com o guia dos 4 MCP + link em linkPresente. Sem ela, o "comenta MCP" não tem o que ' +
    'entregar.',
};
