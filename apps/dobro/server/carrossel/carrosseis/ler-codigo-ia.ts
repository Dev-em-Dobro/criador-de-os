/**
 * apps/dobro — carrossel "Devo ler o código gerado por IA ou não?".
 * Opinião/debate. Posição: SIM, sempre, mas com intenção (não entender cada
 * caractere). Ler é como você aprende, pega bug e fica no controle do projeto.
 * Padrão JARVIS (novo design), 8 slides, AIDA. Fecha no CTA da campanha (MANDA).
 *
 * Regras de copy (ver memória copy-carrossel-convencoes): SEM travessão; nunca
 * inventar nome de método/produto. Capa preta (sem asset). carrossel:render.
 */
import type { Carrossel } from '../types';

export const lerCodigoIa: Carrossel = {
  slug: 'ler-codigo-ia',
  titulo: 'Devo ler o código gerado por IA ou não?',
  gancho: 'Devo ler o código gerado por IA ou não?',
  dataProgramada: '2026-07-29T00:00:00.000Z',
  slides: [
    {
      variant: 'photo',
      cover: true,
      titulo: 'Devo **ler**\no código\nda IA?',
      corpo: 'A resposta separa quem aprende de quem só cola. Desliza.',
    },
    {
      variant: 'dark',
      eyebrow: 'O dilema',
      titulo: 'Tem gente que aceita\ntudo sem **ler uma linha**',
      corpo: 'E tem quem trava querendo entender cada caractere. Os dois erram.',
      calloutLabel: 'O ponto:',
      callout:
        '"A resposta certa não é ler tudo nem confiar cego. É ler com intenção, sabendo onde olhar."',
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'eye',
      titulo: 'Ler virou a skill\nmais **importante**',
      corpo: 'A IA escreve o código, então o dev não escreve mais tudo na unha. Agora o trabalho é ler, entender e guiar o que a máquina faz. É essa a habilidade que mais vai importar daqui pra frente.',
    },
    {
      variant: 'purple',
      eyebrow: 'Por que ler',
      titulo: 'O que você ganha\nlendo',
      itens: [
        { icone: 'eye', titulo: 'Confiança no que roda', sub: 'Você entende como o sistema vai se comportar, sem susto depois.' },
        { icone: 'laptop', titulo: 'Consegue mexer depois', sub: 'Fica com o conhecimento pra alterar o código no futuro, se precisar.' },
        { icone: 'ai', titulo: 'Fica afiado na IA', sub: 'Vê a IA resolver de outras formas e aprende a usá-la bem melhor.' },
        { icone: 'map', titulo: 'Planeja e ganha tempo', sub: 'Usar a IA no modo planning antes de escrever acelera demais.' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'O outro lado',
      titulo: 'Mas não precisa\nentender **tudo**',
      terminal: ['✓ leia o que muda o comportamento', '✗ pule o boilerplate repetido'],
      corpo: 'Ler com intenção não é revisar cada ponto e vírgula. É saber onde olhar.',
    },
    {
      variant: 'dark',
      eyebrow: 'Na prática',
      titulo: 'Como ler sem\nperder tempo',
      steps: [
        { n: '01', titulo: 'Leia só o que mudou', sub: 'As linhas novas, não o projeto inteiro' },
        { n: '02', titulo: 'Pergunte "por quê"', sub: 'Não entendeu uma linha? Pede a IA explicar' },
        { n: '03', titulo: 'Roda e testa', sub: 'Ler mais ver funcionando é a prova real' },
        { n: '04', titulo: 'Refaz o que não entende', sub: 'Se não dá pra explicar, não entra no projeto' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'O convite',
      titulo: 'A gente te ensina\nnum evento **gratuito**',
      corpo: 'Ao vivo e de graça, você monta um projeto de verdade do zero e treina o que mais importa: ler, entender e guiar a IA.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: '@devemdobro',
      titulo: 'Comenta **MANDA** que\nte ensino a fazer\nesse projeto com IA\ndo jeito certo',
    },
  ],
  legenda:
    '"Devo ler o código que a IA escreve, ou só aceitar e seguir?" Recebo muito essa pergunta.\n\n' +
    'Resposta curta: sim, sempre. Mas ler não é desconfiar da IA nem revisar cada ponto e vírgula. É continuar ' +
    'no controle do que entra no seu projeto, pegar o bug antes do deploy e, principalmente, aprender de ' +
    'verdade. Cada mudança é uma aula.\n\n' +
    'O segredo é ler com intenção: foca no que muda o comportamento, pula o boilerplate, e o que você não ' +
    'consegue explicar, não entra.\n\n' +
    'É isso que separa usar IA de muleta de usar IA de alavanca. Quer treinar num projeto real? Comenta MANDA ' +
    'que te ensino a fazer esse projeto com IA do jeito certo. 👇',
  hashtags:
    'programação inteligenciaartificial vibecoding cursor produtividadedev devemdobro programarcomia aprenderprogramar carreiratech revisãodecodigo',
  ctaFinal: 'Comenta MANDA que te ensino a fazer esse projeto com IA, do jeito certo.',
  briefing:
    'Opinião/debate. Pergunta: ler o código gerado por IA ou não? Posição: SIM, sempre, mas com intenção (não ' +
    'entender cada caractere). Slide 4 = por que ler (bug, aprende, controle, prompt melhor); slide 5 = o ' +
    'outro lado (não precisa entender tudo); slide 6 = como ler sem perder tempo. Fecha no CTA do evento. ' +
    'Padrão JARVIS, capa preta, sem travessão. Render: carrossel:render ler-codigo-ia.',
};
