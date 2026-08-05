/**
 * apps/dobro — carrossel do n8n auto-hospedado (automação rodando na sua própria
 * máquina, edição Community gratuita).
 *
 * Encaixe no veredito: ferramenta grátis que roda no SEU PC, e é exatamente o
 * perfil que o dono definiu pro público (dev web com IA e automações com n8n).
 * Casa com o carrossel do Ollama: os dois juntos são automação com IA sem custo
 * por execução.
 *
 * Precisão (Article IV, conferido em docs.n8n.io em 05/08/2026): o n8n tem duas
 * formas de uso, Cloud gerenciado e Self-hosted na sua própria infraestrutura;
 * a edição Community é gratuita e traz quase o conjunto completo de recursos;
 * criar uma conta gratuita libera recursos extras como pastas e depuração no
 * editor; existem planos pagos (Business e Enterprise) com SSO, ambientes e
 * projetos. NÃO afirmamos comando exato de instalação, licença específica nem
 * limite de execuções, que não foram verificados nesta sessão. SEM travessão.
 */
import type { Carrossel } from '../types';

export const n8nSelfHost: Carrossel = {
  slug: 'n8n-self-host',
  titulo: 'A ferramenta de automação que roda de graça na sua máquina',
  gancho: 'Você paga por automação que cobra por execução. Dá pra rodar na sua própria máquina, de graça.',
  refsLinks: 'https://docs.n8n.io/choose-how-to-use-n8n/',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      titulo: 'Você paga por\nautomação que\ncobra por execução.\nDá pra rodar na\nsua máquina,\n**de graça**.',
      corpo: 'Passa pro lado que eu te mostro 👉',
    },
    {
      variant: 'dark',
      eyebrow: 'O que é',
      titulo: 'Chama **n8n**, e você\npode hospedar sozinho',
      steps: [
        { n: '01', titulo: 'Você monta o fluxo arrastando', sub: 'Cada caixa é um passo: recebe, decide, transforma, envia' },
        { n: '02', titulo: 'A edição Community é grátis', sub: 'Ela traz quase tudo, sem cobrança por execução' },
        { n: '03', titulo: 'Roda na sua infraestrutura', sub: 'Na sua máquina ou no seu servidor, do seu jeito' },
        { n: '04', titulo: 'Também tem versão em nuvem', sub: 'Se você não quiser cuidar do servidor, existe a opção gerenciada' },
      ],
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'follow',
      eyebrow: 'Antes de continuar',
      titulo: 'Segue o\n**@devemdobro**',
      corpo: 'Toda semana eu mostro IA e automação que rodam no seu PC, de graça. Segue pra não perder as próximas.',
    },
    {
      variant: 'dark',
      denso: true,
      eyebrow: 'Salva esse slide',
      titulo: 'A anatomia de\n**qualquer** automação',
      terminal: [
        '1. GATILHO  → o que dispara (form, horário, msg)',
        '2. DADO     → de onde vem (planilha, banco, API)',
        '3. DECISÃO  → o que fazer (filtrar, classificar)',
        '4. AÇÃO     → onde termina (e-mail, CRM, zap)',
      ],
      corpo: 'Toda automação que você já viu é alguma combinação desses quatro. Depois que você enxerga isso, monta qualquer uma.',
    },
    {
      variant: 'purple',
      eyebrow: 'Por que auto-hospedar',
      titulo: 'A conta muda quando\no volume cresce',
      itens: [
        { icone: 'loop', titulo: 'Sem custo por execução', sub: 'O fluxo roda mil vezes e a fatura não muda por causa disso' },
        { icone: 'eye', titulo: 'O dado não sai da sua casa', sub: 'Base de cliente e contrato ficam onde você controla' },
        { icone: 'code', titulo: 'Você pluga o que quiser', sub: 'Inclusive um modelo de IA rodando na mesma máquina' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'O combo que ninguém faz',
      titulo: 'n8n mais uma IA\n**local**',
      corpo:
        'Se você já roda um modelo local, o fluxo do n8n fala com ele pelo endereço da máquina. Resultado: automação com IA que classifica, resume e responde sem pagar por chamada e sem mandar dado pra fora.',
    },
    {
      variant: 'dark',
      eyebrow: 'Pra que serve na prática',
      titulo: 'Automação que se paga\nna **primeira semana**',
      itens: [
        { icone: 'instagram', titulo: 'Lead que chega e some', sub: 'Recebe o formulário, classifica com IA e manda pro CRM na hora' },
        { icone: 'film', titulo: 'Conteúdo em série', sub: 'Áudio vira transcrição, transcrição vira resumo, tudo sozinho' },
        { icone: 'follow', titulo: 'Relatório que ninguém monta', sub: 'Toda segunda ele junta os números e te manda pronto' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Um aviso honesto',
      titulo: 'Auto-hospedar é\nde graça, não é\n**sem trabalho**',
      corpo:
        'Você passa a cuidar de atualização, backup e do servidor de pé. Se o seu volume é pequeno e seu tempo é curto, a versão gerenciada pode sair mais barata na conta real.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o passo a passo\ne um fluxo pronto?',
      botao: 'Comente N8N 👇',
      corpo: 'Comenta N8N que eu te mando o guia pra subir na sua máquina e um fluxo pronto pra importar.',
    },
  ],
  legenda:
    'Automação boa é a que roda sozinha e não te cobra por isso. O n8n resolve os dois lados.\n\n' +
    'Você monta o fluxo arrastando caixas, e cada caixa é um passo: o que dispara, de onde vem o dado, o que fazer ' +
    'com ele e onde termina. Depois que você enxerga essa anatomia, monta qualquer automação.\n\n' +
    'O ponto que muda tudo: além da versão em nuvem, dá pra auto-hospedar na sua própria infraestrutura, e a edição ' +
    'Community é gratuita, com quase o conjunto completo de recursos. Sem cobrança por execução.\n\n' +
    'E tem o combo que quase ninguém faz: se você já roda um modelo de IA local, o fluxo do n8n conversa com ele pelo ' +
    'endereço da sua própria máquina. Automação com IA que classifica, resume e responde sem pagar por chamada e sem ' +
    'mandar dado pra fora.\n\n' +
    'Um aviso honesto: auto-hospedar é de graça, mas não é sem trabalho. Você passa a cuidar de atualização, backup e ' +
    'do servidor de pé. Se o volume é pequeno, a versão gerenciada pode sair melhor.\n\n' +
    'Comenta N8N aqui embaixo que eu te mando o guia pra subir na sua máquina e um fluxo pronto pra importar. 👇',
  hashtags: 'n8n automacao lowcode inteligenciaartificial opensource devweb programacao devemdobro produtividade selfhosted',
  ctaFinal: 'Comenta N8N que eu te mando o guia pra subir na sua máquina e um fluxo pronto pra importar.',
  briefing:
    'FÓRMULA: ferramenta grátis que roda no SEU PC. É o perfil que o dono definiu pro público (dev web com IA e ' +
    'automações com n8n) e casa com o carrossel do Ollama.\n\n' +
    'FATOS CONFERIDOS em 05/08/2026 (docs.n8n.io)\n' +
    'Duas formas de uso: Cloud gerenciado e Self-hosted na própria infraestrutura. A edição Community é gratuita e ' +
    'traz quase o conjunto completo de recursos. Conta gratuita libera extras como pastas e depuração no editor. ' +
    'Existem planos pagos (Business e Enterprise) com SSO, ambientes e projetos.\n' +
    'NÃO afirmamos comando de instalação, licença específica nem limite de execuções, que não foram verificados.\n\n' +
    'PENDENTE: arte de capa. O ideal é um print de um fluxo montado no editor do n8n.',
};
