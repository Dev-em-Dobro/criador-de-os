/**
 * apps/dobro — carrossel "Agent Reach: a skill que dá internet pro seu agente".
 *
 * Origem: card do board de 22/08/2026, que tinha gancho e CTA mas nenhum slide.
 *
 * DECISÃO DE FORMATO (20/08/2026): o rascunho era FERRAMENTA ÚNICA, e o nosso
 * banco diz que ferramenta única rende pouco seguidor (o Graphify trouxe 1; a
 * lista de 7 repos trouxe 282). A saída foi manter a ferramenta única e mudar o
 * RECORTE: cada slide é uma coisa que o seu agente passa a conseguir ler. Vira
 * lista sem deixar de ser sobre um repo só.
 *
 * Precisão (Article IV): tudo abaixo foi lido na página do repo e na doc em
 * 20/08/2026 (github.com/Panniantong/Agent-Reach).
 *   "73.3k stars" e "MIT license" na página do repo.
 *   Plataformas declaradas: páginas web, YouTube, RSS, GitHub, Twitter/X, Reddit,
 *     Facebook, Instagram, Bilibili, XiaoHongShu, LinkedIn, V2EX, Snowball,
 *     Xiaoyuzhou, e busca global via Exa.
 *   "Zero API fees" para a maior parte; a busca usa Exa por MCP.
 *   Requisitos: Python 3.10+; Node.js, gh CLI e mcporter opcionais.
 *   RESSALVA que vai no slide 7: plataforma com login (Twitter, Reddit, Facebook,
 *     Instagram, LinkedIn, XiaoHongShu) exige exportar cookie ou sessão do
 *     navegador. O Reddit NÃO tem caminho de configuração zero. A doc assume que
 *     plataforma bloqueia e eles remendam ("Platform封了我们修").
 * NÃO afirmamos número de downloads nem comparação de preço com serviço pago,
 * porque isso não está na fonte. SEM travessão.
 *
 * PENDENTE: arte de capa (nasce com semFundo, esperando a arte do dono) e a
 * página do presente no Notion com o comando de instalação.
 */
import type { Carrossel } from '../types';

export const agentReach: Carrossel = {
  slug: 'agent-reach',
  // Nome próprio no título vale 22 seguidores medianos contra 1 de categoria
  // ("agente", "IA"). Ver memória medir-antes-de-propor.
  titulo: '4 coisas que o Claude Code não lê, e o repo grátis',
  gancho: 'O Claude Code escreve código sozinho e trava pra ler um vídeo do YouTube. São 4 buracos.',
  dataProgramada: '2026-08-22T00:00:00.000Z',
  refsLinks: 'https://github.com/Panniantong/Agent-Reach',
  /** Capa sem arte: espera a imagem do dono (ver memória capa-quem-faz-e-o-dono). */
  linkPresente: '',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      tituloMenor: true,
      // O texto grande da capa é o TÍTULO do post; a tensão vai pro subtítulo
      // (ver memória capa-repete-o-titulo).
      titulo: '**4 coisas** que o\n**Claude Code**\nnão lê',
      subtitulo: 'Ele escreve código sozinho e trava pra ler um vídeo do YouTube. Tem repo grátis pra isso.',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      eyebrow: 'Antes de você duvidar',
      titulo: 'Não é raspador\ncaseiro, é **código\naberto**',
      itens: [
        { icone: 'git', titulo: 'Licença MIT, 73 mil estrelas', sub: 'O código está no GitHub e qualquer um lê o que ele faz' },
        { icone: 'ban', titulo: 'Sem chave de API na maior parte', sub: 'Você não assina nem cadastra nada pra começar' },
        { icone: 'laptop', titulo: 'Roda junto do seu agente', sub: 'Serve Claude Code, Cursor e outros, pelo próprio terminal' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Destrava 01',
      titulo: '**YouTube**',
      subtitulo: 'O vídeo vira texto pro agente ler.',
      corpo:
        'Ele puxa a legenda do vídeo e busca dentro do YouTube. Na prática, o seu agente passa a estudar uma aula de uma hora sem você assistir e sem transcrever nada na mão.',
    },
    {
      variant: 'dark',
      eyebrow: 'Destrava 02',
      titulo: '**GitHub**',
      subtitulo: 'Repositório, issue e código, direto.',
      corpo:
        'Busca e lê repositório público, issue e arquivo de código. É o que separa "a IA acha que a biblioteca funciona assim" de "a IA leu a implementação antes de responder".',
    },
    {
      variant: 'purple',
      eyebrow: 'Destrava 03',
      titulo: '**Qualquer página**',
      subtitulo: 'E também RSS e Atom.',
      corpo:
        'Lê página web e assina feed RSS ou Atom de qualquer fonte. É como o agente acompanha changelog, blog e release de ferramenta sem você abrir aba nenhuma.',
    },
    {
      variant: 'light',
      eyebrow: 'Destrava 04',
      titulo: '**Rede social**',
      subtitulo: 'Twitter, Reddit, Instagram e LinkedIn.',
      corpo:
        'Também alcança Facebook, Bilibili, XiaoHongShu e V2EX. Essas exigem um passo a mais, e o slide seguinte explica exatamente qual.',
    },
    {
      variant: 'dark',
      eyebrow: 'O aviso honesto',
      titulo: 'O que **exige\nconfiguração**',
      itens: [
        { icone: 'ban', titulo: 'Plataforma com login pede cookie', sub: 'Twitter, Reddit, Instagram e LinkedIn precisam da sua sessão exportada' },
        { icone: 'laptop', titulo: 'O Reddit não tem caminho automático', sub: 'A própria doc avisa que ali não existe configuração zero' },
        { icone: 'git', titulo: 'Precisa de Python 3.10 ou mais novo', sub: 'E a doc assume que plataforma bloqueia e eles remendam depois' },
      ],
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o comando\nde instalação?',
      botao: 'Comente REACH 👇',
      // Três entregas distintas: o material, o que fazer quando dá errado e o
      // próximo passo (ver memória cta-tres-entregas).
      corpo: 'Te mando o link do repositório, o comando que instala tudo e o que fazer quando a plataforma bloqueia.',
    },
  ],
  legenda:
    'Seu agente de IA escreve código sozinho e trava pra ler um vídeo do YouTube.\n\n' +
    'O Agent Reach é um repositório open source com licença MIT e 73 mil estrelas no GitHub que resolve isso. ' +
    'Ele instala os leitores que faltam no seu agente, sem chave de API na maior parte das fontes.\n\n' +
    'O que o seu agente passa a conseguir ler:\n\n' +
    '1. YouTube: legenda de vídeo e busca dentro da plataforma. Uma aula de uma hora vira texto pro agente estudar.\n\n' +
    '2. GitHub: repositório público, issue e arquivo de código. A IA lê a implementação antes de responder sobre ela.\n\n' +
    '3. Qualquer página web, mais feed RSS e Atom. Changelog e release chegam sem você abrir aba.\n\n' +
    '4. Rede social: Twitter, Reddit, Instagram, LinkedIn, Facebook e outras.\n\n' +
    'Aviso honesto: as plataformas que exigem login precisam da sua sessão exportada por cookie, e o Reddit não tem ' +
    'caminho de configuração automática. Precisa de Python 3.10 ou mais novo. A própria documentação assume que ' +
    'plataforma bloqueia de vez em quando e eles corrigem depois.\n\n' +
    'Comenta REACH aqui embaixo que eu te mando o link do repositório, o comando de instalação e o que fazer quando a plataforma bloqueia o acesso. 👇',
  hashtags: 'claudecode agentesdeia opensource inteligenciaartificial githubtrending',
  ctaFinal: 'Comenta REACH que eu te mando o link do repositório, o comando de instalação e o que fazer quando a plataforma bloqueia.',
  briefing:
    'FÓRMULA: ferramenta única com RECORTE DE LISTA. O rascunho era só "esse repo é bom"; virou "as 4 coisas que o ' +
    'seu agente passa a conseguir ler". Motivo: no nosso banco, ferramenta única rende pouco seguidor (Graphify: 1) ' +
    'e lista rende muito (7 repos: 282). Aqui o formato é lista sem deixar de ser sobre um repo só.\n\n' +
    'FATOS CONFERIDOS em 20/08/2026 na página do repo (github.com/Panniantong/Agent-Reach): licença MIT, 73,3 mil ' +
    'estrelas, zero API fee na maior parte, Python 3.10+, busca global via Exa por MCP.\n' +
    'NÃO afirmamos preço de concorrente nem número de downloads, porque não está na fonte.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): a contradição que todo mundo já viveu, a IA que programa sozinha e não lê um vídeo.\n' +
    'Regra 2 (o slide 2 confirma): mata a objeção de gambiarra com licença, estrelas e sem chave de API.\n' +
    'Regra 3 (slide sozinho): uma fonte destravada por slide.\n' +
    'Regra 4 (salvável): o slide 7 é o aviso honesto, que é o que a pessoa volta pra reler antes de instalar. O ' +
    'comando de instalação NÃO entra no carrossel, é o que se pega comentando.\n' +
    'Regra 5 (CTA único): comenta REACH.\n\n' +
    'PENDENTE: arte de capa (nasce com semFundo) e a página do presente no Notion com o comando.',
};
