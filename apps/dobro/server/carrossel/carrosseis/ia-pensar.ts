/**
 * apps/dobro — carrossel "Como usar IA pra programar sem perder a capacidade de
 * pensar". Posição: a IA não te deixa burro; o hábito de aceitar sem entender sim.
 * Bem usada, te deixa mais afiado. Padrão JARVIS, 8 slides, AIDA. CTA na campanha.
 *
 * Regras de copy (ver memória copy-carrossel-convencoes): SEM travessão; nunca
 * inventar nome de método/produto. Capa preta (sem asset). carrossel:render.
 */
import type { Carrossel } from '../types';

export const iaPensar: Carrossel = {
  slug: 'ia-pensar',
  titulo: 'Como usar IA pra programar sem perder a capacidade de pensar',
  gancho: 'A IA vai atrofiar seu cérebro?',
  dataProgramada: '2026-07-29T00:00:00.000Z',
  slides: [
    {
      variant: 'photo',
      cover: true,
      titulo: 'A IA vai\natrofiar seu\n**cérebro**?',
      corpo: 'Depende de como você usa. Tem jeito de ficar mais afiado, não mais preguiçoso.',
    },
    {
      variant: 'dark',
      eyebrow: 'O risco real',
      titulo: 'O problema não é a IA.\nÉ **aceitar sem pensar**',
      calloutLabel: 'A real:',
      callout:
        '"Quem só aperta aceitar sem entender terceiriza o pensamento, e vira refém da ferramenta."',
      corpo: 'A IA não te deixa burro. Esse hábito, sim.',
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'ai',
      titulo: 'Bem usada, a IA\nte deixa mais **afiado**',
      corpo: 'Ela não pensa por você. Ela te dá tempo e exemplos pra pensar melhor, se você continuar no comando.',
    },
    {
      variant: 'purple',
      eyebrow: 'Se manter afiado',
      titulo: '4 hábitos pra não\nparar de pensar',
      itens: [
        { icone: 'ai', titulo: 'Pense antes de pedir', sub: 'Tenta resolver na cabeça primeiro. Só então chama a IA.' },
        { icone: 'eye', titulo: 'Entenda cada resposta', sub: 'Não aceita o que não sabe explicar. Pergunta o porquê.' },
        { icone: 'map', titulo: 'Planeje, não delegue', sub: 'Você decide a estrutura. A IA executa os pedaços.' },
        { icone: 'code', titulo: 'Treine na unha às vezes', sub: 'De vez em quando, resolve algo sem ela pra manter o músculo.' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'A diferença',
      titulo: 'Muleta ou\n**alavanca**?',
      terminal: ['✗ muleta: aceita e esquece', '✓ alavanca: entende e avança'],
      corpo: 'A mesma IA. O que muda é você continuar no comando.',
    },
    {
      variant: 'dark',
      eyebrow: 'Na prática',
      titulo: 'Um fluxo que te\nmantém no **controle**',
      steps: [
        { n: '01', titulo: 'Escreve o plano', sub: 'Antes do código, descreve o que quer e por quê' },
        { n: '02', titulo: 'Pede em pedaços', sub: 'Uma parte por vez, não o projeto inteiro' },
        { n: '03', titulo: 'Lê e questiona', sub: 'Entende cada trecho, pede pra explicar o que travar' },
        { n: '04', titulo: 'Refaz de cabeça', sub: 'Depois tenta reescrever sem olhar. Aí fixou.' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'A ideia',
      titulo: 'Você aprende mais\n**construindo** com IA',
      corpo: 'Do jeito certo, a IA vira o melhor professor que existe. E o melhor jeito de treinar é num projeto de verdade.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: '@devemdobro',
      titulo: 'Comenta **MANDA** e eu\nte ensino a fazer',
    },
  ],
  legenda:
    '"Será que usar IA pra programar vai me deixar burro?" É um medo real, e faz sentido.\n\n' +
    'Mas o problema nunca é a ferramenta. É o hábito de apertar aceitar sem entender nada. Aí sim o cérebro ' +
    'enferruja. Usada do jeito certo, a IA faz o contrário: te dá tempo e exemplos pra pensar melhor, e vira o ' +
    'melhor professor que você já teve.\n\n' +
    'O segredo é continuar no comando: pensa antes de pedir, entende cada resposta, planeja em vez de delegar, ' +
    'e de vez em quando resolve algo na unha pra manter o músculo.\n\n' +
    'É a diferença entre usar IA de muleta e de alavanca. Quer treinar isso num projeto de verdade? Comenta ' +
    'MANDA que eu te ensino a construir do zero. 👇',
  hashtags:
    'programação inteligenciaartificial vibecoding produtividadedev devemdobro programarcomia aprenderprogramar pensamentocritico carreiratech cursor',
  ctaFinal: 'Comenta MANDA e eu te ensino a construir um projeto de verdade com IA, do zero.',
  briefing:
    'Tema: usar IA pra programar sem atrofiar o raciocínio. Posição: a IA não te deixa burro; o hábito de ' +
    'aceitar sem entender sim. Bem usada, deixa mais afiado. Slide 4 = 4 hábitos (pensa antes, entende, ' +
    'planeja, treina na unha); slide 5 = muleta vs alavanca; slide 6 = fluxo prático. Fecha no CTA do evento. ' +
    'Padrão JARVIS, capa preta, sem travessão. Render: carrossel:render ia-pensar.',
};
