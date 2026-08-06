/**
 * apps/dobro — carrossel "O Claude automatizou a busca de emprego inteira".
 *
 * Origem: referência mandada no Telegram em 05/08/2026 (reel do @abhijayarora_,
 * 17.807 comentários / 6.575 curtidas, ratio de 2,7 comentário por curtida).
 * Decisão do dono: COPIAR gancho, narrativa e CTA da referência, adaptados pro
 * público BR. A narrativa foi extraída do próprio vídeo (frames + texto na tela),
 * não só da legenda.
 *
 * Estrutura da referência (mantida): gancho "Claude just automated the entire job
 * hunt" -> índice "The ultimate Claude Workflow" com 4 passos revelados um a um ->
 * executa 01 perfil do LinkedIn, 02 garimpo de vagas via Apify, 03 currículo pro
 * ATS, 04 networking via Claude Code -> CTA comentar uma palavra pra receber na DM.
 *
 * Precisão (Article IV): os caminhos do LinkedIn são reais e aparecem no vídeo
 * (Resources > Save to PDF; Settings > Data privacy > Download my data > Request
 * archive, que fica pronto em cerca de 24h). ATS (Applicant Tracking System) é o
 * sistema que filtra currículo por palavra-chave antes de humano ler. Apify tem
 * conector MCP. Claude Code salva skills reutilizáveis. Os prompts foram
 * reescritos em português (equivalentes funcionais), não traduzidos ao pé da
 * letra. Nenhum número de resultado foi copiado, porque seria resultado dele e
 * não nosso. SEM travessão. Capa sem arte por ora (decisão do dono, 05/08).
 */
import type { Carrossel } from '../types';

export const vagaComClaude: Carrossel = {
  slug: 'vaga-com-claude',
  titulo: 'O Claude automatizou a busca de emprego de programação',
  gancho: 'O Claude automatizou a busca de emprego de programação',
  refsLinks: 'https://www.instagram.com/reel/DZJI5ooNGMX/',
  bgImage: 'server/carrossel/assets/vaga-com-claude-bg.png',
  slides: [
    {
      variant: 'photo',
      cover: true,
      titulo: 'O Claude\n**automatizou** a\nbusca de emprego\nde programação.',
      corpo: 'Pare de gastar horas com isso. Passa pro lado 👉',
    },
    {
      variant: 'dark',
      eyebrow: 'O fluxo completo',
      titulo: 'São **4 prompts**,\nnessa ordem',
      steps: [
        { n: '01', titulo: 'Perfil do LinkedIn', sub: 'O Claude audita o seu e diz o que está espantando recrutador' },
        { n: '02', titulo: 'Garimpo de vagas', sub: 'Ele busca vaga de dev web e ranqueia por encaixe com você' },
        { n: '03', titulo: 'Currículo que passa no robô', sub: 'Reescreve pro filtro automático não te descartar' },
        { n: '04', titulo: 'Networking', sub: 'Descobre quem você já conhece dentro da empresa alvo' },
      ],
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'follow',
      eyebrow: 'Antes de continuar',
      titulo: 'Segue o\n**@devemdobro**',
      corpo:
        'Toda semana eu mostro como usar IA e automação pra achar, disputar e ganhar vaga de tecnologia. Segue pra não perder as próximas.',
    },
    {
      variant: 'dark',
      denso: true,
      eyebrow: 'Prompt 01',
      titulo: 'Seu perfil vira PDF\ne o Claude **audita**',
      corpo: 'No LinkedIn: abre seu perfil, Resources, Save to PDF. Sobe o arquivo no Claude com esse prompt.',
      calloutLabel: 'Prompt completo:',
      callout:
        '"Você é recrutador técnico de vagas de desenvolvimento web. Anexei meu perfil do LinkedIn em PDF. Meu foco é front e back, com IA e automação no n8n. Me responda em ordem de gravidade: (1) o que no meu título, no meu Sobre e nas minhas experiências faz um recrutador me descartar nos 3 primeiros segundos, (2) quais palavras-chave da minha área um recrutador busca e não estão no meu perfil, (3) reescreva meu título e meu Sobre já corrigidos, usando só o que eu realmente fiz."',
    },
    {
      variant: 'purple',
      denso: true,
      eyebrow: 'Prompt 02',
      titulo: 'Ele garimpa as vagas\ne dá nota de encaixe',
      calloutLabel: 'Prompt completo:',
      callout:
        '"Busque vagas de desenvolvedor web publicadas nos últimos 7 dias. Priorize as que pedem IA, integrações ou automação com n8n. Me devolva uma tabela com empresa, cargo, modelo de trabalho, faixa salarial, data da publicação e uma nota de 1 a 10 de encaixe com o meu currículo, explicando cada nota em uma linha. No fim, marque as 10 em que eu devo me candidatar hoje e diga por quê."',
      corpo: 'Você para de rolar feed e passa a decidir onde vale gastar sua energia.',
    },
    {
      variant: 'light',
      denso: true,
      eyebrow: 'Salva esse slide',
      titulo: 'O prompt que faz o\n**robô** te aprovar',
      terminal: [
        'Aqui está meu currículo e a descrição de uma',
        'vaga de dev web. Primeiro aja como o sistema',
        'automático que lê currículos (ATS) e extraia',
        'toda palavra-chave, tecnologia e requisito',
        'que ele vai procurar. Depois reescreva os',
        'tópicos do meu currículo usando essa mesma',
        'linguagem, mantendo só o que eu fiz de',
        'verdade. Por último me dê a nota de',
        'compatibilidade antes e depois, e aponte o',
        'que ficou forçado pra um leitor humano.',
      ],
      corpo: 'Antes de um humano ler, um filtro automático descarta currículo por palavra-chave.',
    },
    {
      variant: 'dark',
      denso: true,
      eyebrow: 'Prompt 04',
      titulo: 'Você já conhece\nalguém **lá dentro**',
      corpo:
        'No LinkedIn: Settings, Data privacy, Download my data, Request archive. Em cerca de 24 horas chega a lista das suas conexões. Joga no Claude Code.',
      calloutLabel: 'Prompt completo:',
      callout:
        '"Use o arquivo de conexões que exportei do LinkedIn. Crie uma skill reutilizável que receba o nome de uma empresa e devolva: (1) quem eu já conheço lá dentro, (2) quem das minhas conexões pode me apresentar a alguém de lá, (3) uma mensagem curta e personalizada pra cada um, baseada no que eu tenho em comum com a pessoa. Salve pra eu rodar de novo com qualquer outra empresa."',
    },
    {
      variant: 'light',
      eyebrow: 'Por que isso funciona',
      titulo: 'Não é mandar mais\ncurrículo, é mandar\n**melhor**',
      corpo:
        'A maioria aplica em 80 vagas de dev com o mesmo currículo e some no filtro. Aqui você entra falando a língua de cada vaga, com alguém de dentro pra te apresentar.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Os 4 prompts +\nsua vaga na Semana.',
      botao: 'Comente GUIA 👇',
      corpo:
        'Na Semana do Zero ao Programador Contratado a gente aprofunda o pilar do marketing pessoal, pra você ser um dev acima da média no processo seletivo. Comenta GUIA que eu te inscrevo de graça e mando os 4 prompts.',
    },
  ],
  legenda:
    'A maioria dos devs aplica em 80 vagas com o mesmo currículo e não recebe resposta de nenhuma. Não é falta de ' +
    'esforço, é que a busca de emprego virou um jogo de filtro automático e ninguém te contou as regras.\n\n' +
    'Esse fluxo com o Claude resolve os 4 pontos onde a gente trava, e aqui ele está apontado pra vaga de dev web de ' +
    'quem trabalha com IA e automação no n8n:\n\n' +
    '1. O perfil do LinkedIn. Salva ele em PDF (Resources, Save to PDF), sobe no Claude e pede pra ele apontar o que ' +
    'no seu título e no seu Sobre faz um recrutador te ignorar em 3 segundos.\n\n' +
    '2. As vagas. Em vez de rolar o feed, ele busca o que foi publicado nos últimos dias, filtra pela sua stack (quem ' +
    'pede IA e n8n de verdade, não vaga genérica) e devolve uma tabela com nota de encaixe de 1 a 10.\n\n' +
    '3. O currículo. Antes de um humano ler, um filtro automático descarta por palavra-chave. O Claude lê a vaga como ' +
    'esse filtro leria e reescreve seus tópicos falando a mesma língua, sem inventar experiência que você não teve.\n\n' +
    '4. O networking. Você baixa a exportação das suas conexões do LinkedIn e o Claude Code monta uma skill que recebe ' +
    'o nome de uma empresa e devolve quem você já conhece lá dentro e quem pode te apresentar.\n\n' +
    'E se você quer isso destrinchado de verdade, se cadastra de graça na Semana do Zero ao Programador Contratado. ' +
    'Lá a gente aprofunda o pilar do marketing pessoal, que é o que faz você ser um dev acima da média no processo ' +
    'seletivo, e ensina como se preparar pras vagas e ser o candidato número 1 das melhores empresas.\n\n' +
    'Comenta GUIA aqui embaixo que a gente faz a sua inscrição no evento e te manda os 4 prompts completos na DM. 👇',
  hashtags:
    'claudeai vagatech devweb n8n automacao carreiratech linkedin curriculo inteligenciaartificial devemdobro',
  ctaFinal:
    'Comenta GUIA que a gente faz sua inscrição gratuita na Semana do Zero ao Programador Contratado, onde a gente aprofunda o marketing pessoal pra você ser um dev acima da média no processo seletivo, e te manda os 4 prompts completos na DM.',
  /** Presente entregue no CTA: página do Notion com os 4 prompts (criada em 05/08/2026). */
  linkPresente: 'https://app.notion.com/p/3b26dd01fb48803cac01ce570f9d6b4d',
  briefing:
    'ORIGEM: referência do Telegram (05/08/2026), reel do @abhijayarora_ com 17.807 comentários e 6.575 curtidas.\n' +
    'Decisão do dono: copiar gancho, narrativa e CTA da referência, adaptando pro público BR.\n\n' +
    'ESTRUTURA COPIADA DA REFERÊNCIA\n' +
    'Gancho na tela: "Claude just automated the entire job hunt".\n' +
    'Slide 2 = índice "The ultimate Claude Workflow" com os 4 passos revelados um a um (é o que segura a retenção).\n' +
    'Depois executa passo a passo: 01 perfil do LinkedIn, 02 garimpo de vagas via Apify, 03 currículo pro ATS, ' +
    '04 networking via Claude Code. CTA: comentar uma palavra pra receber na DM (lá foi "Guide", aqui é GUIA).\n\n' +
    'O QUE FOI ADAPTADO E POR QUÊ\n' +
    'Os prompts foram apontados pro nicho (decisão do dono, 05/08): vaga de PROGRAMAÇÃO WEB pra dev com perfil de IA ' +
    'e automações com n8n. Isso aparece no prompt 01 (o recrutador avalia front e back com IA e n8n), no prompt 02 ' +
    '(filtra pela stack, não vaga genérica), no prompt 03 (palavras-chave da vaga de dev web) e na legenda.\n' +
    'Os prompts foram reescritos em português como equivalentes funcionais, não traduzidos ao pé da letra.\n' +
    'O número de resultado dele (compatibilidade de 32% para 78%) NÃO foi copiado, porque é resultado dele e não nosso.\n' +
    'A menção ao Apify saiu do slide porque exige conta e conector de terceiro; ficou o benefício (vaga recente + nota ' +
    'de encaixe), que é o que interessa pro público.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 capa: gancho por extenso, uma ideia. PENDENTE: arte de capa (hoje sai no gradiente).\n' +
    'Regra 2: o slide 2 confirma o gancho com o índice dos 4 passos, não abre pelo problema.\n' +
    'Regra 4 slide salvável: o slide 5 (prompt do ATS) está marcado com "Salva esse slide".\n' +
    'Regra 5: CTA único, comenta GUIA.',
};
