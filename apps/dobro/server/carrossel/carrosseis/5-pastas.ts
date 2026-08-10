/**
 * apps/dobro — carrossel "as 5 pastas de ferramentas que todo dev precisa".
 *
 * Origem: referência ed074e61 (@cindiezhu, 781 curtidas e 513 comentários),
 * capturada pelo Telegram e lida slide a slide em 07/08/2026. O que fez aquele
 * post render NÃO foi a lista de ferramentas: foi a ORGANIZAÇÃO em 5 pastas
 * nomeadas mais a frase que tira a paralisia ("you don't need all of them, pick
 * the folder that hurts most today"). É essa estrutura que estamos pegando.
 *
 * O QUE MUDA EM RELAÇÃO À REFERÊNCIA: as pastas dela (Build, Think, Make, Ship,
 * Grow) são de criador solo, e uma delas é produção de conteúdo com avatar de IA,
 * que não é o nosso público. Aqui as 5 camadas são as de quem PROGRAMA: aprender,
 * pensar, construir, publicar e não quebrar. As três ferramentas da pasta
 * Aprender são os jogos que já viraram carrossel nosso e foram conferidos na
 * época (Flexbox Froggy, Elevator Saga, Learn Git Branching).
 *
 * Precisão (Article IV): as descrições são o que cada ferramenta faz, sem número
 * e sem preço, porque preço muda. Cursor, Supabase, Vercel, Sentry e PostHog têm
 * plano grátis e plano pago; é o que o slide 8 avisa, em vez de vender tudo como
 * gratuito. NÃO afirmamos limite de plano de nenhuma delas. SEM travessão.
 *
 * PENDENTE: arte de capa. Hoje usa o gradiente JARVIS. O ideal, pelas capas
 * campeãs, é o objeto em tela cheia: as 5 pastas coloridas empilhadas, uma
 * entreaberta.
 */
import type { Carrossel } from '../types';

export const cincoPastas: Carrossel = {
  slug: '5-pastas',
  titulo: 'As 5 pastas de ferramentas que todo dev precisa',
  gancho: 'Todo dev precisa de 5 pastas de ferramenta. Você só vai abrir uma hoje.',
  dataProgramada: '2026-08-16',
  refsLinks: 'https://www.instagram.com/p/Dbeuq_ACSbO/ (referência: @cindiezhu)',
  /** Presente do "comenta PASTA": o mapa das 5 pastas (Notion, 07/08/2026). */
  linkPresente: 'https://app.notion.com/p/3b56dd01fb48813185c4e7178872e894',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      tituloMenor: true,
      titulo: 'As 5 pastas de\nferramenta que\ntodo dev **precisa**',
      subtitulo: 'Você só vai abrir uma hoje.',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      topIcon: 'loop',
      eyebrow: 'Por que você trava',
      titulo: 'O problema não é\nfalta de **ferramenta**',
      corpo:
        'Você tem quarenta abas salvas e nenhum projeto no ar. Ferramenta demais junta não acelera nada, porque cada uma resolve uma camada diferente do trabalho.',
      calloutLabel: 'A real:',
      callout: '"Não é falta de ferramenta. É não saber qual camada está travando você hoje."',
    },
    {
      variant: 'light',
      eyebrow: 'Pasta 01',
      titulo: '**Aprender**',
      corpo: 'A base. Aqui você entende o que está escrevendo, em vez de copiar e torcer.',
      itens: [
        { icone: 'puzzle', titulo: 'Flexbox Froggy e Grid Garden', sub: 'CSS jogando, uma propriedade por fase' },
        { icone: 'code', titulo: 'Elevator Saga', sub: 'Lógica de programação escrevendo JavaScript de verdade' },
        { icone: 'git', titulo: 'Learn Git Branching', sub: 'Git com o desenho do que cada comando faz' },
      ],
    },
    {
      variant: 'purple',
      eyebrow: 'Pasta 02',
      titulo: '**Pensar**',
      corpo: 'Antes de codar. É onde a ideia bagunçada vira um plano que cabe numa semana.',
      itens: [
        { icone: 'ai', titulo: 'Claude', sub: 'Decidir caminho, discutir arquitetura e achar o furo do seu plano' },
        { icone: 'bookmark', titulo: 'NotebookLM', sub: 'Joga a documentação dentro e pergunta em vez de ler tudo' },
        { icone: 'map', titulo: 'Obsidian', sub: 'Suas anotações ligadas umas nas outras, no seu computador' },
      ],
    },
    {
      variant: 'dark',
      eyebrow: 'Pasta 03',
      titulo: '**Construir**',
      corpo: 'A hora de fazer. Aqui a IA para de dar resposta e começa a mexer no projeto.',
      itens: [
        { icone: 'robot', titulo: 'Claude Code', sub: 'Agente que escreve, refatora e revisa dentro do seu repositório' },
        { icone: 'laptop', titulo: 'Cursor', sub: 'Editor onde você conversa sobre o projeto inteiro, não sobre um arquivo' },
        { icone: 'layers', titulo: 'Supabase', sub: 'Banco, login e armazenamento de arquivo resolvidos de uma vez' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Pasta 04',
      titulo: '**Publicar**',
      corpo: 'Projeto que não está no ar não conta como portfólio. Essa pasta tira ele do seu PC.',
      itens: [
        { icone: 'globe', titulo: 'Vercel', sub: 'Sobe o projeto e te devolve um link pra mandar pro recrutador' },
        { icone: 'loop', titulo: 'GitHub Actions', sub: 'Roda os testes e publica sozinho a cada alteração que você envia' },
      ],
    },
    {
      variant: 'purple',
      eyebrow: 'Pasta 05',
      titulo: 'Não **quebrar**',
      corpo: 'Depois que está no ar, você precisa saber o que aconteceu sem esperar alguém reclamar.',
      itens: [
        { icone: 'skull', titulo: 'Sentry', sub: 'Avisa do erro em produção antes de o usuário te contar' },
        { icone: 'eye', titulo: 'PostHog', sub: 'Mostra como as pessoas usam de verdade, com gravação da tela' },
      ],
    },
    {
      variant: 'dark',
      eyebrow: 'Salva esse slide',
      titulo: 'Abre a que **mais dói** hoje',
      terminal: [
        'não sei por onde começar  → Aprender',
        'ideia bagunçada na cabeça → Pensar',
        'travo na hora de escrever → Construir',
        'projeto parado no seu PC  → Publicar',
        'no ar e dando erro        → Não quebrar',
      ],
      corpo:
        'Você não precisa das cinco. Ninguém precisa. Resolve a camada que está doendo, e só depois abre a próxima. Aviso honesto: as ferramentas das pastas 3, 4 e 5 têm plano grátis que dá conta de projeto pessoal, e cobram quando o projeto cresce.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o mapa\ndas 5 pastas?',
      botao: 'Comente PASTA 👇',
      corpo:
        'Comenta PASTA que eu te mando o mapa das 5 pastas na sua DM, com o link de cada ferramenta e por onde começar em cada uma, mais o passo a passo pra entrar de graça na Semana do Zero ao Programador Contratado, onde você atravessa as cinco camadas num projeto só.',
    },
  ],
  legenda:
    // AIDA + SEO: 1ª frase curta (a linha de follow come ~56 caracteres do
    // preview) e "ferramentas" logo no começo. Ver memória descricao-insta-linha-follow.
    'Ferramenta demais é o que trava o seu projeto.\n\n' +
    'Você salva quarenta abas, abre três por semana e não entrega nenhuma. O problema não é falta de ferramenta, ' +
    'é não saber qual camada do trabalho está travando você hoje. Organizei em 5 pastas.\n\n' +
    '1. Aprender: Flexbox Froggy e Grid Garden pra CSS, Elevator Saga pra lógica em JavaScript e Learn Git ' +
    'Branching pra git. Aqui você entende o que escreve em vez de copiar e torcer.\n\n' +
    '2. Pensar: Claude pra decidir caminho e achar o furo do plano, NotebookLM pra jogar a documentação dentro e ' +
    'perguntar, Obsidian pras suas anotações ligadas umas nas outras.\n\n' +
    '3. Construir: Claude Code como agente dentro do repositório, Cursor pra conversar sobre o projeto inteiro e ' +
    'Supabase pra resolver banco, login e arquivo de uma vez.\n\n' +
    '4. Publicar: Vercel pra subir e ter um link pra mandar pro recrutador, GitHub Actions pra rodar teste e ' +
    'publicar sozinho a cada alteração. Projeto que não está no ar não conta como portfólio.\n\n' +
    '5. Não quebrar: Sentry pra saber do erro antes do usuário reclamar, PostHog pra ver como as pessoas usam de ' +
    'verdade.\n\n' +
    'E o mais importante: você não precisa das cinco. Abre a que mais dói hoje, resolve, e só então vai pra ' +
    'próxima.\n\n' +
    'Aviso honesto: as ferramentas das pastas 3, 4 e 5 têm plano grátis que dá conta de projeto pessoal, e cobram ' +
    'quando o projeto cresce.\n\n' +
    'Comenta PASTA aqui embaixo que eu te mando o mapa completo na sua DM, com o link de cada uma e por onde ' +
    'começar. 👇',
  hashtags:
    'programacao ferramentasdev claudecode inteligenciaartificial devbr carreiratech aprenderprogramar devemdobro portfoliodev vibecoding',
  ctaFinal:
    'Comenta PASTA que eu te mando o mapa das 5 pastas na sua DM, com o link de cada ferramenta e por onde ' +
    'começar em cada uma, mais o passo a passo pra entrar de graça na Semana do Zero ao Programador Contratado.',
  briefing:
    'FÓRMULA: a estrutura da referência @cindiezhu (781 curtidas, 513 comentários), que é o nosso melhor caso de ' +
    'CTA de comentário conhecido. O que rendeu ali não foi a lista de ferramentas, foi organizar o caos em pastas ' +
    'nomeadas e dizer "escolhe a que mais dói hoje". A proporção de comentário por curtida (65%) mostra a palavra ' +
    'gatilho funcionando.\n\n' +
    'O QUE ADAPTAMOS: as pastas dela são de criador solo (Build, Think, Make, Ship, Grow), e uma é produção de ' +
    'conteúdo com avatar de IA, que não é o nosso público. Aqui as camadas são as de quem programa: Aprender, ' +
    'Pensar, Construir, Publicar e Não quebrar. A pasta Aprender usa os três jogos que já foram carrossel nosso, ' +
    'o que amarra este post no que a conta já publicou.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): número + a promessa de que você só vai precisar de uma delas.\n' +
    'Regra 2 (o slide 2 confirma): nomeia a dor (quarenta abas salvas, nenhum projeto no ar) antes de entregar a ' +
    'primeira pasta.\n' +
    'Regra 3 (slide sozinho): uma pasta por slide, cada uma com as ferramentas e o que cada uma faz.\n' +
    'Regra 4 (salvável): o slide 8 é o diagnóstico, que é o slide que a referência provou ser o mais forte.\n' +
    'Regra 5 (CTA único): comenta PASTA.\n\n' +
    'PRECISÃO: sem número e sem preço, porque preço muda. O slide 8 avisa que as pastas 3, 4 e 5 têm plano pago ' +
    'quando o projeto cresce.\n\n' +
    'PENDENTE: arte de capa (hoje no gradiente). Sugestão: as 5 pastas coloridas empilhadas, uma entreaberta.',
};
