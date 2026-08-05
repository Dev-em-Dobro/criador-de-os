/**
 * apps/dobro — carrossel "5 sites grátis pra deixar seu site com cara de caro".
 *
 * Origem: rascunho gerado pelo pipeline (card 4724d9e4). O gancho do slide 1 foi
 * reescrito pelo dono em 05/08/2026 e cada site ganhou o PRÓPRIO print, que é o
 * padrão das nossas capas que performaram: mostrar o objeto, não descrever.
 *
 * Precisão (Article IV): tudo o que é afirmado aqui foi lido nos prints tirados
 * dos sites em 05/08/2026 (fonte primária, ver assets/cara-de-caro/).
 *   React Bits: "Highly customizable animated components & backgrounds",
 *     "165+ COMPONENTS · FREE FOREVER".
 *   Aceternity UI: "200+ production-ready components, blocks and templates",
 *     "shadcn compatible components with microinteractions and animations".
 *     TEM plano pago (Pricing / Get All-Access).
 *   21st.dev: "12,000+ crafted React components, templates, and shadcn themes",
 *     "2,000+ Marketing blocks". TEM plano pago (Pricing).
 *   Componentry: "Beautiful Animated UI Components for React", "Backed by Vercel
 *     OSS Program", instala com `npx shadcn@latest add @componentry/...`.
 *   Refero: "Real product screens, flows, and patterns"; a galeria mostra telas
 *     reais de GitHub, Front, Vercel, JetBrains e Rows. Sem login ele esconde o
 *     resto do acervo ("73.246 more pages hidden").
 * Por isso o slide 9 traz a ressalva de plano pago em vez de vender "tudo de
 * graça sem pegadinha". NÃO afirmamos licença de nenhum deles, que não foi
 * verificada. SEM travessão.
 */
import type { Carrossel } from '../types';

const SHOT = 'server/carrossel/assets/cara-de-caro';

export const caraDeCaro: Carrossel = {
  slug: 'cara-de-caro',
  titulo: '5 sites grátis pra deixar seu site com cara de caro',
  gancho: '5 sites gratuitos que deixam seu site com cara de caro: sem saber design.',
  dataProgramada: '2026-08-06',
  /** Arte da capa (imagem do dono, 05/08): o macaco de terno, ouro e cara de caro. */
  bgImage: `${SHOT}/capa.jpg`,
  slides: [
    {
      variant: 'photo',
      cover: true,
      tituloMenor: true,
      titulo: '5 sites\ngratuitos que\ndeixam seu site\ncom cara de **caro**.\nSem saber design.',
      corpo: 'Passa pro lado que eu te mostro os 5 👉',
    },
    {
      variant: 'dark',
      eyebrow: 'O que você vai ver',
      titulo: 'Você copia, cola e\no site **muda de nível**',
      steps: [
        { n: '01', titulo: 'React Bits', sub: 'Componentes e fundos animados' },
        { n: '02', titulo: 'Aceternity UI', sub: 'Seções de landing prontas' },
        { n: '03', titulo: '21st.dev', sub: 'Biblioteca gigante de blocos' },
        { n: '04', titulo: 'Componentry', sub: 'Animação apoiada pela Vercel' },
        { n: '05', titulo: 'Refero', sub: 'A tela real de quem já acertou' },
      ],
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'follow',
      eyebrow: 'Antes de continuar',
      titulo: 'Segue o\n**@devemdobro**',
      corpo: 'Toda semana eu mostro ferramenta grátis que faz seu projeto parecer profissional. Segue pra não perder.',
    },
    {
      variant: 'dark',
      eyebrow: 'Site 01',
      titulo: '**React Bits**',
      corpo: 'Componentes e fundos animados pra colar no seu projeto. O próprio site promete: mais de 165 componentes, de graça pra sempre.',
      imagem: `${SHOT}/reactbits.png`,
    },
    {
      variant: 'light',
      eyebrow: 'Site 02',
      titulo: '**Aceternity UI**',
      corpo: 'Aqui não é botão solto: é seção inteira de landing page pronta, compatível com shadcn e com a animação já resolvida.',
      imagem: `${SHOT}/aceternity.png`,
    },
    {
      variant: 'dark',
      eyebrow: 'Site 03',
      titulo: '**21st.dev**',
      corpo: 'A biblioteca gigante: mais de 12 mil componentes React e 2 mil blocos de marketing. Hero, preço e rodapé em minutos.',
      imagem: `${SHOT}/21st.png`,
    },
    {
      variant: 'purple',
      eyebrow: 'Site 04',
      titulo: 'Componentry',
      corpo: 'Componentes animados de código aberto, apoiados pelo programa OSS da Vercel. Instala por um comando do shadcn.',
      imagem: `${SHOT}/componentry.png`,
    },
    {
      variant: 'light',
      eyebrow: 'Site 05',
      titulo: '**Refero**',
      corpo: 'Esse não dá componente, dá decisão: a tela real do GitHub, da Vercel, do JetBrains. Olhe antes de desenhar.',
      imagem: `${SHOT}/refero.png`,
    },
    {
      variant: 'dark',
      eyebrow: 'Salva esse slide',
      titulo: 'Os 5 endereços',
      terminal: [
        '→ reactbits.dev',
        '→ ui.aceternity.com',
        '→ 21st.dev',
        '→ componentry.dev',
        '→ refero.design',
      ],
      corpo: 'Aviso honesto: alguns têm plano pago opcional e o Refero pede conta pra ver o acervo inteiro. Pra começar, o que é grátis já resolve.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer os 5 links\nsem digitar?',
      botao: 'Comente STACK 👇',
      corpo: 'Comenta STACK que eu te mando os 5 sites na sua DM, prontos pra abrir.',
    },
  ],
  legenda:
    'Você não precisa desenhar nada do zero pra um site parecer caro. Esses 5 sites entregam componente pronto e ' +
    'referência de verdade, é só copiar a peça e colar no seu projeto.\n\n' +
    '1. React Bits (reactbits.dev): componentes e fundos animados. Mais de 165 componentes, de graça pra sempre.\n\n' +
    '2. Aceternity UI (ui.aceternity.com): seção inteira de landing page pronta, compatível com shadcn, com as ' +
    'animações já resolvidas.\n\n' +
    '3. 21st.dev: a biblioteca gigante, com mais de 12 mil componentes React e 2 mil blocos de marketing. Monta hero, ' +
    'preço e rodapé em minutos.\n\n' +
    '4. Componentry (componentry.dev): componentes animados de código aberto, apoiados pelo programa OSS da Vercel. ' +
    'Instala por um comando do shadcn.\n\n' +
    '5. Refero (refero.design): esse não dá componente, dá decisão. É a tela real do GitHub, da Vercel, do JetBrains. ' +
    'Olhe antes de desenhar e copie a decisão, não o layout inteiro.\n\n' +
    'Aviso honesto: alguns têm plano pago opcional e o Refero pede conta pra ver o acervo inteiro. Pra começar, o que ' +
    'é grátis já resolve.\n\n' +
    'Comenta STACK aqui embaixo que eu te mando os 5 sites na sua DM, prontos pra abrir. 👇',
  hashtags: 'frontend devweb react tailwind shadcn uidesign programacao aprenderprogramar devemdobro carreiratech',
  ctaFinal: 'Comenta STACK que eu te mando os 5 sites na sua DM, prontos pra abrir.',
  /** Presente entregue no CTA: página do Notion com os 5 sites (criada em 05/08/2026). */
  linkPresente: 'https://app.notion.com/p/3b36dd01fb488141a23beb2db6d53bbb',
  briefing:
    'FÓRMULA: ferramenta grátis (a categoria que mais rende seguidor e comentário), com 5 em vez de 1.\n\n' +
    'ARTE: cada site aparece no PRÓPRIO print, tirado com Playwright (server/scripts/capturar-prints.ts) e guardado ' +
    'em assets/cara-de-caro/. É o padrão das capas que performaram: mostrar o objeto em vez de descrever.\n\n' +
    'FATOS CONFERIDOS nos prints de 05/08/2026 (fonte primária, o próprio site). Ver o cabeçalho do arquivo.\n' +
    'Aceternity e 21st TÊM plano pago; Refero esconde o acervo sem login. Por isso o slide 9 avisa, em vez de vender ' +
    '"tudo de graça sem pegadinha".\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1: a capa entrega o número e mata a objeção ("sem saber design") no fim.\n' +
    'Regra 2: o slide 2 confirma o gancho listando os 5 nomes, o que segura pra ver um a um.\n' +
    'Regra 4 (slide salvável): o slide 9 tem os 5 endereços em texto.\n' +
    'Regra 5: CTA único, comenta STACK.\n\n' +
    'PENDENTE: a capa está no gradiente. Sugestão: mosaico dos 5 prints.',
};
