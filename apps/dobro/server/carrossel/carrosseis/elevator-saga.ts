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
  dataProgramada: '2026-08-06T12:00:00.000Z',
  refsLinks: 'https://play.elevatorsaga.com/',
  linkPresente: 'https://app.notion.com/p/3b46dd01fb488167a823c182bee59920',
  slides: [
    {
      variant: 'photo',
      cover: true,
      tituloMenor: true,
      titulo: 'Esse jogo ensina\n**Lógica de Programação**\nmelhor que muito\ncurso pago',
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'code',
      eyebrow: 'A promessa é real',
      titulo: 'É de graça e roda\n**no navegador**',
      corpo: 'Chama Elevator Saga: você programa a lógica dos elevadores em JavaScript real e vê na hora se funciona ou trava. Sem instalar nada.',
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
      variant: 'purple',
      eyebrow: 'Por que funciona',
      titulo: 'Não é quiz,\né código **de verdade**',
      itens: [
        { icone: 'eye', titulo: 'Você VÊ acontecer', sub: 'Rodou a lógica, o elevador se move na hora (ou trava com gente esperando)' },
        { icone: 'code', titulo: 'JavaScript real', sub: 'Você escreve o código que controla os elevadores, não botão de mentira' },
        { icone: 'map', titulo: 'Fase por fase', sub: 'Cada nível é um desafio de otimização, um de cada vez' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Salva esse slide',
      titulo: 'Os 3 comandos que\n**você vai usar**',
      terminal: ['elevator.on("idle", ...)', 'floor.on("up_button_pressed")', 'elevator.goToFloor(2)'],
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
      corpo:
        'Comenta SAGA pra receber o link do jogo, o doc com as infos técnicas de JS e o passo a passo pra entrar de graça na Semana do Zero ao Programador Contratado, onde você programa em JavaScript na prática.',
    },
  ],
  legenda:
    // AIDA + SEO do Insta: a 1ª frase tem ~57 caracteres de propósito (a linha de
    // follow come ~56 do preview, então o que passa disso o "mais" corta), e a
    // palavra que a pessoa busca ("lógica de programação") vem por extenso logo no
    // começo e se repete ao longo do texto. Ver memória descricao-insta-linha-follow.
    'Lógica de programação é o que trava quase todo iniciante.\n\n' +
    'E dá pra treinar isso jogando, de graça, no navegador. O jogo chama Elevator Saga: você escreve ' +
    'JavaScript de verdade pra controlar os elevadores de um prédio e levar as pessoas sem deixar ninguém ' +
    'esperando.\n\n' +
    'Não é quiz de múltipla escolha. É código rodando na tela, e você vê na hora se a sua lógica funciona ou ' +
    'se trava com gente parada no corredor.\n\n' +
    'Cada fase é um desafio de otimização, então você treina o que sustenta qualquer linguagem: condicionais, ' +
    'eventos e algoritmo. É lógica de programação aplicada, não teoria solta no caderno.\n\n' +
    'Um aviso honesto: é pra quem já sabe o básico de JavaScript e quer treinar lógica. Se você está no zero ' +
    'absoluto, começa por outro lugar antes.\n\n' +
    'Comenta SAGA aqui embaixo que eu te mando o link do jogo e um doc com as infos técnicas de JS. E se você ' +
    'quer aprender JavaScript na prática, mando junto o passo a passo pra se inscrever de graça na Semana do ' +
    'Zero ao Programador Contratado, onde a gente constrói um projeto de verdade do zero ao deploy. 👇',
  hashtags:
    'javascript logicadeprogramacao programação algoritmo elevatorsaga jogoprogramação devemdobro aprenderprogramar carreiratech desenvolvimentoweb',
  ctaFinal:
    'Comenta SAGA que eu te mando o link do jogo, o doc com as infos técnicas de JS e o passo a passo pra se ' +
    'inscrever de graça na Semana do Zero ao Programador Contratado, onde você aprende JavaScript na prática.',
  briefing:
    '🔮 PREVISÃO DA IA (registrada em 03/08/2026, ANTES de publicar)\n' +
    'Veredito: alta chance de performar. Score 25/25 no framework Fura a Bolha (a versão anterior tirava 18/25).\n' +
    'Aposta principal: salvamentos (slide "SALVA ESSE SLIDE" com os 3 comandos) e retenção (o slide 2 confirma o gancho em vez de abrir pelo problema).\n' +
    '⏳ INSIGHTS A VERIFICAR após publicar hoje (03/08): salvamentos, alcance, retenção/tempo e comentários com "SAGA". Comparar previsão x real.\n\n' +
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
