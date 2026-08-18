/**
 * apps/dobro — carrossel "Por isso o seu currículo vai pro limbo das empresas de
 * tecnologia".
 *
 * ORIGEM: referência @realrayjones (14.547 curtidas / 247 comentários), a maior
 * proporção de curtida por comentário do nosso banco, ou seja, tema que segura
 * sozinho sem CTA carregando.
 *
 * HISTÓRICO DE ÂNGULO (12/08/2026): a 1ª versão deste post era o experimento das
 * 100 rodadas (o mesmo currículo tirando de 66 a 99 na mesma máquina). O dono
 * cortou por dois motivos: ficou difícil de entender sem contexto, e o post
 * dependia de a pessoa RODAR a ferramenta, o que esbarra numa dúvida que ele
 * levantou e o repositório não responde: nada na documentação diz se a avaliação
 * funciona com currículo em PORTUGUÊS. Os prompts internos são todos em inglês.
 *
 * O ÂNGULO ATUAL RESOLVE ISSO: a pessoa não precisa rodar nada. O que a HackerRank
 * abriu junto com o código foi o PROMPT que manda o modelo pontuar, e ele diz com
 * todas as letras o que faz perder ponto. A gente entrega as regras, não a nota.
 * O idioma deixa de importar, o post fica simples e vira acionável hoje.
 *
 * PRECISÃO (Article IV) — tudo abaixo lido VERBATIM em 12/08/2026 de
 * roles/software_engineering_intern/system_message.jinja e role.json, no repo
 * github.com/interviewstreet/hiring-agent:
 *   · "For self projects that are basic CRUD applications, give NO POINTS
 *     (0 points)";
 *   · "Simple tutorial projects (todo lists, calculators, basic CRUD apps,
 *     weather apps, note-taking apps) should receive LOW SCORES (1-9 points)";
 *   · "Apply 3-5 point deductions for each project without any GitHub link, live
 *     demo, or active URL. Projects with only GitHub links (no live demo) should
 *     receive 2-3 point deductions";
 *   · "Having personal GitHub repositories does NOT constitute open source
 *     contribution... Personal repositories should receive low scores (5-10
 *     points)";
 *   · "Hacktoberfest participation alone... should receive 5-8 points maximum",
 *     com dedução adicional de 3 a 5 pontos;
 *   · "A single complex project is worth more than multiple simple ones";
 *   · pesos (role.json e o próprio prompt): open_source 35, self_projects 30,
 *     production 25, technical_skills 10, bônus até 20, teto final 120;
 *   · bônus por GSoC, Girl Script Summer of Code, Outreachy e Season of Docs, e
 *     por blog técnico com regularidade e diversidade de tema;
 *   · justiça, verbatim: "SCORES MUST NEVER DEPEND ON... Candidate's name,
 *     gender... College, university, or educational institution name... CGPA, GPA,
 *     or academic grades... City, location, or geographical information".
 *
 * OS PESOS ENTRAM AQUI, ao contrário da versão anterior. Eles são primários
 * (role.json) e agora são o miolo do post: a pessoa precisa ver que open source
 * vale 35 e habilidade técnica vale 10, porque é o contrário do que ela supõe.
 *
 * O QUE A REFERÊNCIA ERRA, e a gente corrige: ela diz "HackerRank open-sourced
 * their ATS". O README nega em três linhas, VERBATIM: "Not an ATS (Applicant
 * Tracking System)", "Not used to screen HackerRank's open roles", "Not a product
 * available to HackerRank customers". É triagem de currículo de ESTÁGIO, com corte
 * baixo de propósito: "the cutoff is intentionally set very low so only candidates
 * at the very bottom of the distribution are removed. The vast majority pass
 * through to human review". O slide de aviso honesto carrega isso.
 *
 * POR ISSO A CAPA NÃO DIZ "ATS": o dono sugeriu "o robô de ATS do HackerRank", e
 * a troca por "o robô de currículo que a HackerRank abriu" mantém a força sem
 * repetir o erro da referência logo na capa, que é onde a gente não tem espaço
 * pra ressalva. Se ele preferir a versão com ATS, é uma linha.
 *
 * O EXPERIMENTO DAS 100 RODADAS não sumiu: virou o aviso honesto. Dan Kinsky
 * (danunparsed.com, 28/06/2026) rodou o mesmo currículo 100 vezes e as notas foram
 * "range from 66 to 99". É a razão de o post entregar as REGRAS e não a nota.
 *
 * SEM TRAVESSÃO em conteúdo. CTA sem captação pra Semana.
 *
 * CAPA: pendente.
 */
import type { Carrossel } from '../types';

export const curriculoLimbo: Carrossel = {
  slug: 'curriculo-limbo',
  titulo: 'Por isso o seu currículo vai pro limbo das empresas de tecnologia',
  gancho: 'A HackerRank abriu o robô que pontua currículo, e dá pra ler o que ele corta.',
  dataProgramada: '2026-08-13',
  refsLinks:
    'https://www.instagram.com/reel/DZ3qClJABfc/ (referência: @realrayjones, 14.547 curtidas)\n' +
    'https://github.com/interviewstreet/hiring-agent (fonte primária, lida em 12/08/2026)\n' +
    'roles/software_engineering_intern/system_message.jinja (as regras citadas nos slides)',
  /**
   * Presente do "comenta LIMBO" (Notion, 12/08/2026). Traz a tabela de pesos, a
   * lista do que perde ponto com os descontos exatos, o que ganha, o que o robô é
   * proibido de olhar, um antes e depois do mesmo projeto de currículo e o passo a
   * passo pra rodar, com as três ressalvas: a nota varia de 66 a 99 no mesmo
   * arquivo, o idioma não é documentado e o modelo padrão do repo já mudou.
   * SEM captação pra Semana, pela decisão de 12/08/2026.
   */
  linkPresente: 'https://app.notion.com/p/3ba6dd01fb48814ea5adcb4fcc5f08be',
  /**
   * Capa (imagem do dono, 12/08/2026): montanha gigante de currículos impressos
   * num galpão escuro, com UM deles aceso em roxo no meio e uma seta apontando
   * pra ele. É o "limbo" em imagem, e o volume é literal: a HackerRank recebe
   * dezenas de milhares de currículos de estágio por ano.
   * A composição saiu do método da casa, copiando a capa campeã do
   * @kyle.disruptor (ele no topo de uma montanha de moedas) e trocando o objeto.
   * Já vem em 4:5 (1122×1402) com o rodapé em preto chapado, então `scrim:'bloco'`
   * basta. A arte traz o logo da HackerRank no topo: é uso editorial, o post fala
   * da ferramenta deles, e ainda entrega a fonte antes de a pessoa deslizar.
   */
  bgImage: 'server/carrossel/assets/curriculo-limbo/capa.png',
  slides: [
    {
      variant: 'photo',
      cover: true,
      scrim: 'bloco',
      baixo: true,
      tituloMenor: true,
      // 0.9 e não 1.05: o título tem 3 linhas longas e, no tamanho anterior, a 1ª
      // quebrava sozinha em duas ("Por isso o seu" / "currículo") e o bloco subia
      // pra cima da pilha de papel, onde o contraste morre. Menor, ele cabe em 3
      // linhas e fica todo dentro do preto do rodapé.
      tituloEscala: 0.9,
      titulo: 'Por isso o seu currículo\nvai pro **limbo** das\nempresas de tecnologia',
      subtitulo: 'A HackerRank abriu o robô que pontua, e dá pra ler as regras',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      eyebrow: 'O que aconteceu',
      titulo: 'Eles abriram o **manual\ndo robô**',
      // Corpo curto porque o print entra embaixo e come altura. O print PROVA o
      // slide: mostra o repositório com a pasta `prompts` e a
      // `roles/software_engineering_intern`, que é de onde saem todas as regras
      // citadas nos slides seguintes. Capturado em 12/08/2026.
      corpo:
        'Eles recebem dezenas de milhares de currículos de estágio por ano, e criaram um robô pra dar nota em cada um. **Depois publicaram o código.**',
      imagem: 'server/carrossel/assets/curriculo-limbo/repo.png',
    },
    {
      variant: 'light',
      eyebrow: 'A regra que zera',
      titulo: 'Projeto de CRUD tira\n**zero ponto**',
      corpo:
        'Está escrito assim na instrução do robô. **A gente sempre falou isso por aqui**: currículo cheio de projeto de tutorial não diz nada sobre você.',
      terminal: [
        '✗ CRUD básico            0 pontos',
        '✗ to-do, calculadora     1 a 9',
        '✗ app de clima, notas    1 a 9',
        '✓ um projeto complexo    até 30',
      ],
    },
    {
      // A tabela de pesos subiu pra logo depois do CRUD (decisão do dono,
      // 12/08/2026): é ela que explica POR QUE o CRUD zerando dói tanto, e antes
      // vinha só no fim, depois de dois slides de desconto. Em `steps` e não em
      // `terminal` porque o número precisa aparecer grande: a pontuação é o
      // argumento do slide, não um detalhe da linha.
      variant: 'light',
      eyebrow: 'Onde estão os pontos',
      titulo: 'Open source vale **35**.\nHabilidade técnica, **10**.',
      steps: [
        { n: '35', titulo: 'Open source', sub: 'Contribuir em projeto dos outros' },
        { n: '30', titulo: 'Projetos próprios', sub: 'Complexos e com link no ar' },
        { n: '25', titulo: 'Experiência em produção', sub: 'Código que rodou pra valer' },
        { n: '10', titulo: 'Habilidades técnicas', sub: 'A lista de tecnologias' },
      ],
      corpo:
        '**Só encher currículo de habilidade é igual a nada: são os projetos que mais importam, sempre.** As duas primeiras linhas somam 65 e são o seu GitHub.',
    },
    {
      variant: 'dark',
      eyebrow: 'O desconto silencioso',
      titulo: 'Projeto sem link\n**perde ponto**',
      corpo:
        'Não é só deixar de ganhar: é desconto. **Cada projeto sem link** leva de 3 a 5 pontos a menos. Se tiver só o GitHub e nenhuma demonstração no ar, ainda perde de 2 a 3.',
    },
    // REMOVIDO em 12/08/2026 (decisão do dono): havia aqui o slide roxo "Seu GitHub
    // pessoal não é open source", com a régua de 5 a 10 pontos pra repositório
    // próprio. Era o terceiro slide seguido dizendo que a pessoa está errada, e o
    // post ganhou ritmo perdendo ele. A informação não some: ela está no slide dos
    // pontos, na linha do open source ("contribuir em projeto dos outros"), e no
    // checklist ("repo só seu → contribuir").
    {
      variant: 'dark',
      eyebrow: 'A boa notícia',
      titulo: 'O que ele é **proibido**\nde olhar',
      corpo: 'A instrução manda ignorar, com todas as letras, e isso vale a favor de quem está começando.',
      itens: [
        { icone: 'ban', titulo: 'Sua faculdade', sub: 'O nome da instituição não pode entrar na nota' },
        { icone: 'ban', titulo: 'Suas notas', sub: 'Coeficiente e histórico escolar estão fora' },
        { icone: 'ban', titulo: 'Onde você mora', sub: 'Cidade e localização não podem pesar' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Salva esse post pra fazer depois',
      titulo: 'O que **trocar** hoje',
      terminal: [
        '→ 3 projetos simples    → 1 complexo',
        '→ projeto sem link      → link no ar',
        '→ repo só seu           → contribuir',
        '→ lista de tecnologia   → o que fez',
      ],
      corpo:
        'A instrução diz que **um projeto complexo vale mais que vários simples**. Se você só tem tempo pra uma coisa esta semana, é botar link no ar nos projetos que já existem.',
    },
    {
      variant: 'light',
      eyebrow: 'Aviso honesto',
      titulo: 'Isso **não** é o filtro\nda vaga que você quer',
      corpo:
        'O que eles abriram não é um ATS e não roda nas vagas abertas deles: é triagem de estágio, com corte baixo, onde quase todo mundo passa pra leitura humana. E rodando o mesmo currículo 100 vezes as notas variam. **O que vale aqui é a régua, não a nota.**',
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer a régua\ncompleta?',
      botao: 'Comenta LIMBO 👇',
      corpo:
        'Te mando as regras do robô traduzidas, com o que ganha e o que perde ponto em cada item, e o antes e depois de um projeto de currículo de iniciante.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  legenda:
    'Comenta LIMBO que eu te mando a régua completa. 📄\n\n' +
    'A HackerRank abriu o código do robô que pontua currículo de estágio deles. Junto com o código veio o texto que ' +
    'manda o robô dar a nota, e ele diz o que corta.\n\n' +
    'O que me pegou foi ver que projeto de CRUD tira zero, e que lista de tarefas e calculadora valem de 1 a 9 num ' +
    'item que vale 30. É o que quase todo iniciante coloca. E projeto sem link no ar ainda leva desconto.\n\n' +
    'A parte boa: o robô é proibido de olhar faculdade, nota e cidade. O que ele olha é o que você construiu e ' +
    'onde dá pra ver isso funcionando.\n\n' +
    'Comenta LIMBO que eu te mando as regras traduzidas, com o que ganha e o que perde ponto em cada item.',
  hashtags:
    'programacao carreiratech vagadev curriculo devbr primeiroemprego portfoliodev opensource devemdobro estagio',
  ctaFinal:
    'Comenta LIMBO que eu te mando as regras do robô traduzidas, com o que ganha e o que perde ponto em cada item, ' +
    'e o antes e depois de um projeto de currículo de iniciante.',
  briefing:
    'FÓRMULA: a referência @realrayjones tem 14.547 curtidas para 247 comentários, a maior proporção do banco. Tema ' +
    'que segura sozinho, então este post entra como ATRAÇÃO. Se render alcance e pouco comentário, cumpriu o papel.\n\n' +
    'O ÂNGULO MUDOU DUAS VEZES, e vale registrar por quê. Primeiro era o experimento das 100 rodadas (mesmo ' +
    'currículo, notas de 66 a 99). O dono cortou: difícil de entender e dependia de a pessoa rodar a ferramenta, o ' +
    'que esbarra numa dúvida que o repositório não responde, se funciona com currículo em português (os prompts são ' +
    'todos em inglês). O ângulo atual entrega as REGRAS em vez da nota, e aí o idioma deixa de importar: ninguém ' +
    'precisa rodar nada.\n\n' +
    'A FONTE É O PROMPT DELES. O que sustenta o post inteiro é o system_message.jinja, o texto que instrui o modelo ' +
    'a pontuar. Ele está no repositório e diz literalmente o que zera e o que desconta. Isso é raro: em vez de ' +
    'adivinhar o que o filtro procura, dá pra ler.\n\n' +
    'OS PESOS ENTRAM, ao contrário da versão anterior deste post. Eles são primários (role.json) e viraram o miolo: ' +
    'a pessoa precisa ver que open source vale 35 e habilidade técnica vale 10, que é o contrário do que ela supõe ' +
    'ao caprichar na lista de tecnologias.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): a consequência que dói, o currículo indo pro limbo, com a fonte entre parênteses.\n' +
    'Regra 2 (o slide 2 confirma): eles abriram o manual do robô, então dá pra ler.\n' +
    'Regra 3 (slide sozinho): uma regra por slide, cada uma citada do prompt.\n' +
    'Regra 4 (salvável): o slide do "o que trocar hoje", que é a única coisa acionável na semana.\n' +
    'Regra 5 (CTA único): comenta LIMBO.\n\n' +
    'RITMO: eram três slides seguidos dizendo que a pessoa está errada (CRUD, link, GitHub) e o dono cortou o do ' +
    'GitHub em 12/08/2026, deixando dois. Depois vem o alívio (o que ele é proibido de olhar). Sem esse respiro o ' +
    'post vira sermão e a pessoa sai antes do salvável.\n\n' +
    'RESSALVA REGISTRADA (resposta pronta pra comentário): a capa fala do currículo indo pro limbo "das empresas de ' +
    'tecnologia", e o que a HackerRank abriu não filtra vaga nenhuma. O README diz verbatim "Not an ATS" e "Not ' +
    'used to screen HackerRank\'s open roles". A capa fala de triagem por IA em geral, e quem carrega a correção é ' +
    'o slide de aviso honesto. Por isso também a capa NÃO usa a palavra ATS.\n\n' +
    'PRESENTE: pronto (Notion, em linkPresente). O carrossel dá a régua resumida; a página dá os descontos exatos ' +
    '(3 a 5 pontos por projeto sem link, 2 a 3 se só GitHub, 1 a 2 se o link está quebrado), a tabela de pesos com ' +
    'bônus e teto, o antes e depois do MESMO projeto reescrito, e o passo a passo pra rodar com as três ressalvas: ' +
    'a nota varia de 66 a 99 no mesmo arquivo, o idioma não é documentado e o modelo padrão do repo já mudou desde ' +
    'o experimento. Sem captação pra Semana.',
};
