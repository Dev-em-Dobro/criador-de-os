/**
 * apps/dobro — carrossel do jogo "Elevator Saga" (aprender LÓGICA de programação
 * programando elevadores em JavaScript). Pauta reescrita a partir do briefing
 * gravado no cronograma (substitui a interpretação antiga "Flexbox Adventure",
 * que era CSS, não lógica).
 *
 * Precisão (Article IV, nada inventado): fatos do briefing + do próprio jogo
 * (play.elevatorsaga.com). No Elevator Saga você escreve JavaScript real que
 * controla os elevadores; cada fase é um desafio de otimização (transportar X
 * pessoas em Y tempo); roda no navegador; é grátis. Treina lógica, condicionais,
 * eventos e otimização de algoritmo. Ressalva honesta do briefing: é pra quem já
 * sabe o básico de JS, NÃO pra quem está no zero absoluto. CTA: "comenta JS" →
 * link do jogo + doc técnico (quem pega o doc entra pro evento). SEM travessão.
 * Capa sem asset (fundo escuro) por ora — arte depois.
 */
import type { Carrossel } from '../types';

export const elevatorSaga: Carrossel = {
  slug: 'elevator-saga',
  titulo: 'Esse jogo ensina Lógica de Programação melhor que muito curso pago',
  gancho: 'Esse jogo ensina Lógica de Programação melhor que muito curso pago',
  dataProgramada: '2026-07-31T00:00:00.000Z',
  refsLinks: 'https://play.elevatorsaga.com/',
  slides: [
    {
      variant: 'photo',
      cover: true,
      titulo: 'Esse jogo ensina\n**Lógica de**\n**Programação**\nmelhor que muito\ncurso pago',
    },
    {
      variant: 'dark',
      topIcon: 'code',
      eyebrow: 'A real',
      titulo: 'Lógica trava\ntodo **iniciante**',
      corpo:
        'Lógica é a base de qualquer linguagem, mas quase ninguém treina de um jeito que dá pra VER funcionando. Fica tudo no exercício de papel, sem sentir o resultado.',
      calloutLabel: 'A virada:',
      callout: '"E se você aprendesse lógica programando um sistema de verdade e visse na hora se funciona?"',
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'code',
      titulo: 'Conheça o\n**Elevator Saga**',
      corpo: 'Um jogo gratuito onde você programa a lógica dos elevadores em JavaScript pra transportar as pessoas com eficiência.',
    },
    {
      variant: 'purple',
      eyebrow: 'Por que funciona',
      titulo: 'Não é quiz,\né código **de verdade**',
      itens: [
        { icone: 'eye', titulo: 'Você VÊ acontecer', sub: 'Rodou a lógica, o elevador se move na hora (ou trava com gente esperando)' },
        { icone: 'code', titulo: 'JavaScript real', sub: 'Você escreve o código que controla os elevadores, não botão de mentira' },
        { icone: 'map', titulo: 'Fase por fase', sub: 'Cada nível é um desafio de otimização, um de cada vez' },
        { icone: 'laptop', titulo: 'Direto no navegador', sub: 'Não instala nada, abre e já começa a programar' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'O que você treina',
      titulo: 'A lógica que\n**sustenta tudo**',
      terminal: ['elevator.on("idle", ...)', 'floor.on("up_button_pressed")', 'elevator.goToFloor(2)', '✓ fila zerada'],
      corpo: 'Condicionais, eventos e otimização de algoritmo: a base que vale pra qualquer linguagem.',
    },
    {
      variant: 'dark',
      topbleed: true,
      eyebrow: 'Como começar',
      titulo: 'Começa agora,\nde graça',
      steps: [
        { n: '01', titulo: 'Abre o jogo', sub: 'É no navegador, sem instalar nada' },
        { n: '02', titulo: 'Lê o desafio da fase', sub: 'Quantas pessoas transportar e em quanto tempo' },
        { n: '03', titulo: 'Programa a lógica', sub: 'Escreve o JS que decide pra onde cada elevador vai' },
        { n: '04', titulo: 'Otimiza', sub: 'Roda, vê onde trava e melhora o algoritmo' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Um aviso honesto',
      titulo: 'É pra quem já\nsabe o **básico**',
      corpo: 'Se você já mexeu com JavaScript e quer treinar lógica de eventos e otimização, é perfeito. Se está no zero absoluto, começa pelo básico antes de vir pra cá.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'O jogo abre a porta.\nDev de verdade\ndomina a lógica.',
      botao: 'Comente SAGA 👇',
      corpo: 'Comenta SAGA pra receber o link do jogo e um doc com as infos técnicas de JS.',
    },
  ],
  legenda:
    'Lógica de programação é a base de tudo, mas quase ninguém treina de um jeito que dá pra ver funcionando. ' +
    'O Elevator Saga resolve isso.\n\n' +
    'É um jogo gratuito, no navegador, onde você programa a lógica dos elevadores em JavaScript pra transportar ' +
    'as pessoas com eficiência. Não é quiz de múltipla escolha: você escreve código de verdade e vê na hora se a ' +
    'sua lógica funciona ou se trava com gente esperando.\n\n' +
    'Cada fase é um desafio de otimização, então você treina o que mais importa no começo: condicionais, eventos ' +
    'e algoritmo. A base que vale pra qualquer linguagem.\n\n' +
    'Um aviso honesto: é pra quem já sabe o básico de JavaScript e quer treinar lógica. Se você está no zero ' +
    'absoluto, começa por outro lugar antes.\n\n' +
    'Comenta SAGA aqui embaixo que eu te mando o link do jogo e um doc com as infos técnicas de JS. E quem pega ' +
    'o doc já entra pro que vem por aí. 👇',
  hashtags:
    'javascript logicadeprogramacao programação algoritmo elevatorsaga jogoprogramação devemdobro aprenderprogramar carreiratech desenvolvimentoweb',
  ctaFinal: 'Comenta SAGA que eu te mando o link do jogo e um doc com as infos técnicas de JS, de graça.',
  briefing:
    'O que é o jogo (pra embasar)\n' +
    'No Elevator Saga você programa a lógica de controle de elevadores (em JavaScript) pra transportar pessoas ' +
    'com eficiência. Cada fase é um desafio de otimização, é lógica de programação e algoritmo aplicados, não ' +
    'teoria solta. Roda no navegador.\n\n' +
    'Pontos que vale abordar\n' +
    'Gancho: um jogo gratuito onde você programa elevadores de verdade pra aprender lógica.\n' +
    'O diferencial: não é quiz de múltipla escolha, você escreve código real (JavaScript) que controla os ' +
    'elevadores, e vê na hora se sua lógica funciona ou trava (as pessoas ficam esperando).\n' +
    'No meio do carrossel, falar do conteúdo que o jogo treina: lógica de programação, condicionais, eventos e ' +
    'otimização de algoritmo, a base que sustenta qualquer linguagem.\n' +
    'Pra quem serve: quem já sabe o básico de JavaScript e quer treinar lógica de eventos e otimização, não é ' +
    'pra quem está no zero absoluto.\n' +
    'CTA: comenta SAGA que mando o link do jogo + doc com infos técnicas de JS. Ao pegar o doc, já entra pro evento.',
};
