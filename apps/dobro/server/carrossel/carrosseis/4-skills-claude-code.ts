/**
 * apps/dobro — carrossel "4 skills do Claude Code que sobem o nível do projeto".
 *
 * Origem: referência do @hasantoxr (5 Claude Skills, card do cronograma de 06/08).
 * O dono escolheu manter DUAS da referência (UI/UX Pro Max e Task Observer) e
 * pediu mais duas: uma de segurança e uma de animação com GSAP. Cada skill ganhou
 * o próprio print do repositório, que é o padrão das capas que performaram:
 * mostrar o objeto, não descrever (ver memória capas-carrossel-padrao).
 *
 * Precisão (Article IV): tudo aqui foi lido nos prints tirados dos repositórios em
 * 05/08/2026 (fonte primária, ver assets/4-skills-claude-code/) e conferido na API
 * do GitHub no mesmo dia.
 *   UI/UX Pro Max (nextlevelbuilder/ui-ux-pro-max-skill): 113.775 estrelas e
 *     12.166 forks pela API; o print mostra "Star 114k" e "113.8k stars". Licença
 *     MIT. About: "An AI SKILL that provide design intelligence for building
 *     professional UI/UX multiple platforms". Repo criado em 30/11/2025, ou seja,
 *     juntou isso em 8 meses. Site do projeto: www.uupm.cc.
 *   Task Observer (rebelytics/one-skill-to-rule-them-all): 1.457 estrelas,
 *     licença CC BY 4.0. About, palavra por palavra: "The meta-skill that builds
 *     and improves all your skills, including itself. Watches your work sessions,
 *     captures corrections and judgement calls, and turns them into skill
 *     improvements automatically."
 *   GSAP (greensock/gsap-skills): 13.070 estrelas, licença MIT, About: "Official
 *     AI skills for GSAP. These skills teach AI coding agents how to correctly use
 *     GSAP (GreenSock Animation Platform), including best practices, common
 *     animation patterns, and plugin usage." Os commits são do jackdoyle, criador
 *     do GSAP. NÃO afirmamos ScrollTrigger/useGSAP: o About não os cita e não
 *     abrimos o conteúdo das skills.
 *   security-review: comando embutido no Claude Code, listado na documentação
 *     oficial de slash commands (conferido no HTML da página, 3 ocorrências).
 *
 * O número de estrelas do Task Observer (1,5 mil) fica de fora do slide: ao lado
 * de 114 mil e 13 mil ele só enfraquece o argumento, que ali é o que a ferramenta
 * faz. Número só quando ajuda. SEM travessão.
 *
 * GANCHO, decisão do dono (05/08/2026): o "99% dos outros programadores" é
 * ESCOLHA DELIBERADA, não descuido. Espelha o gancho da referência que ele
 * escolheu seguir ("5 CLAUDE SKILLS TO GET YOU AHEAD OF 99% OF PEOPLE"). É o
 * único número do carrossel sem fonte, e fica de fora da regra de precisão acima
 * por ser hipérbole de gancho, não afirmação sobre a ferramenta. Não "corrija"
 * isso numa próxima passada.
 */
import type { Carrossel } from '../types';

const SHOT = 'server/carrossel/assets/4-skills-claude-code';

export const quatroSkillsClaudeCode: Carrossel = {
  slug: '4-skills-claude-code',
  // Título igual ao do card no board: `carrossel:render` apaga e reinsere POR
  // TÍTULO, então quando o dono renomeia o card e o arquivo fica pra trás, o
  // render cria um card novo em vez de atualizar o dele (aconteceu em 06/08).
  titulo: '4 skills do Claude te deixam a frente de 99% dos outros programadores',
  gancho: '4 skills do Claude te deixam à frente de 99% dos outros programadores.',
  refsLinks:
    'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill · https://github.com/rebelytics/one-skill-to-rule-them-all · https://github.com/greensock/gsap-skills · https://code.claude.com/docs/en/slash-commands',
  dataProgramada: '2026-08-07',
  /** Arte da capa (imagem do dono, 05/08): o polvo de óculos escuros com o 4. */
  bgImage: `${SHOT}/capa.png`,
  slides: [
    {
      variant: 'photo',
      cover: true,
      /** Título 30% menor: o gancho é longo e no tamanho cheio ele engolia a arte. */
      tituloMenor: true,
      /** +15% sobre esse tamanho (06/08), com a capa do polvo na corda. */
      tituloEscala: 1.15,
      // A arte é quadrada: no `cover` ela sangra pelas laterais e o polvo fica no
      // meio, atrás do título. Ajustando pela largura e encostando no topo, ele
      // sobe e o texto cai sobre o fundo preto do slide.
      bgSize: '100% auto',
      bgPos: 'center top',
      titulo:
        '4 skills do **Claude**\nte deixam à frente\nde **99%** dos outros\nprogramadores.',
      corpo: 'Desliza pra ver 👉',
    },
    {
      variant: 'dark',
      eyebrow: 'Antes de tudo',
      titulo: 'Skill é só uma\n**pasta com instruções**',
      steps: [
        { n: '01', titulo: 'Você instala uma vez', sub: 'Não precisa repetir a mesma explicação em todo projeto novo' },
        { n: '02', titulo: 'O Claude passa a seguir', sub: 'Ele consulta aquilo sozinho quando a tarefa pede' },
        { n: '03', titulo: 'Vale pra qualquer stack', sub: 'Não amarra você a framework: serve pro projeto que já está aberto' },
      ],
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'follow',
      eyebrow: 'Antes de continuar',
      titulo: 'Segue o\n**@devemdobro**',
      corpo:
        'Toda semana eu mostro ferramenta grátis que faz seu projeto parecer profissional. Segue pra não perder.',
    },
    {
      variant: 'dark',
      eyebrow: 'Skill 01',
      titulo: '**UI/UX Pro Max**',
      corpo:
        'São 114 mil estrelas no GitHub em 8 meses. Ela dá ao Claude inteligência de design pra montar interface profissional, em vez de tela com cara de template. Pede Python 3 instalado, pro script de busca dela.',
      imagem: `${SHOT}/ui-ux-pro-max.png`,
    },
    {
      variant: 'light',
      eyebrow: 'Skill 02',
      titulo: '**Task Observer**',
      corpo:
        'A meta-skill: ela acompanha suas sessões, captura as correções que você faz e transforma isso em melhoria nas suas outras skills, incluindo ela mesma.',
      imagem: `${SHOT}/task-observer.png`,
    },
    {
      variant: 'dark',
      eyebrow: 'Skill 03',
      titulo: '**security-review**,\nessa já vem',
      corpo:
        'Essa você não instala: já vem no Claude Code. Digita /security-review e ele revisa as mudanças da sua branch atrás de falha de segurança antes de você subir o código.',
      imagem: `${SHOT}/security-review.png`,
    },
    {
      variant: 'purple',
      eyebrow: 'Skill 04',
      titulo: '**GSAP**, a oficial\nda GreenSock',
      corpo:
        'Feita por quem criou o GSAP, com 13 mil estrelas. Ensina o agente a usar a biblioteca do jeito certo: boas práticas, padrões de animação e uso de plugin.',
      imagem: `${SHOT}/gsap.png`,
    },
    {
      // O slide de comandos saiu (decisão do dono, 06/08): cada projeto documenta a
      // instalação de um jeito, e comando errado no slide salvável é o pior lugar
      // pra errar. O passo a passo de cada uma vive no presente do Notion, que é o
      // que o CTA entrega.
      variant: 'dark',
      eyebrow: 'Salva esse slide',
      titulo: 'Qual delas rodar\n**hoje**',
      itens: [
        { icone: 'eye', titulo: 'Tela com cara de template', sub: 'UI/UX Pro Max' },
        { icone: 'loop', titulo: 'Cansou de repetir a mesma correção', sub: 'Task Observer' },
        { icone: 'ban', titulo: 'Vai subir código que mexe com dado', sub: '/security-review' },
        { icone: 'code', titulo: 'Quer animação que não trava', sub: 'GSAP da GreenSock' },
      ],
      corpo: 'Escolhe UMA e roda hoje, no projeto que você já tem aberto. Instalar as quatro de uma vez não ajuda.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o passo a passo\nde cada uma?',
      botao: 'Comente SKILLS 👇',
      corpo:
        'Comenta SKILLS que eu te mando o passo a passo de instalação das 4, com o que cada uma resolve.',
    },
  ],
  legenda:
    'O Claude Code entrega projeto com cara de IA quando você usa ele no básico. Essas 4 skills mudam isso, e você não ' +
    'precisa saber design nem segurança pra usar.\n\n' +
    'UI/UX Pro Max dá inteligência de design pro Claude montar interface profissional. São 114 mil estrelas no GitHub ' +
    'em 8 meses, o que dá uma ideia de quanta gente estava precisando disso.\n\n' +
    'Task Observer é a meta-skill: acompanha suas sessões, captura as correções que você faz e vira melhoria nas suas ' +
    'outras skills, incluindo ela mesma.\n\n' +
    'security-review você nem instala, já vem no Claude Code. Digita /security-review e ele revisa as mudanças da sua ' +
    'branch atrás de falha de segurança antes de você subir o código.\n\n' +
    'GSAP é a skill oficial da GreenSock, feita por quem criou a biblioteca. Ensina o agente a animar do jeito certo.\n\n' +
    'Salva o post e escolhe UMA pra rodar hoje, no projeto que você já tem aberto. Instalar as quatro de uma vez ' +
    'não ajuda: você não percebe o que mudou.\n\n' +
    'Comenta SKILLS aqui embaixo que eu te mando o passo a passo de instalação das 4. 👇',
  hashtags:
    'claudecode claudeskills programacao devtools frontend gsap uiux inteligenciaartificial devemdobro carreiratech',
  ctaFinal: 'Comenta SKILLS que eu te mando o passo a passo de instalação das 4, com o que cada uma resolve.',
  /**
   * Presente do "comenta SKILLS": página do Notion criada em 05/08/2026, na raiz
   * do workspace pra publicar sozinha sem expor o resto. LINK PRIVADO: trocar pelo
   * `.notion.site` depois de Compartilhar > Publicar.
   */
  linkPresente: 'https://app.notion.com/p/3b36dd01fb4881be9817d704bac2bc3f',
  briefing:
    '⚠️ CORREÇÃO DE COMANDOS (06/08/2026, ANTES de publicar) — os READMEs foram conferidos um a um:\n' +
    '1. "claude install-skill <url>" NÃO EXISTE. Era invenção. O Task Observer se instala copiando a pasta da skill ' +
    'para .claude/skills/task-observer/ (ou zipando e subindo em Settings > Capabilities nos apps).\n' +
    '2. UI/UX Pro Max: o README lidera com "npm install -g ui-ux-pro-max-cli" + "uipro init --ai claude", e EXIGE ' +
    'Python 3 pro script de busca (biblioteca padrão, sem chamadas de rede). O requisito virou aviso no slide dela.\n' +
    '3. GSAP: "/plugin marketplace add" só REGISTRA o marketplace, não instala. O README recomenda ' +
    '"npx skills add https://github.com/greensock/gsap-skills", que é o que ficou no slide.\n' +
    'O passo "É texto, não é framework" saiu do slide 2: com o Python da primeira skill, a frase absoluta ficou ' +
    'imprecisa.\n\n' +
    'FÓRMULA: ferramenta concreta com nome próprio, grátis, com comando copiável e slide salvável. É a categoria que ' +
    'mais puxa salvamento na conta.\n\n' +
    'DIFERENÇA PRA REFERÊNCIA (@hasantoxr): ela lista 5 skills soltas. Aqui o recorte é "sobe o nível do projeto" e a ' +
    'progressão tem sentido: desenha melhor, aprende com você, protege o código, anima. E o post entrega os comandos, ' +
    'que a referência não dá.\n\n' +
    'O QUE CADA PRINT PROVA: os prints são dos repositórios, então a pessoa vê as estrelas e a licença sem precisar ' +
    'confiar na nossa palavra. É o que separa indicação de propaganda.\n\n' +
    'RESSALVA: o Task Observer tem 1,5 mil estrelas, bem menos que os outros dois. Não citamos o número no slide de ' +
    'propósito, porque ali o argumento é o que ela faz. Se alguém perguntar nos comentários, o número é esse mesmo.',
};
