/**
 * apps/dobro — carrossel de CONCEITO: os comandos de Git que resolvem o dia a dia.
 *
 * Encaixe no veredito: "conceito que destrava iniciante" é a segunda estrutura
 * mais consistente da conta (não depende de viral). Git é a dor clássica de quem
 * entra no primeiro emprego. Complementa o carrossel do Learn Git Branching:
 * lá é o jogo, aqui é a cola.
 *
 * Precisão (Article IV): só comandos padrão do Git, sem alias inventado e sem
 * afirmar percentual medido. O "90%" do gancho é declaradamente uma estimativa
 * de rotina, e por isso o texto fala em "quase tudo o que você faz", não em dado.
 * Nenhuma ferramenta paga é citada. SEM travessão.
 */
import type { Carrossel } from '../types';

export const gitComandosDia: Carrossel = {
  slug: 'git-comandos-dia',
  // O NÚMERO ENTROU NO TÍTULO em 15/08/2026, e não é cosmético: na base medida,
  // carrossel com número contável no título tem alcance mediano de 9.429 contra
  // 4.769 dos sem número, e 69,6 salvamentos por mil contra 47,5. Como este post
  // é uma cola (vive de salvamento), é o formato certo. O gancho já dizia "os
  // mesmos sete": o número só subiu pro lugar onde é visto antes do swipe.
  titulo: 'Os 7 comandos de Git que resolvem quase todo o seu dia',
  gancho: 'Git tem centenas de comandos e você usa sempre os mesmos sete. Salva essa cola.',
  dataProgramada: '2026-08-18',
  /**
   * Presente do "comenta COMANDOS" (Notion, 15/08/2026): a cola completa em
   * tabela (os 7 + os 3 de emergência), o passo a passo do conflito com as marcas
   * do Git explicadas e o `git merge --abort` como saída de emergência, a régua
   * da mensagem de commit e o Learn Git Branching. No fim, o convite do DevQuest.
   *
   * LINK PRIVADO: trocar pelo `.notion.site` depois de Compartilhar > Publicar.
   * FECHADO em 20/08/2026: o placeholder virou o link real de matrícula, com
   * utm_content `git-comandos-dia-18-08`. Este card não existe mais no board
   * (casado por slug), então a data veio da `dataProgramada` daqui.
   */
  linkPresente: 'https://app.notion.com/p/3bd6dd01fb48815695fffefbaa2f69a6',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      baixo: true,
      // A capa REPETE O TÍTULO do post e a tensão desce pro subtítulo (memórias
      // capas-carrossel-padrao e subtitulo-da-capa-e-tensao). A versão anterior
      // tinha um título de seis linhas que era o post inteiro escrito na capa.
      titulo: 'Os **7 comandos**\nde Git que\nresolvem seu dia',
      subtitulo: 'Git tem centenas. Você usa sempre os mesmos sete.',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      eyebrow: 'A real',
      titulo: 'O problema não é\ndecorar, é a **ordem**',
      steps: [
        { n: '01', titulo: 'Ver onde você está', sub: 'Antes de qualquer coisa, saber o que mudou e em qual branch' },
        { n: '02', titulo: 'Separar o que vai', sub: 'Escolher o que entra no commit, não jogar tudo de uma vez' },
        { n: '03', titulo: 'Registrar', sub: 'Commit com mensagem que explica o porquê, não o que' },
        { n: '04', titulo: 'Sincronizar', sub: 'Puxar o que os outros fizeram antes de mandar o seu' },
      ],
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'follow',
      eyebrow: 'Antes de continuar',
      titulo: 'Segue o\n**@devemdobro**',
      corpo: 'Toda semana eu destravo um conceito que trava quem está começando a programar. Segue pra não perder.',
    },
    {
      variant: 'dark',
      denso: true,
      brandLogo: 'git',
      eyebrow: 'Salva esse slide',
      titulo: 'A cola dos **sete**',
      terminal: [
        '$ git status          → o que mudou',
        '$ git switch -c nova  → cria e entra na branch',
        '$ git add arquivo.js  → escolhe o que vai',
        '$ git commit -m "..." → registra a mudança',
        '$ git pull            → traz o dos outros',
        '$ git push            → manda o seu',
        '$ git log --oneline   → vê o histórico',
      ],
    },
    {
      variant: 'purple',
      eyebrow: 'O que salva sua pele',
      // Dizia "os dois" e listava TRÊS (restore, stash, diff). Corrigido em
      // 15/08/2026, antes de publicar.
      titulo: 'Os três que você\nvai precisar no susto',
      itens: [
        { icone: 'loop', titulo: 'git restore arquivo.js', sub: 'Desfaz o que você mexeu num arquivo e ainda não commitou' },
        { icone: 'bookmark', titulo: 'git stash', sub: 'Guarda o que está pela metade pra você trocar de branch em paz' },
        { icone: 'eye', titulo: 'git diff', sub: 'Mostra exatamente o que mudou antes de você commitar besteira' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'O erro que todo mundo comete',
      titulo: 'Commit gigante\nno **fim do dia**',
      corpo:
        'Juntar oito horas de trabalho num commit só transforma o histórico em lixo e o conflito em pesadelo. Commita pequeno, a cada pedaço que funciona sozinho. Seu eu do futuro agradece.',
    },
    {
      variant: 'dark',
      eyebrow: 'A mensagem importa',
      titulo: 'Mensagem boa explica\no **porquê**',
      itens: [
        { icone: 'ban', titulo: 'Ruim: "ajustes"', sub: 'Daqui a um mês ninguém sabe o que foi ajustado nem por quê' },
        { icone: 'code', titulo: 'Boa: "corrige login que caía sem token"', sub: 'Diz o que quebrou e o que passou a funcionar' },
        { icone: 'map', titulo: 'O diff já mostra o que mudou', sub: 'Então use a mensagem pra contar a intenção, não o código' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Um aviso honesto',
      titulo: 'Cola resolve o dia,\nnão o **conceito**',
      corpo:
        'Esses sete te fazem trabalhar sem travar. Mas na hora que der conflito ou você precisar de rebase, cola não salva. Aí você precisa entender o que acontece com o histórico.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer a cola pra\ndeixar do lado?',
      botao: 'Comenta COMANDOS 👇',
      // TRÊS entregas, não duas. Na semana medida, CTA com três entregas ficou
      // entre 19,7 e 29,5 comentários por mil; com duas, entre 13,8 e 17,0.
      corpo:
        'Te mando a cola completa pra deixar do lado, o passo a passo de quando dá conflito e o link do jogo que ensina o resto de Git.',
    },
  ],
  legenda:
    'Git tem centenas de comandos e isso assusta quem está começando. Só que no dia a dia, em qualquer empresa, você ' +
    'usa quase sempre os mesmos sete.\n\n' +
    'git status pra ver o que mudou e em que branch você está. git switch -c pra criar e entrar numa branch nova. ' +
    'git add pra escolher o que entra no commit. git commit -m pra registrar. git pull pra trazer o que os outros ' +
    'fizeram. git push pra mandar o seu trabalho. E git log --oneline pra ler o histórico.\n\n' +
    'Guarde também os três que salvam sua pele no susto: git restore desfaz o que você mexeu e ainda não commitou, ' +
    'git stash guarda o que está pela metade pra você trocar de branch, e git diff mostra o que mudou antes de você ' +
    'commitar besteira.\n\n' +
    'O erro mais comum não é de comando, é de hábito: juntar o dia inteiro num commit só. Isso transforma o histórico ' +
    'em lixo e o conflito em pesadelo. Commita pequeno, a cada pedaço que funciona sozinho.\n\n' +
    'E mensagem boa explica o porquê. "ajustes" não diz nada. "corrige login que caía sem token" diz o que quebrou e ' +
    'o que passou a funcionar. O diff já mostra o código, então use a mensagem pra contar a intenção.\n\n' +
    'Um aviso honesto: cola resolve o dia, não o conceito. Na hora do conflito ou do rebase, você vai precisar ' +
    'entender o que acontece com o histórico.\n\n' +
    'Comenta COMANDOS aqui embaixo que eu te mando a cola completa, o passo a passo de quando dá conflito e o link do ' +
    'jogo que ensina o resto. 👇',
  hashtags: 'git github programacao devweb carreiratech primeiroemprego aprenderprogramar devemdobro versionamento dicasdev',
  ctaFinal:
    'Comenta COMANDOS que eu te mando a cola completa pra deixar do lado, o passo a passo de quando dá conflito e o link do jogo que ensina o resto de Git.',
  briefing:
    'FÓRMULA: conceito que destrava iniciante, a segunda estrutura mais consistente da conta (não depende de viral). ' +
    'Complementa o carrossel do Learn Git Branching: lá é o jogo, aqui é a cola.\n\n' +
    'PRECISÃO: só comandos padrão do Git, sem alias inventado e sem afirmar percentual medido. O "quase todo o seu ' +
    'dia" do título é rotina declarada, não dado.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 4 (slide salvável): o slide 4 é a cola dos sete comandos, o ativo que gera salvamento.\n' +
    'Regra 5: CTA único, comenta COMANDOS.\n\n' +
    'PENDENTE: arte de capa. Sugestão: print de um terminal com git log --oneline colorido.',
};
