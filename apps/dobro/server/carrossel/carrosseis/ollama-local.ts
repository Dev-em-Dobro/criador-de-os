/**
 * apps/dobro — carrossel do Ollama (rodar IA local, de graça, no próprio PC).
 *
 * Encaixe no veredito de conteúdo: é a fórmula campeã (ferramenta grátis de IA,
 * open source, que roda no SEU PC, com CTA de automação). Mesma categoria do
 * post do JARVIS, que é o campeão real da conta.
 *
 * Precisão (Article IV, nada inventado, tudo conferido em ollama.com e no
 * github.com/ollama/ollama em 05/08/2026): Ollama é gratuito e open source
 * (licença MIT); roda em Windows, macOS, Linux e Docker; é local-first, o modelo
 * roda na sua máquina e funciona sem internet depois de baixado; expõe uma API
 * REST local em http://localhost:11434 (é por aí que o n8n conversa com ele);
 * o comando de rodar um modelo é `ollama run <modelo>`; a biblioteca tem famílias
 * como Llama, Mistral, Qwen, DeepSeek e Gemma, em vários tamanhos. Existe um
 * plano de nuvem pago pra modelos grandes, mas o uso local é gratuito, e o
 * carrossel fala só do local. NÃO afirmamos requisito de RAM nem número de
 * versão de modelo, porque não foram verificados. SEM travessão.
 */
import type { Carrossel } from '../types';

export const ollamaLocal: Carrossel = {
  slug: 'ollama-local',
  titulo: 'Rode uma IA no seu PC de graça e sem internet',
  gancho: 'Dá pra rodar uma IA no seu PC, de graça e sem internet. Para de pagar assinatura pra tudo.',
  refsLinks: 'https://ollama.com/ · https://github.com/ollama/ollama',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      titulo: 'Dá pra rodar\numa IA no\nseu PC, **de graça**\ne sem internet.\nPara de pagar\nassinatura pra tudo.',
      corpo: 'Passa pro lado que eu te mostro como 👉',
    },
    {
      variant: 'dark',
      eyebrow: 'O que é isso',
      titulo: 'Chama **Ollama**,\ne é código aberto',
      steps: [
        { n: '01', titulo: 'Roda na sua máquina', sub: 'O modelo baixa uma vez e responde ali, sem mandar nada pra fora' },
        { n: '02', titulo: 'Grátis e open source', sub: 'Licença MIT, sem plano, sem cartão, sem limite de mensagem' },
        { n: '03', titulo: 'Windows, Mac e Linux', sub: 'Instala como qualquer programa e já era' },
        { n: '04', titulo: 'Funciona offline', sub: 'Depois de baixar o modelo, você usa sem internet' },
      ],
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'follow',
      eyebrow: 'Antes de continuar',
      titulo: 'Segue o\n**@devemdobro**',
      corpo:
        'Toda semana eu mostro ferramenta de IA e automação que roda no seu PC, de graça. Segue pra não perder as próximas.',
    },
    {
      variant: 'dark',
      eyebrow: 'Salva esse slide',
      titulo: 'Do zero ao primeiro\n**modelo rodando**',
      terminal: [
        '$ ollama run llama3',
        '→ baixa o modelo e abre o chat no terminal',
        '$ ollama list',
        '→ mostra os modelos que você já tem',
        '$ ollama pull mistral',
        '→ baixa outro modelo pra testar',
      ],
      corpo: 'Baixa o instalador em ollama.com, abre o terminal e roda o primeiro comando. É isso.',
    },
    {
      variant: 'purple',
      eyebrow: 'Qual modelo usar',
      titulo: 'Tem modelo pra\ncada tamanho de PC',
      itens: [
        { icone: 'ai', titulo: 'Llama, Mistral, Qwen', sub: 'As famílias mais usadas, cada uma em vários tamanhos' },
        { icone: 'code', titulo: 'DeepSeek e Gemma', sub: 'Boas pra código e pra tarefa do dia a dia' },
        { icone: 'laptop', titulo: 'Começa pelo menor', sub: 'Se travar a máquina, troca por uma versão mais leve do mesmo modelo' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'O pulo do gato',
      titulo: 'Ele vira um **endpoint**\nna sua máquina',
      terminal: ['http://localhost:11434'],
      corpo:
        'O Ollama sobe uma API local nesse endereço. É por aí que o seu código, ou um fluxo do n8n, fala com a IA sem custo por chamada.',
    },
    {
      variant: 'dark',
      eyebrow: 'Pra que serve na prática',
      titulo: 'O uso que **paga**\no trabalho de instalar',
      itens: [
        { icone: 'loop', titulo: 'Automação rodando sozinha', sub: 'Fluxo no n8n que classifica, resume ou responde sem custo por chamada' },
        { icone: 'code', titulo: 'Testar sem queimar crédito', sub: 'Você erra o prompt 40 vezes e não paga nada por isso' },
        { icone: 'eye', titulo: 'Dado que não pode vazar', sub: 'Contrato, base de cliente e código que não podem sair da sua máquina' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Um aviso honesto',
      titulo: 'Modelo local não é\no **modelo de ponta**',
      corpo:
        'Pra raciocínio pesado, os modelos grandes de nuvem ainda ganham. O ganho aqui é outro: custo zero por chamada, privacidade e liberdade pra testar à vontade. Use os dois, cada um no que é bom.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o passo a passo\ncompleto?',
      botao: 'Comente LOCAL 👇',
      corpo:
        'Comenta LOCAL que eu te mando o guia de instalação e o fluxo do n8n usando a IA que roda no seu PC.',
    },
  ],
  legenda:
    'Você não precisa de assinatura pra ter IA. Dá pra rodar um modelo direto no seu PC, de graça, com o Ollama.\n\n' +
    'Ele é open source (licença MIT), instala em Windows, Mac ou Linux como qualquer programa, e depois que o modelo ' +
    'baixa você usa até sem internet. Nada do que você escreve sai da sua máquina.\n\n' +
    'Como começar: baixa em ollama.com, abre o terminal e roda "ollama run llama3". Ele baixa o modelo e já abre o ' +
    'chat ali. Se travar a máquina, troca por uma versão menor do mesmo modelo.\n\n' +
    'O pulo do gato pra quem programa: o Ollama sobe uma API local em http://localhost:11434. É por aí que o seu ' +
    'código, ou um fluxo do n8n, conversa com a IA sem pagar por chamada e sem mandar dado pra fora. Automação que ' +
    'classifica, resume e responde, rodando sozinha e sem custo por execução.\n\n' +
    'Um aviso honesto: pra raciocínio pesado os modelos grandes de nuvem ainda ganham. O ganho aqui é custo zero, ' +
    'privacidade e liberdade pra testar à vontade.\n\n' +
    'Comenta LOCAL aqui embaixo que eu te mando o guia de instalação e o fluxo do n8n usando a IA que roda no seu PC. 👇',
  hashtags:
    'ollama iagratis inteligenciaartificial n8n automacao opensource programacao devemdobro devweb iaLocal',
  ctaFinal: 'Comenta LOCAL que eu te mando o guia de instalação e o fluxo do n8n usando a IA que roda no seu PC.',
  briefing:
    'FÓRMULA: ferramenta grátis de IA, open source, que roda no SEU PC, com CTA de automação. É a categoria campeã da ' +
    'conta (mesma do post do JARVIS: 767 seguidores e 3905 comentários).\n\n' +
    'FATOS CONFERIDOS em 05/08/2026 (ollama.com e github.com/ollama/ollama)\n' +
    'Gratuito e open source, licença MIT. Roda em Windows, macOS, Linux e Docker. Local-first: o modelo roda na sua ' +
    'máquina e funciona sem internet depois de baixado. API REST local em http://localhost:11434 (o gancho com n8n). ' +
    'Comando de rodar: ollama run <modelo>. Famílias na biblioteca: Llama, Mistral, Qwen, DeepSeek, Gemma.\n' +
    'NÃO afirmamos requisito de RAM nem número de versão de modelo, porque não foram verificados. Existe um plano de ' +
    'nuvem pago pra modelos grandes, mas o carrossel fala só do uso local, que é gratuito.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 2: o slide 2 confirma o gancho (o que é, grátis, roda em tudo, offline) em vez de abrir pelo problema.\n' +
    'Regra 4: slide 4 marcado "Salva esse slide" com os 3 comandos.\n' +
    'Regra 5: CTA único, comenta LOCAL.\n' +
    'PENDENTE: arte de capa. Pela análise das capas campeãs, o ideal aqui é um print do terminal com o ollama rodando.',
};
