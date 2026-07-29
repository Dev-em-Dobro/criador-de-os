/**
 * apps/dobro — definição do carrossel "Meu maior erro depois de usar IA".
 * Ângulo: usar IA bem NÃO é digitar prompt aleatório e torcer. A base é entender
 * os conceitos por trás (skills, agentes, harness, loops) e como usar cada um do
 * jeito certo. 4 slides explicam cada conceito; fecha no CTA "comenta BASE" pra um
 * tutorial de como usar cada um pra aprender a programar ou criar projetos.
 *
 * SEM travessão. 8 slides na sequência exata de fundos da referência JARVIS
 * (foto/escuro/claro/roxo/claro/escuro/claro/roxo-CTA). Sem nome inventado; os
 * conceitos (skill/agente/harness/loop) são termos reais do ecossistema de IA.
 * `carrossel:render erro-ia-30min` gera a arte + card.
 */
import type { Carrossel } from '../types';

export const erroIa30min: Carrossel = {
  slug: 'erro-ia-30min',
  // Mantém o título do card no board (o render substitui no lugar, mesmo título).
  titulo: 'Meu maior erro depois de usar IA foi não gastar 30 min nessas coisas',
  gancho: 'Meu maior erro depois de usar IA foi achar que bastava digitar prompt',
  // Sem imagem de capa por ora (entra depois). Sem bgImage, a capa fica preta e os
  // slides escuros ficam sem a sangria de imagem no topo.
  dataProgramada: '2026-07-30T00:00:00.000Z',
  slides: [
    {
      variant: 'photo',
      cover: true,
      titulo: 'Meu maior erro\ndepois de usar **IA**',
      corpo: 'Foi achar que bastava digitar prompt e torcer pra acertar. A base é outra.',
    },
    {
      variant: 'dark',
      topbleed: true,
      eyebrow: 'A base',
      titulo: 'Usar IA bem não é\n**prompt aleatório**',
      corpo:
        'Não é sair digitando e torcer pra IA acertar. A base é entender os conceitos por trás e como usar cada um do jeito certo.',
      calloutLabel: 'Os conceitos:',
      callout:
        '"Skills, agentes, harness e loops. Quem entende isso comanda a IA. Quem não, fica refém do prompt."',
    },
    {
      variant: 'light',
      eyebrow: 'Conceito 1',
      topIcon: 'puzzle',
      titulo: 'Skills',
      corpo:
        'São capacidades prontas que você dá pra IA: um pacote de instruções e ferramentas pra ela executar um tipo de tarefa sempre do jeito certo. Em vez de explicar tudo de novo, você ativa a skill.',
    },
    {
      variant: 'purple',
      eyebrow: 'Conceito 2',
      topIcon: 'robot',
      titulo: 'Agentes',
      corpo:
        'É a IA agindo sozinha rumo a um objetivo: ela planeja, usa ferramentas e executa vários passos, não só responde um prompt. Você dá a meta, o agente corre atrás do caminho.',
    },
    {
      variant: 'light',
      eyebrow: 'Conceito 3',
      topIcon: 'layers',
      titulo: 'Harness',
      corpo:
        'É a estrutura em volta do modelo: o que monta o contexto, executa as ferramentas e controla o loop. É o harness que transforma um modelo de linguagem numa ferramenta que faz o trabalho.',
    },
    {
      variant: 'dark',
      topbleed: true,
      eyebrow: 'Conceito 4',
      topIcon: 'loop',
      titulo: 'Loops',
      corpo:
        'É o ciclo que faz a IA trabalhar de verdade: ela age, olha o resultado e repete até concluir. Errou, lê o erro e tenta de novo. É assim que ela constrói algo, não em um tiro só.',
    },
    {
      variant: 'light',
      eyebrow: 'Juntando tudo',
      titulo: 'A mesma IA,\noutro resultado',
      terminal: ['✓ você comanda, a IA executa', '✓ menos prompt no escuro'],
      corpo:
        'Quando você sabe qual conceito usar em cada momento, a IA para de dar resposta genérica e vira uma ferramenta de construir. A diferença é a base que você tem.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'DEV EM DOBRO',
      titulo: 'Comenta **BASE**\nque eu te ensino',
      corpo:
        'Quer um tutorial de como usar skills, agentes, harness e loops pra aprender a programar ou criar seus projetos? Comenta BASE que eu te chamo.',
    },
  ],
  legenda:
    'Meu maior erro depois de começar a usar IA foi achar que bastava digitar prompt e torcer pra acertar. Usar IA ' +
    'bem não é isso.\n\n' +
    'A base é entender os conceitos por trás, e como usar cada um do jeito certo:\n\n' +
    '1. Skills: capacidades prontas que você dá pra IA.\n' +
    '2. Agentes: a IA agindo sozinha rumo a um objetivo.\n' +
    '3. Harness: a estrutura que roda o modelo e controla o loop.\n' +
    '4. Loops: o ciclo de agir, olhar o resultado e repetir até concluir.\n\n' +
    'É isso que separa quem só "usa IA" de quem constrói de verdade com ela. Quer um tutorial de como usar cada um ' +
    'pra aprender a programar ou criar seus projetos? Comenta BASE que eu te chamo na DM. 👇',
  hashtags:
    'programação inteligenciaartificial agentesdeia aiagents claudecode vibecoding devemdobro aprenderprogramar iaparadev automacao',
  ctaFinal:
    'Comenta BASE que eu te chamo na DM com um tutorial de como usar skills, agentes, harness e loops pra aprender a programar ou criar seus projetos.',
  briefing:
    'Ângulo: usar IA bem não é prompt aleatório; a base é entender skills, agentes, harness e loops (termos reais do ' +
    'ecossistema de IA, nada inventado). Slide 2 = a base; slides 3 a 6 = um conceito cada (Skills/Agentes/Harness/' +
    'Loops); slide 7 = síntese; slide 8 = CTA "comenta BASE" pra um tutorial de cada um. CAPA sem imagem por ora ' +
    '(fundo preto), adicionar depois. OBS: o título do card no board ainda diz "não gastar 30 min nessas coisas" ' +
    '(mantido pra o render substituir no lugar); renomear se quiser alinhar ao novo conteúdo.',
};
