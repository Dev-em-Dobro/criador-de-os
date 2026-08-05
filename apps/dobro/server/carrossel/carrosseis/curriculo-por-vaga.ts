/**
 * apps/dobro — carrossel "IA que ajusta seu currículo pra cada vaga".
 *
 * Origem: card do cronograma (conteudo_posts c8fb4f94), que estava como REELS com
 * o gancho "Você manda o mesmo currículo pra toda vaga e trava na triagem. A IA lê
 * a descrição da vaga e reescreve o seu de graça." Decisão do dono (05/08/2026):
 * produzir como CARROSSEL. O título do card foi mantido igual pro render substituir
 * o card antigo no board em vez de duplicar.
 *
 * Recorte (importante, tem vizinho parecido): o carrossel "vaga-com-claude" é o
 * fluxo macro (4 prompts: perfil, garimpo, currículo, networking) e trata o
 * currículo em UM slide. Aqui é o zoom nesse passo: o passo a passo completo de
 * adaptar o currículo por vaga, o prompt salvável, o erro que queima o candidato e
 * o teste antes de enviar. O card "Passe no robô do RH de graça com IA" era o
 * MESMO tema e foi REMOVIDO do board (decisão do dono, 05/08/2026): fica só este.
 *
 * Precisão (Article IV): ATS (Applicant Tracking System) é o sistema de triagem que
 * muitas empresas usam pra filtrar currículo por palavra-chave antes de um humano
 * ler. NÃO foi usada nenhuma estatística do tipo "X% dos currículos são
 * descartados", porque esses números circulam sem fonte confiável. Também não se
 * afirma que "nenhum humano lê", porque em empresa pequena lê. O "de graça" do
 * gancho se sustenta no plano gratuito do ChatGPT e do Claude, que existem. SEM
 * travessão. Capa sem arte por ora (mesmo estado do vaga-com-claude).
 */
import type { Carrossel } from '../types';

export const curriculoPorVaga: Carrossel = {
  slug: 'curriculo-por-vaga',
  titulo: 'IA que ajusta seu currículo pra cada vaga',
  gancho: 'A IA reescreve o seu currículo pra cada vaga, de graça',
  dataProgramada: '2026-08-06T00:00:00.000Z',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      titulo: 'A IA reescreve\nseu **currículo**\npra cada vaga',
      corpo: 'De graça, em 10 minutos. Passa pro lado 👉',
    },
    {
      variant: 'light',
      eyebrow: 'O passo a passo',
      titulo: 'São **4 passos**,\nuns 10 minutos',
      steps: [
        { n: '01', titulo: 'A vaga vira matéria-prima', sub: 'Você copia a descrição inteira da vaga' },
        { n: '02', titulo: 'Seu currículo entra como está', sub: 'O mesmo PDF que você manda hoje' },
        { n: '03', titulo: 'A IA cruza os dois', sub: 'Ela acha o que a vaga pede e você não citou' },
        { n: '04', titulo: 'Você confere e envia', sub: 'Aprova só o que é verdade e manda' },
      ],
      corpo: 'Dá pra fazer no ChatGPT ou no Claude, de graça.',
    },
    {
      variant: 'dark',
      layout: 'center',
      icone: 'follow',
      eyebrow: 'Antes de continuar',
      titulo: 'Segue o\n**@devemdobro**',
      corpo:
        'Toda semana eu mostro como usar IA e automação pra achar, disputar e ganhar vaga de tecnologia. Segue pra não perder as próximas.',
    },
    {
      variant: 'purple',
      eyebrow: 'Passo 01',
      titulo: 'A descrição da vaga\né a sua cola',
      itens: [
        { icone: 'eye', titulo: 'Copia tudo, não só o título', sub: 'Requisitos, responsabilidades e o que se repete' },
        { icone: 'code', titulo: 'Repara nos termos técnicos', sub: 'As tecnologias escritas do jeito que ELES escreveram' },
        { icone: 'ai', titulo: 'Pede a lista pra IA', sub: 'Quais termos são obrigatórios e quais são desejáveis' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Salva esse slide',
      titulo: 'O prompt que faz\no **encaixe**',
      terminal: [
        'Aja como o sistema de triagem (ATS).',
        'Compare meu currículo com esta vaga.',
        'Reescreva minhas experiências usando',
        'as palavras dela, sem inventar nada.',
      ],
      corpo:
        'Antes de um humano ler, muita empresa usa um filtro que procura palavra-chave. Esse prompt faz você falar a língua da vaga contando o que você fez de verdade.',
    },
    {
      variant: 'dark',
      topIcon: 'ban',
      eyebrow: 'Não faça isso',
      titulo: 'Encher de palavra-chave\n**queima** você',
      corpo:
        'Colar a vaga inteira no currículo ou dizer que domina o que nunca usou até passa no filtro, e morre na primeira entrevista. Traduzir o que você fez é diferente de inventar o que você não fez.',
      calloutLabel: 'A régua:',
      callout: '"Se perguntarem sobre essa linha na entrevista, eu consigo contar a história de verdade?"',
    },
    {
      variant: 'light',
      eyebrow: 'O teste antes de enviar',
      titulo: 'Peça a **nota** do\nseu novo currículo',
      steps: [
        { n: '01', titulo: 'Cola a vaga e a versão nova', sub: 'As duas coisas juntas, na mesma conversa' },
        { n: '02', titulo: 'Pede nota de 1 a 10', sub: 'O quanto esse currículo responde a essa vaga específica' },
        { n: '03', titulo: 'Pergunta o que ficou faltando', sub: 'A IA aponta o buraco e você decide o que dá pra preencher sem mentir' },
      ],
      corpo: 'Se a nota subiu e cada linha continua verdadeira, pode enviar.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Um currículo por vaga.\nÉ isso que muda\no jogo.',
      botao: 'Comente CV 👇',
      corpo:
        'Comenta CV que eu te mando o prompt completo e faço sua inscrição gratuita na Semana do Zero ao Programador Contratado.',
    },
  ],
  legenda:
    'Você manda o mesmo currículo pra 40 vagas e não recebe resposta de quase nenhuma. Não é falta de esforço: ' +
    'antes de um humano ler, muita empresa usa um sistema de triagem que procura as palavras da vaga no seu ' +
    'currículo. Se elas não estão lá, você some antes de qualquer conversa.\n\n' +
    'O ajuste é simples e leva uns 10 minutos por vaga, no plano gratuito do ChatGPT ou do Claude:\n\n' +
    '1. Copia a descrição INTEIRA da vaga, não só o título. Requisitos, responsabilidades e os termos técnicos ' +
    'escritos do jeito que a empresa escreveu.\n\n' +
    '2. Sobe o seu currículo do jeito que ele está hoje, sem arrumar antes.\n\n' +
    '3. Manda a IA agir como o sistema de triagem, comparar os dois e reescrever as suas experiências usando as ' +
    'palavras da vaga, sem inventar nada.\n\n' +
    '4. Antes de enviar, cola a vaga e a versão nova na mesma conversa e pede uma nota de 1 a 10 de encaixe, mais ' +
    'o que ficou faltando.\n\n' +
    'O aviso que ninguém dá: encher o currículo de palavra-chave que você não sabe usar até passa no filtro e ' +
    'morre na entrevista. A régua é simples: se perguntarem sobre aquela linha, você consegue contar a história ' +
    'de verdade? Se sim, pode ficar.\n\n' +
    'E se você quer isso destrinchado, se cadastra de graça na Semana do Zero ao Programador Contratado. Lá a ' +
    'gente ensina de forma bem mais profunda como se preparar pras vagas e ser o candidato número 1 das melhores ' +
    'empresas.\n\n' +
    'Comenta CV aqui embaixo que eu te mando o prompt completo e faço a sua inscrição no evento. 👇',
  hashtags:
    'curriculo vagatech ats recrutamento inteligenciaartificial carreiratech devweb primeiroemprego linkedin devemdobro',
  ctaFinal:
    'Comenta CV que eu te mando o prompt completo e faço sua inscrição gratuita na Semana do Zero ao Programador Contratado.',
  briefing:
    'ORIGEM: card do cronograma "IA que ajusta seu currículo pra cada vaga" (estava como reels). ' +
    'Decisão do dono (05/08/2026): produzir como carrossel. O título foi mantido igual pro render substituir o ' +
    'card antigo em vez de duplicar.\n\n' +
    'RECORTE\n' +
    'O carrossel "vaga-com-claude" é o fluxo macro (4 prompts) e resolve o currículo em um slide. Este aqui é o ' +
    'zoom nesse passo: o passo a passo completo, o prompt salvável, o erro que queima e o teste antes de enviar.\n' +
    'O card "Passe no robô do RH de graça com IA" era o MESMO tema e foi removido do board (decisão do dono, ' +
    '05/08/2026): fica só este, publicado na quinta 06/08.\n\n' +
    'PRECISÃO\n' +
    'ATS é o sistema de triagem que filtra currículo por palavra-chave antes de um humano ler. Nenhuma ' +
    'estatística foi usada (os números que circulam não têm fonte confiável) e não se diz que "nenhum humano lê", ' +
    'porque em empresa pequena lê. O "de graça" se sustenta no plano gratuito do ChatGPT e do Claude.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 capa: uma ideia só, o benefício por extenso. PENDENTE: arte de capa (hoje sai no gradiente).\n' +
    'Regra 2: o slide 2 confirma o gancho com o índice dos 4 passos, não abre pelo problema.\n' +
    'Regra 4 slide salvável: o slide 5 (prompt do ATS) está marcado com "Salva esse slide".\n' +
    'Regra 5: CTA único, comenta CV.',
};
