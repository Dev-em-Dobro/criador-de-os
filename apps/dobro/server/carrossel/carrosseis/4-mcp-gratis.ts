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
 * CAPA: a conversa com as quatro recusas, gerada por `server/scripts/arte-4-mcp.cjs`.
 * O teste do meme de gato ficou de fora: sem o arquivo em mãos, a capa saía no
 * gradiente vazio, e capa vazia é pior que capa sem meme. Se o gato aparecer, é
 * trocar a `bgImage` e re-renderizar.
 * PRESENTE: pronto (Notion, em `linkPresente`). Traz os quatro comandos com
 * `-s user`, o primeiro teste de cada MCP e a tabela de erro por sintoma.
 */
import type { Carrossel } from '../types';

export const quatroMcpGratis: Carrossel = {
  slug: '4-mcp-gratis',
  // Igual ao título do rascunho que o pipeline gerou: o render apaga o card com
  // este título e grava o novo, então bater o texto é o que evita card duplicado.
  titulo: '4 MCP grátis que destravam o Claude',
  gancho: 'Você usa 1% do poder do Claude sem esses 4. E os quatro são de graça.',
  dataProgramada: '2026-08-12',
  refsLinks: 'https://www.instagram.com/reel/Dbs-uI9sY2w/ (referência: @sebastianhardy_)',
  linkPresente: 'https://app.notion.com/p/3ba6dd01fb4881e0aea8f2ddff7b82fb',
  /**
   * A capa é o Claude no centro e os quatro MCP ligados a ele por setas, com o
   * nome de cada um borrado atrás de um "?". É o que faz deslizar: mostra que
   * existem quatro e esconde quais são. Imagem gerada por IA a partir da
   * referência do dono, com o terço de baixo vazio pro texto.
   * A arte é CLARA, então `scrim: 'claro'`: nenhum preto por cima e o texto vira
   * escuro. O escurecido padrão viraria uma faixa cinza suja sobre o bege.
   */
  bgImage: 'server/carrossel/assets/4-mcp-gratis/capa.png',
  slides: [
    {
      variant: 'photo',
      cover: true,
      scrim: 'claro',
      baixo: true,
      // 3 linhas no tamanho cheio subiam por cima da conversa e cortavam a última
      // recusa. Mesma calibragem da capa do claude-md, que também tem 3 linhas.
      tituloMenor: true,
      tituloEscala: 1.05,
      titulo: 'Você usa **1%**\ndo poder do Claude\nsem esses 4',
      subtitulo: 'Os quatro são de graça.',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      topIcon: 'puzzle',
      eyebrow: 'Antes da lista',
      titulo: 'MCP é a **tomada**\ndo Claude',
      corpo:
        'Model Context Protocol, um padrão aberto da Anthropic. É por ele que ferramenta de fora entra no Claude: o navegador, os sites, o manual das ferramentas que você usa, a memória do projeto. Sem MCP, ele só conversa.',
      calloutLabel: 'A real:',
      callout: '"Sem MCP você tem um chat esperto. Com MCP você tem alguém que executa."',
    },
    {
      variant: 'light',
      topIcon: 'mouse',
      eyebrow: 'MCP 1 de 4',
      // O NOME é o título, grande, e o que ele faz vem na linha de baixo: quem
      // rola o feed precisa sair sabendo o nome pra procurar depois.
      titulo: 'Playwright',
      tituloEscala: 1.36,
      subtitulo: 'Empresta o seu navegador pro Claude',
      corpo:
        'Ele **abre o site, clica nos botões e preenche formulário** como uma pessoa faria, e tira foto da tela pra te contar o que apareceu. É oficial, feito pela Microsoft, e não pede cadastro. Só precisa do Node 18 ou mais novo instalado.',
      calloutDepois: true,
      calloutLabel: 'Um exemplo:',
      callout: '"Entra na tela de login, tenta entrar com a senha errada e me diz se o aviso de erro aparece."',
    },
    {
      variant: 'purple',
      topIcon: 'globe',
      eyebrow: 'MCP 2 de 4',
      // Sem destaque: no fundo roxo o realce vira roxo claro sobre roxo e some.
      titulo: 'Firecrawl',
      tituloEscala: 1.36,
      subtitulo: 'Faz o Claude ler qualquer site',
      corpo:
        'Você manda o endereço e ele traz só o texto que interessa, sem menu e sem propaganda no meio. Também pesquisa na internet, então o Claude para de responder só com o que aprendeu até a data em que foi treinado. O plano grátis dá mil páginas por mês.',
      calloutDepois: true,
      calloutLabel: 'Um exemplo:',
      callout: '"Lê esse tutorial e me devolve só o passo a passo, sem a história de vida do autor."',
    },
    {
      variant: 'dark',
      topIcon: 'bookmark',
      eyebrow: 'MCP 3 de 4',
      titulo: 'Context7',
      tituloEscala: 1.36,
      subtitulo: 'Traz o manual da versão que você usa',
      corpo:
        'Toda ferramenta muda com o tempo, e o Claude aprendeu a versão de um tempo atrás. Esse aqui **busca o manual de agora** e entrega junto com a pergunta, então ele para de te ensinar um jeito que já foi apagado. Funciona sem cadastro nenhum.',
      calloutDepois: true,
      calloutLabel: 'Um exemplo:',
      callout: '"Isso que você me mandou ainda funciona na versão nova? Me mostra como se escreve hoje."',
    },
    {
      variant: 'light',
      topIcon: 'map',
      eyebrow: 'MCP 4 de 4',
      titulo: 'Memory',
      tituloEscala: 1.36,
      // Uma linha só: com "Faz o Claude lembrar do seu projeto amanhã" a frase
      // quebrava e deixava "amanhã" sozinho na segunda linha.
      subtitulo: 'Ele lembra do seu projeto amanhã',
      corpo:
        'Hoje toda conversa começa do zero e você explica tudo de novo. Com ele, o que importa (a decisão que vocês tomaram, o jeito que o time faz, o que já deu errado) **fica guardado no seu computador** e volta sozinho na próxima conversa.',
      calloutDepois: true,
      calloutLabel: 'Um exemplo:',
      callout: '"Guarda isso: aqui a gente não mexe na pasta antiga e não manda nada pro ar sem revisão."',
    },
    {
      variant: 'dark',
      eyebrow: 'Como instalar',
      // "uma linha" brigava com a barra de continuação que aparece no comando.
      titulo: 'Instalar é\n**um comando**',
      // Um comando só, de exemplo, no tamanho normal. A versão anterior trazia os
      // quatro literais (11 linhas em corpo `denso`): virava um paredão que
      // ninguém lê no feed, e slide que não se lê não se salva. Os outros três
      // seguem o mesmo formato e vão inteiros no presente, o que ainda dá mais
      // motivo pra comentar.
      terminal: [
        '$ claude mcp add playwright \\',
        '    npx @playwright/mcp@latest',
        '✓ claude mcp list',
      ],
      corpo:
        'Esse é o do Playwright, de exemplo. Os outros três são iguais, muda o nome e o endereço. O segundo comando mostra quais já estão conectados. Escreva **-s user** depois do add pra valer em todos os projetos, e não só neste.',
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
    '1. Playwright, que empresta o seu navegador pro Claude: ele abre o site, clica nos botões, preenche formulário e ' +
    'tira foto da tela pra te contar o que apareceu. É oficial, feito pela Microsoft, e não pede cadastro. Só precisa ' +
    'do Node 18 ou mais novo.\n' +
    'claude mcp add playwright npx @playwright/mcp@latest\n\n' +
    '2. Firecrawl, que faz o Claude ler qualquer site: você manda o endereço e ele traz só o texto que interessa, sem ' +
    'menu e sem propaganda. Também pesquisa na internet, então ele para de responder só com o que aprendeu até a data ' +
    'em que foi treinado. O plano grátis dá mil páginas por mês.\n' +
    'claude mcp add firecrawl -e FIRECRAWL_API_KEY=sua-chave -- npx -y firecrawl-mcp\n\n' +
    '3. Context7, que traz o manual da versão que você usa: toda ferramenta muda com o tempo, e ele busca o manual de ' +
    'agora e entrega junto com a pergunta, então o Claude para de te ensinar um jeito que já foi apagado. Funciona sem ' +
    'cadastro nenhum.\n' +
    'claude mcp add --transport http context7 https://mcp.context7.com/mcp\n\n' +
    '4. Memory, que faz ele lembrar do seu projeto amanhã: hoje toda conversa começa do zero e você explica tudo de ' +
    'novo. Com ele, a decisão que vocês tomaram e o jeito que o time faz ficam guardados no seu computador e voltam na ' +
    'próxima conversa.\n' +
    'claude mcp add memory npx -y @modelcontextprotocol/server-memory\n\n' +
    'Um detalhe que pega muita gente: do jeito que está acima, o MCP vale só no projeto onde você rodou o comando. ' +
    'Pra ter em todos, escreva -s user logo depois do add.\n\n' +
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
    'CAPA: a conversa em tela cheia, com quatro pedidos normais e quatro recusas do Claude sem ferramenta, uma pra ' +
    'cada MCP da lista (não acesso sites → Firecrawl, não abro seu navegador → Playwright, minha doc parou no treino ' +
    '→ Context7, essa conversa começou do zero → Memory). A previsão tinha dado capa 3/5 no Fura a Bolha por ser ' +
    'explicativa demais; mostrar a recusa em vez de descrever a dor é a tentativa de resolver isso.\n' +
    'O teste do meme de gato ficou pra outro post: sem o arquivo, a alternativa era publicar no gradiente vazio.\n' +
    'Como medir: quantos passam do slide 1, comparado com a média dos últimos carrosséis.\n\n' +
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
    'Regra 4 slide salvável: o slide 7 traz UM comando legível, de exemplo, e diz que os outros três são iguais. A ' +
    'primeira versão trazia os quatro literais em corpo denso, e virava um paredão de 11 linhas que ninguém lê no ' +
    'feed. Os quatro completos ficaram no presente, o que também dá mais motivo pra comentar.\n' +
    'Regra 5: CTA único, comenta MCP.\n\n' +
    '🔮 PREVISÃO DA IA (registrada em 07/08/2026, ANTES de publicar)\n' +
    'Classe esperada: Saudável (confiança média). Números previstos: salvamentos 2,3% do alcance, compartilhamentos ' +
    '0,6% do alcance. Fura a Bolha: 22/25 (capa 3, slide 2 4, slide sozinho 5, salvável 5, CTA 5).\n' +
    'Aposta principal: salvamentos, puxados pelo slide dos comandos.\n' +
    'Riscos: tema de nicho (quem não usa Claude rola direto); o post lista mas não mostra a instalação na tela; a ' +
    'capa do rascunho era longa demais (foi encurtada e vai ganhar o meme).\n' +
    '⏳ INSIGHTS A VERIFICAR depois de publicar: alcance, salvamentos, compartilhamentos e comentários com a palavra ' +
    'MCP. Lançar no "Resumo de desempenho" e comparar previsto x real.\n\n' +
    'PRESENTE: pronto (Notion, em linkPresente). Entrega os quatro comandos com `-s user` (o escopo padrão é local, ' +
    'e é por isso que muita gente instala e acha que sumiu no outro projeto), o primeiro teste de cada MCP e uma ' +
    'tabela de erro por sintoma. Nada de captação da Semana: o presente entrega só o que este post prometeu.\n\n' +
    'CONFERÊNCIA DE FATO (12/08/2026, refeita antes de publicar): @playwright/mcp v0.0.79, repo microsoft/' +
    'playwright-mcp, engines node >=18. @modelcontextprotocol/server-memory v2026.7.4, repo modelcontextprotocol/' +
    'servers, sem deprecação. Firecrawl: 1.000 créditos por mês que renovam e não acumulam. Context7: roda sem chave, ' +
    'a chave grátis só aumenta o limite. Escopos e status do `claude mcp list` conferidos na doc oficial.',
};
