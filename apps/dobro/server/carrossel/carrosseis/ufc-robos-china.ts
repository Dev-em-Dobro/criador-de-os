/**
 * apps/dobro — definição do carrossel "Agora tem UFC de robôs na China. Qual o
 * limite da tecnologia?". Notícia real (nada inventado) usada como gancho pra
 * refletir sobre o futuro da tecnologia e plantar que, por trás dos robôs, tem
 * MUITA programação. Padrão JARVIS (novo design), 8 slides, AIDA.
 *
 * SEM travessão; SEM emoji nos slides (não renderiza no headless). Sequência exata
 * de fundos da referência (foto/escuro/claro/roxo/claro/escuro/claro/roxo-CTA).
 *
 * Fatos conferidos (Article IV): CMG World Robot Competition / Mecha Fighting
 * Series, 1º torneio de kickboxing de robôs humanoides, Hangzhou, 25/05/2025, ao
 * vivo na TV estatal (CCTV). 4x Unitree G1 (~1,32 m, ~35 kg, ~US$ 13.500), de luva
 * e proteção. Golpes comandados por humanos (controle + voz); equilíbrio autônomo
 * via aprendizado por reforço + sensores em tempo real. Regras: 3 rounds de 2 min,
 * chute vale mais que soco, não levantar em 8 s perde o round. 2026 recruta times
 * do mundo; Wang Xingxing (dono da Unitree) vai lutar com um H2 de 1,82 m.
 * Fontes: Asia Times, Global Times, Live Science, Forbes, SCMP, eWeek.
 */
import type { Carrossel } from '../types';

export const ufcRobosChina: Carrossel = {
  slug: 'ufc-robos-china',
  titulo: 'Agora tem UFC de robôs na China. Qual o limite da tecnologia?',
  gancho: 'Agora tem UFC de robôs na China. Qual o limite da tecnologia?',
  // Sem imagem de capa por ora (arte do robô/ringue entra depois). Sem bgImage, a
  // capa fica escura e os slides escuros ficam sem a sangria de imagem no topo.
  dataProgramada: '2026-07-31T09:00:00.000Z',
  slides: [
    {
      variant: 'photo',
      cover: true,
      titulo: 'Agora tem\n**UFC de robôs**\nna China',
      corpo: 'E isso levanta uma pergunta: qual o limite da tecnologia? Arrasta pro lado.',
    },
    {
      variant: 'dark',
      topbleed: true,
      eyebrow: 'O que rolou',
      titulo: 'O primeiro torneio de\n**robôs lutadores**',
      corpo:
        'A China Media Group fez em Hangzhou, em 2025, o primeiro campeonato de kickboxing de robôs humanoides. Passou ao vivo na TV estatal.',
      calloutLabel: 'No ringue:',
      callout:
        '"Quatro robôs Unitree G1, cada um com 1,32 m e 35 kg, de luva e equipamento de proteção."',
    },
    {
      variant: 'light',
      eyebrow: 'Os números',
      titulo: 'A ficha dos\nlutadores',
      itens: [
        { icone: 'robot', titulo: '1,32 m e 35 kg', sub: 'O humanoide Unitree G1, leve e feito pra se equilibrar' },
        { icone: 'car', titulo: 'Preço de carro popular', sub: 'Cerca de US$ 13.500 por robô' },
        { icone: 'mouse', titulo: 'Controle humano', sub: 'Operadores comandam os golpes por controle e voz' },
        { icone: 'ai', titulo: 'Equilíbrio da IA', sub: 'Ficar de pé é a própria robô, com IA treinada' },
      ],
    },
    {
      variant: 'purple',
      eyebrow: 'Como funciona',
      titulo: 'As regras\ndo ringue',
      corpo:
        'Três rounds de 2 minutos. Chute vale mais ponto que soco. Caiu e não levantou em 8 segundos, perdeu o round. E sim: eles dão gancho, chute lateral e até chute giratório no ar.',
    },
    {
      variant: 'light',
      eyebrow: 'A real tecnologia',
      titulo: 'A luta de verdade\né no **código**',
      terminal: ['→ humano escolhe o golpe', '✓ IA mantém o equilíbrio', '✓ levanta sozinho após cair'],
      corpo:
        'O golpe é comandado por humano. Mas equilibrar, reagir e levantar é a IA: aprendizado por reforço treinado em milhões de simulações, somado a sensores em tempo real.',
    },
    {
      variant: 'dark',
      topbleed: true,
      eyebrow: 'E é só o começo',
      titulo: 'Qual o limite\n**da tecnologia**?',
      corpo:
        'Pra 2026, o campeonato já recruta times do mundo todo. E o dono da Unitree disse que vai entrar no ringue com um robô de 1,82 m. O que parecia filme virou pauta de jornal.',
    },
    {
      variant: 'light',
      eyebrow: 'O que isso tem a ver com você',
      titulo: 'O futuro não é\nassistido. É **construído**',
      corpo:
        'Por trás de cada robô desses tem gente que programa: lógica, IA, sensores, código. Quem entende de tecnologia não fica só olhando. E dá pra começar hoje, do básico.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'DEV EM DOBRO',
      titulo: 'Comenta **ROBÔ**\npra surfar essa onda',
      corpo:
        'Quer construir uma carreira em tecnologia? Eu te mando o passo a passo pra se inscrever de graça na Semana do Zero ao Programador Contratado.',
    },
  ],
  legenda:
    'Agora tem UFC de robôs na China, e não é ficção. A China Media Group realizou em Hangzhou, em 2025, o primeiro ' +
    'campeonato de kickboxing de robôs humanoides, transmitido ao vivo na TV estatal.\n\n' +
    'São robôs Unitree G1, de 1,32 m e 35 kg, com luvas e proteção. Os golpes (diretos, ganchos, chutes laterais e ' +
    'até chute giratório) são comandados por humanos, mas o equilíbrio e o levantar do chão são da IA: aprendizado ' +
    'por reforço treinado em milhões de simulações, somado a sensores em tempo real.\n\n' +
    'As regras: 3 rounds de 2 minutos, chute vale mais que soco, e quem não levanta em 8 segundos perde. Pra 2026 o ' +
    'torneio já recruta times do mundo todo.\n\n' +
    'O que parecia filme virou pauta de jornal. E por trás de cada robô desses tem muita programação: o futuro não é ' +
    'assistido, é construído. Quer construir uma carreira em tecnologia e surfar essa onda? Comenta ROBÔ que eu te ' +
    'mando o passo a passo pra se inscrever de graça na Semana do Zero ao Programador Contratado. 👇',
  hashtags:
    'tecnologia robôs inteligenciaartificial robótica unitree futuro programação devemdobro aprenderprogramar inovação',
  ctaFinal:
    'Comenta ROBÔ que eu te mando o passo a passo pra se inscrever de graça na Semana do Zero ao Programador Contratado.',
  briefing:
    'Notícia real como gancho (fatos conferidos: CMG Mecha Fighting Series, Hangzhou 2025, Unitree G1, controle ' +
    'humano + equilíbrio por IA/aprendizado por reforço, regras, planos 2026). Ângulo de marca no slide 5 e 7: a ' +
    'tecnologia de verdade é código/IA, o futuro é construído por quem programa. CTA lead-gen: comenta ROBÔ pra o ' +
    'passo a passo da Semana do Zero ao Programador Contratado (evento real, gratuito; sem datas no slide pra não ' +
    'inventar). CAPA sem ' +
    'imagem por ora (fundo escuro); ideal: foto do robô/ringue em server/carrossel/assets e re-renderizar. Sem emoji ' +
    'nos slides (não renderiza no headless).',
};
