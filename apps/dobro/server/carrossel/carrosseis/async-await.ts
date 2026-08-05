/**
 * apps/dobro — carrossel de CONCEITO: por que seu código JavaScript roda fora de
 * ordem (assíncrono, promise, async/await).
 *
 * Encaixe no veredito: "conceito que destrava iniciante" (estrutura mais
 * consistente depois de Ferramenta). É a barreira clássica de quem sai do HTML e
 * CSS pro JavaScript de verdade, e a dor aparece exatamente quando a pessoa
 * chama a primeira API.
 *
 * Precisão (Article IV): só comportamento padrão da linguagem, nada inventado.
 * O undefined do exemplo acontece porque o console.log roda antes de a resposta
 * chegar. await só é válido dentro de função async (ou em módulo com top-level
 * await). try/catch é a forma de tratar erro com async/await. SEM travessão.
 */
import type { Carrossel } from '../types';

export const asyncAwait: Carrossel = {
  slug: 'async-await',
  titulo: 'Por que seu código JavaScript roda fora de ordem',
  gancho: 'Seu console.log imprime undefined e o dado aparece depois. Não é bug, e entender isso destrava tudo.',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      titulo: 'Seu console.log\nimprime **undefined**\ne o dado aparece\ndepois.\nNão é bug.\nE entender destrava tudo.',
      corpo: 'Passa pro lado que eu te explico 👉',
    },
    {
      variant: 'dark',
      eyebrow: 'O que está acontecendo',
      titulo: 'O JavaScript não\n**espera** por você',
      steps: [
        { n: '01', titulo: 'Ele lê linha por linha', sub: 'Mas não para o programa pra esperar uma resposta demorada' },
        { n: '02', titulo: 'Buscar dado demora', sub: 'Uma chamada de API leva tempo, e esse tempo não é seu' },
        { n: '03', titulo: 'Ele segue em frente', sub: 'Roda a próxima linha enquanto a resposta ainda está vindo' },
        { n: '04', titulo: 'Por isso vem undefined', sub: 'Você imprimiu antes de a resposta chegar, só isso' },
      ],
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'follow',
      eyebrow: 'Antes de continuar',
      titulo: 'Segue o\n**@devemdobro**',
      corpo: 'Toda semana eu destravo um conceito que trava quem está aprendendo a programar. Segue pra não perder.',
    },
    {
      variant: 'dark',
      eyebrow: 'Salva esse slide',
      titulo: 'O antes e o **depois**',
      terminal: [
        '// não espera: imprime undefined',
        'const dados = buscarUsuario()',
        'console.log(dados)',
        '',
        '// espera: imprime o usuário',
        'const dados = await buscarUsuario()',
        'console.log(dados)',
      ],
      corpo: 'A palavra await diz uma coisa só: segura aqui até a resposta chegar, depois continua.',
    },
    {
      variant: 'purple',
      eyebrow: 'As três palavras',
      titulo: 'O que cada uma\nfaz de verdade',
      itens: [
        { icone: 'loop', titulo: 'Promise', sub: 'A promessa de um valor que ainda não chegou, mas vai chegar' },
        { icone: 'code', titulo: 'async', sub: 'Marca a função como uma que pode esperar por algo' },
        { icone: 'bookmark', titulo: 'await', sub: 'Só funciona dentro de uma função async, e é ela que segura' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'O erro que ninguém avisa',
      titulo: 'await **fora** de\nfunção async',
      corpo:
        'É o erro clássico de quem acabou de aprender. Se a função não está marcada como async, o await não é válido ali. Marca a função e o problema some.',
    },
    {
      variant: 'dark',
      denso: true,
      eyebrow: 'A parte que separa iniciante de profissional',
      titulo: 'E quando a API\n**falhar**?',
      terminal: [
        'try {',
        '  const dados = await buscarUsuario()',
        '} catch (erro) {',
        '  // internet caiu, servidor fora, token vencido',
        '}',
      ],
      corpo: 'Requisição falha o tempo todo no mundo real. Código sem try e catch quebra a tela inteira do usuário.',
    },
    {
      variant: 'light',
      eyebrow: 'Um aviso honesto',
      titulo: 'Não é sobre\n**decorar** a sintaxe',
      corpo:
        'Você não precisa saber explicar o event loop numa entrevista. Precisa entender que existe coisa que demora, que o programa não para por causa dela, e que await é como você pede pra esperar.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer os exemplos\npra rodar agora?',
      botao: 'Comente ASYNC 👇',
      corpo: 'Comenta ASYNC que eu te mando os exemplos comentados pra você rodar e ver acontecendo.',
    },
  ],
  legenda:
    'Você chama uma API, dá console.log e vem undefined. Aí você roda de novo e às vezes funciona. Isso derruba muita ' +
    'gente que estava indo bem no JavaScript.\n\n' +
    'Não é bug. O JavaScript lê seu código linha por linha, mas não para o programa pra esperar uma resposta que ' +
    'demora. Ele segue em frente. Quando você imprimiu, a resposta ainda estava vindo. Por isso undefined.\n\n' +
    'A palavra await diz uma coisa só: segura aqui até a resposta chegar, depois continua. E ela só é válida dentro ' +
    'de uma função marcada como async, que é justamente o erro mais comum de quem acabou de aprender.\n\n' +
    'As três palavras, na prática: Promise é a promessa de um valor que ainda não chegou. async marca a função como ' +
    'uma que pode esperar. await é quem segura.\n\n' +
    'E tem a parte que separa iniciante de profissional: requisição falha o tempo todo no mundo real. Internet cai, ' +
    'servidor sai do ar, token vence. Código sem try e catch quebra a tela inteira do usuário.\n\n' +
    'Um aviso honesto: não é sobre decorar sintaxe nem explicar o event loop numa entrevista. É entender que existe ' +
    'coisa que demora, que o programa não para por causa dela, e que await é como você pede pra esperar.\n\n' +
    'Comenta ASYNC aqui embaixo que eu te mando os exemplos comentados pra você rodar e ver acontecendo. 👇',
  hashtags: 'javascript async await promise devweb frontend programacao aprenderprogramar devemdobro carreiratech',
  ctaFinal: 'Comenta ASYNC que eu te mando os exemplos comentados pra você rodar e ver acontecendo.',
  briefing:
    'FÓRMULA: conceito que destrava iniciante (a estrutura mais consistente depois de Ferramenta). É a barreira ' +
    'clássica de quem sai do HTML e CSS pro JavaScript de verdade.\n\n' +
    'PRECISÃO: só comportamento padrão da linguagem. O undefined acontece porque o console.log roda antes de a ' +
    'resposta chegar; await só é válido dentro de função async (ou em módulo com top-level await, que o carrossel ' +
    'não cita pra não confundir iniciante); try/catch é a forma de tratar erro com async/await.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1: a capa usa o sintoma (undefined) que a pessoa já viveu, não a explicação.\n' +
    'Regra 2: o slide 2 confirma o gancho explicando o porquê, em vez de abrir pelo problema de novo.\n' +
    'Regra 4 (slide salvável): o slide 4 mostra o antes e o depois em código.\n' +
    'Regra 5: CTA único, comenta ASYNC.\n\n' +
    'PENDENTE: arte de capa. Sugestão: print do console mostrando undefined em vermelho.',
};
