/**
 * apps/dobro — carrossel do Learn Git Branching (jogo grátis no navegador que
 * ensina branch, merge, rebase e cherry-pick de forma visual).
 *
 * Encaixe no veredito: categoria "ferramenta/jogo grátis que ensina", a mesma do
 * Oh My Git (campeão real: +49 seguidores e 368 comentários) e do LightBot.
 *
 * Precisão (Article IV, conferido em learngitbranching.js.org em 05/08/2026):
 * roda no navegador, é open source (repositório pcottle/learnGitBranching), tem
 * terminal interativo onde você digita comandos git de verdade e vê a árvore de
 * commits se mexer, e cobre branch, merge, rebase e cherry-pick. NÃO afirmamos
 * número de níveis nem idiomas, que não foram verificados. SEM travessão.
 */
import type { Carrossel } from '../types';

export const learnGitBranching: Carrossel = {
  slug: 'learn-git-branching',
  titulo: 'O jogo grátis que faz você finalmente entender Git',
  gancho: 'Você decora comandos de Git e continua com medo de dar merge. Esse jogo grátis resolve isso.',
  refsLinks: 'https://learngitbranching.js.org/',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      titulo: 'Você decora\ncomandos de Git\ne continua com\nmedo de dar merge.\nEsse jogo **grátis**\nresolve isso.',
      corpo: 'Passa pro lado que eu te mostro 👉',
    },
    {
      variant: 'dark',
      eyebrow: 'O que é',
      titulo: 'Chama **Learn Git\nBranching**',
      steps: [
        { n: '01', titulo: 'Roda no navegador', sub: 'Não instala nada, abre o site e começa' },
        { n: '02', titulo: 'Você digita git de verdade', sub: 'É um terminal real, não botão de mentira' },
        { n: '03', titulo: 'A árvore se mexe na hora', sub: 'Cada comando desenha o que aconteceu com os commits' },
        { n: '04', titulo: 'É de graça e open source', sub: 'Projeto aberto, sem cadastro e sem plano' },
      ],
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'follow',
      eyebrow: 'Antes de continuar',
      titulo: 'Segue o\n**@devemdobro**',
      corpo: 'Toda semana eu mostro ferramenta grátis que destrava quem está aprendendo a programar. Segue pra não perder.',
    },
    {
      variant: 'dark',
      eyebrow: 'Salva esse slide',
      titulo: 'O que você sai\nde lá **sabendo**',
      terminal: [
        '$ git branch feature',
        '$ git merge feature',
        '$ git rebase main',
        '$ git cherry-pick a1b2c3d',
      ],
      corpo: 'São exatamente os quatro que separam quem tem medo do Git de quem trabalha tranquilo em equipe.',
    },
    {
      variant: 'purple',
      eyebrow: 'Por que funciona',
      titulo: 'O problema do Git\nnunca foi o comando',
      itens: [
        { icone: 'eye', titulo: 'É espacial, não decoreba', sub: 'Você não entende merge lendo, entende vendo dois caminhos virarem um' },
        { icone: 'loop', titulo: 'Errar não custa nada', sub: 'Aqui você quebra a árvore à vontade, sem quebrar o repositório do trabalho' },
        { icone: 'map', titulo: 'Um conceito por vez', sub: 'Cada desafio isola uma ideia, em vez de jogar tudo junto' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'A parte que ninguém encara',
      titulo: 'Rebase deixa de ser\num **bicho de sete cabeças**',
      corpo:
        'Rebase é o comando que mais gera medo porque reescreve história e você não vê o que está acontecendo. Ali você vê: a árvore se reorganiza na sua frente e a ficha cai.',
    },
    {
      variant: 'dark',
      eyebrow: 'Pra que serve na prática',
      titulo: 'Isso aparece no seu\nprimeiro dia de **trabalho**',
      itens: [
        { icone: 'code', titulo: 'Trabalhar em branch', sub: 'Ninguém commita direto na main em time nenhum' },
        { icone: 'puzzle', titulo: 'Resolver conflito', sub: 'Merge deu ruim é rotina, não acidente' },
        { icone: 'follow', titulo: 'Revisar código dos outros', sub: 'Entender o histórico é metade do trabalho em equipe' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Um aviso honesto',
      titulo: 'Não substitui usar\nGit **de verdade**',
      corpo:
        'O jogo destrava o conceito, mas o aprendizado fecha quando você aplica em um projeto seu. Faz os desafios e no mesmo dia cria uma branch no seu repositório pra sentir na prática.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o link e a\nordem certa?',
      botao: 'Comente GIT 👇',
      corpo: 'Comenta GIT que eu te mando o link do jogo e um resumo dos comandos que você vai usar todo dia.',
    },
  ],
  legenda:
    'Decorar comando de Git não resolve. A pessoa sabe que existe merge e mesmo assim trava na hora de dar merge, ' +
    'porque não faz ideia do que está acontecendo com o histórico.\n\n' +
    'O Learn Git Branching resolve isso mostrando. É um jogo gratuito que roda no navegador, sem instalar nada. Você ' +
    'digita comandos de Git de verdade em um terminal e vê a árvore de commits se reorganizar na hora.\n\n' +
    'Ele cobre justamente o que assusta: branch, merge, rebase e cherry-pick. Rebase, principalmente, deixa de ser um ' +
    'bicho de sete cabeças quando você vê a árvore se reorganizando na sua frente.\n\n' +
    'E errar ali não custa nada. Você quebra o histórico à vontade sem quebrar o repositório do trabalho.\n\n' +
    'Um aviso honesto: o jogo destrava o conceito, mas o aprendizado fecha quando você aplica em um projeto seu. Faz ' +
    'os desafios e no mesmo dia cria uma branch no seu repositório.\n\n' +
    'Comenta GIT aqui embaixo que eu te mando o link e um resumo dos comandos que você vai usar todo dia. 👇',
  hashtags: 'git github programacao devweb carreiratech aprenderprogramar versionamento devemdobro logicadeprogramacao opensource',
  ctaFinal: 'Comenta GIT que eu te mando o link do jogo e um resumo dos comandos que você vai usar todo dia.',
  briefing:
    'FÓRMULA: jogo/ferramenta grátis que ensina, categoria validada pelo Oh My Git (campeão real) e pelo LightBot.\n\n' +
    'FATOS CONFERIDOS em 05/08/2026 (learngitbranching.js.org)\n' +
    'Roda no navegador, open source (pcottle/learnGitBranching), terminal interativo com comandos git reais, cobre ' +
    'branch, merge, rebase e cherry-pick, a árvore de commits reage a cada comando.\n' +
    'NÃO afirmamos número de níveis nem idiomas, que não foram verificados.\n\n' +
    'PENDENTE: arte de capa. Pela análise das capas campeãs, o ideal é um print da árvore de commits do próprio jogo.',
};
