/**
 * apps/dobro — carrossel "7 ferramentas grátis pra site com Claude".
 *
 * ORIGEM: entrou no lugar do card "ASTRA da open ai" (23/08/2026), que foi
 * descartado porque o modelo NÃO foi lançado (sem API, sem preço, sem data) e
 * não serve quem quer construir e faturar agora.
 *
 * POR QUE ESTE ASSUNTO: "stack list" foi uma das 10 famílias de gancho que
 * dominam o topo da busca nos nossos termos (20/08/2026), no formato
 * "Claude→Code, Supabase→DB, Vercel→Deploy". É lista (o formato que trouxe 282
 * seguidores) e tem nome próprio em cada slide (22 seguidores medianos contra 1
 * de termo genérico).
 *
 * A STACK É A NOSSA DE VERDADE, lida do package.json de apps/dobro em
 * 20/08/2026: react + vite, tailwindcss, hono, @neondatabase/serverless,
 * drizzle-orm, better-auth. O deploy é a Vercel (ver memória deploy-dobro-vercel).
 * Não copiamos a stack genérica da referência: Supabase e Clerk não são usados
 * aqui, e afirmar que usamos seria invenção.
 *
 * CONFERIR ANTES DE PUBLICAR (não estava na fonte que eu li):
 *   · O plano gratuito atual de Neon e Vercel, e o limite de cada um. O slide 7
 *     afirma que existe plano grátis; o número do limite NÃO é afirmado em lugar
 *     nenhum de propósito.
 *   · Que o Claude Code é PAGO. Está dito no slide 2 e na legenda, e é o que
 *     sustenta o "7 ferramentas grátis" do título: as sete são as outras.
 * SEM travessão.
 *
 * PENDENTE: arte de capa (nasce com semFundo) e a página do presente no Notion.
 */
import type { Carrossel } from '../types';

export const stackSite: Carrossel = {
  slug: 'stack-site',
  // 40 caracteres: número + "grátis" + nome próprio, os três traços de maior
  // peso na régua, dentro do limite de 45 que a capa comporta.
  titulo: '7 ferramentas grátis pra site com Claude',
  gancho: 'A stack inteira que leva um site do zero até o ar, e só o Claude Code é pago.',
  dataProgramada: '2026-08-23T00:00:00.000Z',
  refsLinks: 'stack real de apps/dobro (package.json, 20/08/2026)',
  linkPresente: '',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      tituloMenor: true,
      titulo: '**7 ferramentas**\ngrátis pra site\ncom **Claude**',
      subtitulo: 'A stack inteira que leva um projeto do zero até o ar.',
      swipe: 'Deslize e veja as 7 ›',
    },
    {
      variant: 'dark',
      eyebrow: 'Antes de você duvidar',
      titulo: 'O **Claude é o único**\nque você paga',
      itens: [
        { icone: 'ban', titulo: 'As 7 têm plano grátis pra começar', sub: 'Você sobe o primeiro projeto sem cartão em nenhuma delas' },
        { icone: 'git', titulo: 'Cinco são código aberto', sub: 'Drizzle, Better Auth, Tailwind, Hono e o front inteiro' },
        { icone: 'laptop', titulo: 'É a stack que roda aqui', sub: 'Não é lista de internet: é o que está no nosso projeto hoje' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Etapa 01 · a tela',
      titulo: '**React** com **Vite**',
      subtitulo: 'É onde o site aparece.',
      corpo:
        'O Vite dá o servidor de desenvolvimento que recarrega na hora e o build final. O React monta a interface. É a dupla que o Claude Code já conhece melhor, então ele erra menos escrevendo pra ela.',
    },
    {
      variant: 'dark',
      eyebrow: 'Etapa 02 · o estilo',
      titulo: '**Tailwind CSS**',
      subtitulo: 'Estilo sem sair do HTML.',
      corpo:
        'Você escreve a aparência na própria marcação, em vez de manter um arquivo de CSS separado. Pra quem constrói com IA muda tudo: o agente vê o estilo junto do elemento e não se perde entre dois arquivos.',
    },
    {
      variant: 'purple',
      eyebrow: 'Etapa 03 · o banco',
      titulo: '**Neon** e **Drizzle**',
      subtitulo: 'Onde os dados ficam.',
      corpo:
        'O Neon é um Postgres que você cria em minutos e tem plano gratuito. O Drizzle é a camada que escreve as consultas em TypeScript, então o editor avisa o erro antes de rodar.',
    },
    {
      variant: 'light',
      eyebrow: 'Etapa 04 · o login',
      titulo: '**Better Auth**',
      subtitulo: 'Login sem construir do zero.',
      corpo:
        'Resolve cadastro, sessão e senha, que é a parte chata e a parte perigosa de errar. É código aberto e roda no seu próprio servidor, então a conta dos seus usuários não fica na mão de terceiro.',
    },
    {
      variant: 'dark',
      eyebrow: 'Etapa 05 · o ar',
      titulo: '**Hono** e **Vercel**',
      subtitulo: 'A API e a publicação.',
      corpo:
        'O Hono é o servidor que responde as chamadas do site, leve o bastante pra rodar em função. A Vercel publica, e o plano gratuito já põe o projeto no ar com endereço e certificado.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer a stack\ncom os links?',
      botao: 'Comente STACK 👇',
      corpo: 'Te mando os links das 7, a ordem de instalação e onde cada uma começa a cobrar.',
    },
  ],
  legenda:
    'Essa é a stack inteira que leva um site do zero até o ar.\n\n' +
    'São 7 ferramentas com plano gratuito pra começar. A única coisa paga aqui é o Claude Code, que é quem escreve. ' +
    'Não é lista de internet: é o que está rodando no nosso projeto hoje.\n\n' +
    '1. React com Vite: a interface e o build. É a dupla que a IA conhece melhor, então erra menos escrevendo pra ela.\n\n' +
    '2. Tailwind CSS: o estilo escrito na própria marcação. O agente vê a aparência junto do elemento e não se perde entre arquivos.\n\n' +
    '3. Neon: Postgres que você cria em minutos, com plano gratuito.\n\n' +
    '4. Drizzle: escreve as consultas do banco em TypeScript, e o editor avisa o erro antes de rodar.\n\n' +
    '5. Better Auth: cadastro, sessão e senha resolvidos, em código aberto e no seu próprio servidor.\n\n' +
    '6. Hono: o servidor que responde as chamadas, leve o bastante pra rodar em função.\n\n' +
    '7. Vercel: publica o projeto com endereço e certificado, e o plano gratuito já resolve o primeiro site.\n\n' +
    'Aviso honesto: plano gratuito tem limite, e projeto que cresce em algum momento passa a pagar. Pro primeiro site ' +
    'e pro primeiro cliente, nenhuma delas cobra.\n\n' +
    'Comenta STACK aqui embaixo que eu te mando os links das 7, a ordem de instalação e onde cada uma começa a cobrar. 👇',
  hashtags: 'vibecoding claudecode react tailwindcss devbr',
  ctaFinal: 'Comenta STACK que eu te mando os links das 7, a ordem de instalação e onde cada uma começa a cobrar.',
  briefing:
    'FÓRMULA: stack list, uma das 10 famílias que dominam o topo da busca nos nossos termos (20/08/2026). É lista (o ' +
    'formato dos 282 seguidores) com nome próprio em cada slide (22 seguidores medianos contra 1 de termo genérico).\n\n' +
    'ENTROU no lugar do card "ASTRA da open ai", descartado porque o modelo não foi lançado: sem API, sem preço e sem ' +
    'data não serve quem quer construir e faturar agora.\n\n' +
    'A STACK É A NOSSA, lida do package.json de apps/dobro. Supabase e Clerk (que aparecem na referência da busca) ' +
    'ficaram de fora porque não usamos, e afirmar que usamos seria invenção.\n\n' +
    'CONFERIR ANTES DE PUBLICAR: o plano gratuito atual de Neon e Vercel. O carrossel afirma que existe plano grátis, ' +
    'mas de propósito NÃO afirma nenhum número de limite.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): número + grátis + nome próprio, os três traços de maior peso da régua, em 40 caracteres.\n' +
    'Regra 2 (o slide 2 confirma): mata na hora a objeção "de graça é pegadinha", dizendo qual é a única paga.\n' +
    'Regra 3 (slide sozinho): uma etapa por slide, na ordem em que a pessoa vai precisar.\n' +
    'Regra 4 (salvável): a ordem das etapas é o que se salva. Os links ficam pra DM.\n' +
    'Regra 5 (CTA único): comenta STACK.\n\n' +
    'PENDENTE: arte de capa (nasce com semFundo) e a página do presente no Notion.',
};
