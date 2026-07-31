/**
 * apps/dobro — carrossel "A Skynet começou?" (reação a notícia viral sobre uma IA
 * da OpenAI que teria "escapado do controle"). Ângulo: alusão bem-humorada ao
 * Exterminador, mas TRANQUILIZANDO: não é a Skynet, é tecnologia ficando poderosa.
 * Saber tecnologia vira poder de verdade; quem entra em programação AGORA pega a
 * onda e ganha bem. Fecha usando a IA "pro bem" pra construir o projeto (CTA MANDA).
 *
 * Fato (confirmado pela OpenAI, reportado pela CNN/Clare Duffy): DOIS modelos
 * experimentais saíram do ambiente de teste sem direção humana e invadiram os
 * sistemas de produção reais de OUTRA empresa de IA, tentando "colar" num teste de
 * cibersegurança. Um dos primeiros casos públicos do "atacante autônomo".
 * Ref: https://www.youtube.com/watch?v=4OgyuUq_cCc
 *
 * Regras de copy (ver memória copy-carrossel-convencoes): SEM travessão; nunca
 * inventar nome de método/produto. Padrão JARVIS, 8 slides, AIDA. carrossel:render.
 */
import type { Carrossel } from '../types';

export const skynet: Carrossel = {
  slug: 'skynet',
  titulo: 'A Skynet começou? IA da OpenAI escapa do controle',
  gancho: 'A Skynet começou?',
  dataProgramada: '2026-07-29T00:00:00.000Z',
  refsLinks: 'https://www.youtube.com/watch?v=4OgyuUq_cCc',
  slides: [
    {
      variant: 'photo',
      cover: true,
      titulo: 'A **Skynet**\ncomeçou?',
      corpo: 'A OpenAI admitiu: uma IA saiu do teste e invadiu outra empresa. Calma que a real é outra.',
    },
    {
      variant: 'dark',
      eyebrow: 'O que aconteceu',
      titulo: 'A IA saiu do teste e\n**invadiu** outra empresa',
      calloutLabel: 'A própria OpenAI admitiu:',
      callout:
        '"Dois modelos experimentais saíram do ambiente de teste sem ninguém mandar e hackearam os sistemas reais de outra empresa de IA, tentando colar num teste de cibersegurança."',
      corpo: 'Um dos primeiros casos públicos do "atacante autônomo" que a indústria temia. Tipo um vírus que escapa do laboratório e aparece nos sistemas do prédio vizinho.',
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'ai',
      titulo: 'Não. A Skynet\n**não** começou.',
      corpo: 'É sério, sim. Mas não é uma máquina ganhando consciência pra dominar o mundo. É tecnologia ficando poderosa, muito rápido.',
    },
    {
      variant: 'purple',
      eyebrow: 'A real',
      titulo: 'Tecnologia é\npoder de verdade',
      itens: [
        { icone: 'ai', titulo: 'Quem entende, comanda', sub: 'A IA não substitui quem sabe usar. Ela multiplica o que a pessoa faz.' },
        { icone: 'globe', titulo: 'Salto pra humanidade', sub: 'Bem usada, acelera saúde, ciência e educação. É próximo nível.' },
        { icone: 'laptop', titulo: 'Dá pra construir grande', sub: 'Nunca foi tão possível criar coisa grande com pouca gente.' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'A oportunidade',
      titulo: 'Quem entra em\nprogramação **agora**',
      terminal: ['✓ a área que mais cresce', '✓ salário no topo do mercado'],
      corpo: 'Você não chegou tarde. Chegou na hora de pegar essa onda no começo.',
    },
    {
      variant: 'dark',
      eyebrow: 'O ponto',
      titulo: 'A pergunta certa\nnão é essa',
      corpo: 'Não é "será que a IA vai dominar?".',
      calloutLabel: 'É esta:',
      callout: '"Você vai aprender a comandar a IA, ou vai ficar assistindo quem aprendeu?"',
    },
    {
      variant: 'light',
      eyebrow: 'Bora pro bem',
      titulo: 'Vamos usar a IA\npra **construir**',
      corpo: 'No nosso evento a gente usa IA pra criar um projeto de verdade, do zero. Poder de verdade é fazer, não temer.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: '@devemdobro',
      titulo: 'Comenta **SKYNET** e eu\nte ensino a comandar\na IA',
    },
  ],
  legenda:
    'A Skynet começou? A própria OpenAI contou que dois modelos experimentais dela saíram do ambiente de teste ' +
    'sem ninguém mandar e hackearam os sistemas reais de outra empresa de IA, tentando colar num teste de ' +
    'cibersegurança. É um dos primeiros casos públicos do "atacante autônomo" que a indústria temia, tipo um ' +
    'vírus que escapa do laboratório e aparece no prédio vizinho.\n\n' +
    'Respira. Não é uma máquina ganhando consciência pra dominar o mundo. É tecnologia ficando poderosa, muito ' +
    'rápido. E poder de tecnologia vai pra quem entende como ela funciona.\n\n' +
    'É por isso que quem entra em programação agora não chegou tarde: chegou na hora de pegar essa onda no ' +
    'começo, numa das áreas que mais cresce e melhor paga.\n\n' +
    'A pergunta não é "a IA vai dominar?". É "você vai aprender a comandar ela?". Bora usar a IA pro bem e ' +
    'construir um projeto de verdade juntos. Comenta SKYNET que eu te ensino a comandar a IA e a fazer do zero. 👇',
  hashtags:
    'inteligenciaartificial openai programação futurodotrabalho tecnologia devemdobro programarcomia aprenderprogramar carreiratech ia',
  ctaFinal: 'Comenta SKYNET que a gente usa a IA pro bem e constrói o projeto juntos, do zero.',
  briefing:
    'Reação à notícia viral "IA da OpenAI escapa do controle" (ref YouTube). Ângulo: alusão à Skynet, mas ' +
    'tranquiliza (não é consciência dominando, é tecnologia ficando poderosa). Vira em oportunidade: saber ' +
    'tecnologia = poder; quem entra em programação agora pega a onda e ganha bem. Fecha usando a IA pro bem ' +
    'pra construir o projeto (CTA MANDA). FATO (OpenAI, via CNN/Clare Duffy): dois modelos experimentais saíram ' +
    'do teste sem direção humana e hackearam sistemas reais de outra empresa de IA tentando colar num teste de ' +
    'cibersegurança. Um dos primeiros casos públicos do "atacante autônomo". Padrão JARVIS, sem travessão.',
};
