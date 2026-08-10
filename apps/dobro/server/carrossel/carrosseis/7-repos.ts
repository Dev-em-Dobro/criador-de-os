/**
 * apps/dobro — carrossel "7 repos open source que substituem software pago".
 *
 * Origem: rascunho do pipeline (card 38156fc1, referência @guilhermemorais.ia com
 * 35.659 curtidas). Portado em 07/08/2026 pro molde do cara-de-caro: uma
 * ferramenta por slide, cada uma no PRÓPRIO print, slide salvável com os
 * endereços e CTA único.
 *
 * MUDANÇAS EM RELAÇÃO AO RASCUNHO (conferidas em 07/08/2026):
 *   Fooocus SAIU. O repo declara "Limited Long-Term Support (LTS) with Bug Fixes
 *     Only" e é preso ao SDXL. No lugar entrou o ComfyUI, ativo e com 124K no
 *     próprio site.
 *   "Whisper cobre cerca de 99 idiomas" SAIU: esse número não está no README.
 *     O que o repo afirma é "Robust Speech Recognition" com licença MIT.
 *   O slide que juntava Bitwarden e Penpot virou dois slides (regra do slide que
 *     se sustenta sozinho).
 *
 * Precisão (Article IV): tudo o que é afirmado aqui foi lido nos prints tirados
 * em 07/08/2026 (fonte primária, ver assets/7-repos/).
 *   Ollama: "Build with open models, on your computer and in the cloud";
 *     "Free to start. See pricing"; integra com Claude Code e OpenCode.
 *   Whisper: página do repo com "MIT license", "106.8k stars", "Robust Speech
 *     Recognition via Large-Scale Weak Supervision", commit da semana passada.
 *   ComfyUI: "Professional Control of Visual AI"; "the AI creation engine for
 *     visual professionals who demand control over every model, every parameter,
 *     and every output"; badge 124K; logos de Netflix, Nike, HP e Autodesk.
 *   Bitwarden: "THE MOST TRUSTED PASSWORD MANAGER"; "open source, end-to-end
 *     encrypted"; plano free com dispositivos e senhas ilimitados, "always free".
 *   Penpot: "the open-source design platform for teams"; a home oferece
 *     "Sign up, it's free" e "Self-host install" lado a lado.
 *   yt-dlp: "A feature-rich command-line audio/video downloader"; Unlicense;
 *     "183.0k stars"; release yt-dlp 2026.07.04 no mês passado.
 *   AppFlowy: "Bring projects, wikis, and teams together with AI"; "The AI
 *     workspace where you achieve more without losing control of your data";
 *     badge Star 75.0K.
 * NÃO afirmamos preço de concorrente nem número de estrelas que não esteja no
 * print. Ollama, ComfyUI, Penpot, Bitwarden e AppFlowy TÊM plano pago opcional,
 * e é por isso que a legenda avisa em vez de vender "tudo de graça" (o aviso
 * ficava no slide dos 7 endereços, retirado em 10/08/2026). SEM travessão.
 *
 * PENDENTE: arte de capa. Hoje usa o gradiente JARVIS. O ideal, pelas capas
 * campeãs, é o objeto em tela cheia (ex.: mosaico dos 7 prints ou o octógono do
 * polvo cercado dos logos).
 */
import type { Carrossel } from '../types';

const SHOT = 'server/carrossel/assets/7-repos';

export const seteRepos: Carrossel = {
  slug: '7-repos',
  titulo: '7 repos open source que substituem software pago',
  gancho: '7 repos do GitHub que substituem software que cobra todo mês, rodando no seu PC.',
  // Sem hora (meia-noite = "sem hora" no board). Vale só pra card NOVO: se o card
  // já existe, o render preserva o agendamento feito na tela.
  dataProgramada: '2026-08-10T00:00:00.000Z',
  refsLinks: 'https://www.instagram.com/p/Da1Fs8YlLnG/ (referência: @guilhermemorais.ia)',
  /**
   * Arte da capa (imagem do dono, 10/08/2026): o gambá de óculos escuros e
   * camiseta do GitHub fugindo pelo beco com o saco de "roubo". É a piada do
   * "parecem ilegais" em imagem. Já vem em 4:5 (1122×1402), a mesma proporção do
   * slide, então o `cover` padrão encaixa sem cortar nada, e o rodapé escuro da
   * própria arte é onde o texto cai.
   */
  bgImage: 'server/carrossel/assets/7-repos/capa.png',
  /** Presente do "comenta REPO": os 7 links + comando de instalação (Notion, 07/08/2026). */
  linkPresente: 'https://app.notion.com/p/3b56dd01fb4881ff971ef319a3d4a512',
  slides: [
    {
      variant: 'photo',
      cover: true,
      tituloMenor: true,
      tituloEscala: 1.15,
      titulo: '7 repositórios\ndo GitHub que\nparecem **ilegais**',
      subtitulo: 'Eles substituem as ferramentas pagas mais caras do mercado.',
      swipe: 'Deslize e veja os 7 ›',
    },
    {
      variant: 'dark',
      eyebrow: 'Antes de você duvidar',
      titulo: 'Não é versão pirata,\né **código aberto**',
      itens: [
        { icone: 'git', titulo: 'O código está no GitHub', sub: 'Licença aberta, qualquer um lê o que o programa faz' },
        { icone: 'laptop', titulo: 'Roda na sua máquina', sub: 'Você baixa e usa, sem depender do servidor de ninguém' },
        { icone: 'ban', titulo: 'Sem mensalidade pra abrir', sub: 'O que você instala no seu PC não cobra assinatura' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Repo 01',
      titulo: '**ComfyUI**',
      corpo:
        'Geração de imagem por IA sem crédito e sem nuvem. O site se apresenta como controle profissional sobre cada modelo e cada parâmetro, e estampa Netflix, Nike e HP entre quem usa.',
      imagem: `${SHOT}/comfyui.png`,
    },
    {
      variant: 'dark',
      eyebrow: 'Repo 02',
      titulo: '**Ollama**',
      corpo:
        'IA rodando dentro do seu computador. A própria página abre com "build with open models, on your computer", e ele conversa com editor e terminal, incluindo o Claude Code.',
      imagem: `${SHOT}/ollama.png`,
    },
    {
      variant: 'purple',
      eyebrow: 'Repo 03',
      titulo: '**Whisper**',
      corpo:
        'Áudio virando texto no seu PC. É o modelo de reconhecimento de fala da OpenAI com licença MIT, 106 mil estrelas no GitHub e commit da semana passada.',
      imagem: `${SHOT}/whisper.png`,
    },
    {
      variant: 'light',
      eyebrow: 'Repo 04',
      titulo: '**Bitwarden**',
      corpo:
        'Suas senhas num cofre de código aberto, com criptografia ponta a ponta. O plano grátis dá senhas e dispositivos ilimitados, e o site escreve "always free" com todas as letras.',
      imagem: `${SHOT}/bitwarden.png`,
    },
    {
      variant: 'dark',
      eyebrow: 'Repo 05',
      titulo: '**Penpot**',
      corpo:
        'Design e protótipo no navegador, no lugar do Figma. É a plataforma de design open source, e na mesma tela do cadastro ela te oferece instalar no seu próprio servidor.',
      imagem: `${SHOT}/penpot.png`,
    },
    {
      variant: 'light',
      eyebrow: 'Repo 06',
      titulo: '**yt-dlp**',
      corpo:
        'Baixa áudio e vídeo pelo terminal, de milhares de sites. Está em domínio público, tem 183 mil estrelas e lançou versão nova mês passado. Vale pro conteúdo que você tem direito de baixar.',
      imagem: `${SHOT}/ytdlp.png`,
    },
    {
      variant: 'purple',
      eyebrow: 'Repo 07',
      titulo: '**AppFlowy**',
      corpo:
        'Projetos, wiki e notas no lugar do Notion, com os arquivos na sua mão. O próprio site promete fazer mais sem perder o controle dos seus dados. São 75 mil estrelas no GitHub.',
      imagem: `${SHOT}/appflowy.png`,
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer os 7 links\nna sua DM?',
      botao: 'Comente REPO 👇',
      corpo: 'Te mando os links e o tutorial de instalação de cada um.',
    },
  ],
  legenda:
    // AIDA + SEO: a 1ª frase é curta de propósito (a linha de follow come ~56
    // caracteres do preview) e "open source" aparece logo no começo, repetido ao
    // longo do texto. Ver memória descricao-insta-linha-follow.
    'Tem software que cobra todo mês e já existe repo open source fazendo o mesmo.\n\n' +
    'Separei 7 projetos que você baixa do GitHub e roda no seu PC, de IA local a gerenciador de senhas. ' +
    'Todos com código aberto, então dá pra ver o que o programa faz antes de instalar.\n\n' +
    '1. ComfyUI (comfy.org): geração de imagem por IA rodando local, com controle sobre cada modelo e cada parâmetro. O site estampa Netflix, Nike e HP entre quem usa.\n\n' +
    '2. Ollama (ollama.com): modelo de IA aberto rodando no seu computador, e conversa com o seu editor e com o Claude Code.\n\n' +
    '3. Whisper (github.com/openai/whisper): reconhecimento de fala da OpenAI com licença MIT. Você joga o áudio e ele devolve texto na sua máquina.\n\n' +
    '4. Bitwarden (bitwarden.com): cofre de senhas open source com criptografia ponta a ponta. O plano grátis dá senhas e dispositivos ilimitados.\n\n' +
    '5. Penpot (penpot.app): design e protótipo no navegador, alternativa open source ao Figma, e você pode instalar no seu próprio servidor.\n\n' +
    '6. yt-dlp (github.com/yt-dlp/yt-dlp): baixa áudio e vídeo pelo terminal, em domínio público. Vale pro conteúdo que você tem direito de baixar.\n\n' +
    '7. AppFlowy (appflowy.com): projetos, wiki e notas no lugar do Notion, com os arquivos na sua mão.\n\n' +
    'Aviso honesto: quase todos têm plano pago opcional na nuvem. O que você instala na sua máquina é de graça, e pra maioria já resolve.\n\n' +
    'Comenta REPO aqui embaixo que eu te mando os 7 repositórios na sua DM, com o link e o comando de instalação de cada um. 👇',
  hashtags:
    'opensource github programacao devbr inteligenciaartificial ollama ferramentasdev carreiratech devemdobro iagratis',
  ctaFinal: 'Comenta REPO que eu te mando os links e o tutorial de instalação de cada um.',
  briefing:
    'FÓRMULA: lista de ferramenta grátis com nome próprio (a categoria que mais rende salvamento e comentário na ' +
    'conta), com 7 em vez de 1.\n\n' +
    'ARTE: cada repo aparece no PRÓPRIO print, tirado com Playwright (server/scripts/capturar-prints.ts) em ' +
    '07/08/2026 e guardado em assets/7-repos/. Mostrar o objeto em vez de descrever é o padrão das capas que ' +
    'performaram.\n\n' +
    'FATOS CONFERIDOS nos prints de 07/08/2026 (fonte primária, o próprio site e a página do repo). Ver o cabeçalho ' +
    'do arquivo.\n' +
    'Trocamos o Fooocus (que declara suporte limitado, só correção de bug) pelo ComfyUI, ativo. Tiramos o "99 ' +
    'idiomas" do Whisper, que não está no README.\n' +
    'Ollama, ComfyUI, Penpot, Bitwarden e AppFlowy têm plano pago opcional na nuvem, por isso a legenda avisa em ' +
    'vez de prometer "tudo de graça sem pegadinha".\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): número + a promessa de substituir o que cobra todo mês.\n' +
    'Regra 2 (o slide 2 confirma): mata a objeção de pirataria antes de ela aparecer, com código aberto, roda local ' +
    'e sem mensalidade.\n' +
    'Regra 3 (slide sozinho): um repo por slide, cada um com o próprio print. O rascunho juntava Bitwarden e ' +
    'Penpot no mesmo slide; foram separados.\n' +
    'Regra 4 (salvável): o slide com os 7 endereços em texto foi RETIRADO em 10/08/2026. Entregar os endereços no ' +
    'próprio carrossel matava a razão de comentar; agora o único jeito de pegar os links é a DM. Troca deliberada: ' +
    'menos salvamento, mais comentário.\n' +
    'Regra 5 (CTA único): comenta REPO.\n\n' +
    'PENDENTE: arte de capa (hoje no gradiente) e a página do presente no Notion com os 7 links.',
};
