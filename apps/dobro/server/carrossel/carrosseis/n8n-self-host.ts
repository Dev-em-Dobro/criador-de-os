/**
 * apps/dobro — carrossel do n8n auto-hospedado, com o eixo VIRADO PARA SERVIÇO
 * VENDÁVEL: qual automação montar, pra quem, e quanto cobrar.
 *
 * MUDANÇA DE EIXO (pedido do dono, 15/08/2026): a versão anterior era "ferramenta
 * grátis que roda na sua máquina" e não falava de dinheiro em lugar nenhum. O
 * dono pediu exemplos práticos de uso e de quanto a pessoa poderia cobrar, com o
 * agente de agendamento pra clínica como exemplo âncora ("pelo menos 800 reais").
 * O post inteiro foi remontado em torno disso.
 *
 * ⚠️ PREÇO É AFIRMAÇÃO VERIFICÁVEL, e por isso não saiu da cabeça de ninguém.
 * Faixas conferidas em DUAS fontes brasileiras independentes (15/08/2026):
 *   · horadecodar.com.br, guia "Quanto cobrar automação n8n": simples (integração
 *     básica entre dois sistemas) R$ 400 a R$ 900; intermediária (várias
 *     integrações, lógica condicional, tratamento de erro) R$ 900 a R$ 2.500;
 *     avançada (várias plataformas, APIs externas, notificação por WhatsApp)
 *     R$ 2.500 a R$ 10.000 ou mais.
 *   · automacaohoje.com, guia de 14/07/2026: as mesmas duas primeiras faixas, e
 *     "o dinheiro consistente está na operação mensal", com a mensalidade tendo
 *     que cobrir VPS (US$ 20 a 50 por cliente), consumo de API de IA, horas de
 *     suporte e margem.
 * O R$ 1.500 do título (o dono subiu de 800 pra 1.500 em 17/08/2026) cai no MEIO
 * da faixa intermediária das duas fontes, R$ 900 a R$ 2.500, que é onde o serviço
 * de fato mora: o agendamento da clínica tem várias integrações, decisão no meio
 * do fluxo e notificação por WhatsApp, e não a "integração básica entre dois
 * sistemas" da faixa simples. O 800 anterior era o piso da simples, escolhido por
 * conservadorismo; 1.500 é o preço honesto do que está sendo descrito, e continua
 * abaixo do teto da faixa. Os outros slides falam do serviço pela faixa MÉDIA.
 *
 * FATOS DA FERRAMENTA, NA FONTE PRIMÁRIA (15/08/2026):
 *   · n8n-io/n8n, 200.765 estrelas, TypeScript, push no mesmo dia
 *   · a licença NÃO é open source padrão: é modelo fair-code, sob Sustainable
 *     Use License e n8n Enterprise License (a API do GitHub devolve NOASSERTION).
 *     O carrossel diz "código aberto pra ler e hospedar", nunca "open source".
 *   · docs.n8n.io: duas formas de uso, Cloud gerenciado e Self-hosted; sobre a
 *     Community, LITERAL: "You can stick with the basic Community edition for
 *     free, indefinitely" e "self-hosting with almost the complete feature set".
 *     A Registered Community, também gratuita, acrescenta pastas, depuração no
 *     editor e dados de execução customizados.
 *   · o comando de instalação e o endereço do editor (localhost:5678) NÃO entram
 *     em slide: vivem no presente (ver memória carrossel-lacuna-do-endereco).
 *   · número de integrações NÃO é afirmado: o README diz 1500+ e a descrição do
 *     repositório diz 400+, então a casa não repassa nenhum dos dois.
 *
 * SEM TRAVESSÃO em nenhum texto de conteúdo.
 */
import type { Carrossel } from '../types';

export const n8nSelfHost: Carrossel = {
  slug: 'n8n-self-host',
  titulo: 'A automação que você monta de graça e vende por R$ 1.500',
  gancho: 'Dá pra montar uma automação de graça na sua máquina e vender ela por R$ 1.500.',
  dataProgramada: '2026-08-18',
  refsLinks:
    'https://docs.n8n.io/choose-how-to-use-n8n/ (Community gratuita, indefinidamente)\n' +
    'https://github.com/n8n-io/n8n (README: comandos, fair-code, Sustainable Use License)\n' +
    'https://www.horadecodar.com.br/quanto-cobrar-automacao-n8n/ (faixas de preço no Brasil)\n' +
    'https://automacaohoje.com/guias/automacao-como-servico-agencia-n8n/ (14/07/2026, faixas e modelo mensal)',
  /**
   * Presente do "comenta N8N" (Notion, 15/08/2026): o comando pra subir na
   * máquina, o desenho do fluxo do agendamento passo a passo, a tabela de preço
   * com as fontes e o roteiro de como oferecer pra primeira clínica.
   *
   * LINK PRIVADO: trocar pelo `.notion.site` depois de Compartilhar > Publicar.
   * PENDENTE: colar o link de inscrição do DevQuest no lugar do placeholder.
   */
  linkPresente: 'https://app.notion.com/p/3bd6dd01fb4881359911fd3f83db4351',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      baixo: true,
      // Quebras curtas de propósito: a 36.8px cabem ~15 caracteres por linha, e
      // as linhas antigas ("você monta de graça", "e vende por R$ 800") passavam
      // disso e quebravam sozinhas de novo, deixando "graça" solta numa linha e,
      // pior, separando "R$" do número. Cada linha aqui cabe inteira.
      titulo: 'A automação que\nvocê monta de\ngraça e vende\npor **R$ 1.500**',
      subtitulo: 'A clínica perde consulta porque ninguém atende o WhatsApp.',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'loop',
      eyebrow: 'A ferramenta',
      titulo: 'Chama **n8n**, e roda\nna sua máquina',
      corpo:
        'Você monta a automação **arrastando caixas**, sem escrever código. A edição Community é **gratuita, sem prazo**, e você hospeda no seu próprio computador ou servidor.',
    },
    {
      variant: 'dark',
      layout: 'center',
      icone: 'bookmark',
      titulo: 'Salva esse post\npra montar depois',
      corpo: 'O serviço, o fluxo e a tabela de preço vêm nos próximos slides.',
    },
    {
      variant: 'purple',
      eyebrow: 'O serviço que vende sozinho',
      titulo: 'Agendamento pra clínica',
      // Quatro itens, sub de uma linha (memória slide-com-4-itens-nao-cabe-corpo).
      itens: [
        { icone: 'instagram', titulo: 'Chega mensagem no WhatsApp', sub: 'Pedindo horário, de madrugada, com a clínica fechada' },
        { icone: 'ai', titulo: 'A IA lê e entende o pedido', sub: 'Texto ou áudio, e responde na hora, em português' },
        { icone: 'map', titulo: 'Olha a agenda e marca', sub: 'Confere o horário livre e grava a consulta' },
        { icone: 'loop', titulo: 'Lembra o paciente na véspera', sub: 'É o que derruba a falta, e é o que a clínica sente' },
      ],
    },
    {
      variant: 'light',
      denso: true,
      eyebrow: 'Salva esse slide',
      titulo: 'Quanto **cobrar**',
      // Uma linha por faixa, curta: a 1ª versão quebrava a coluna da direita e
      // o alinhamento em espaços virava escada (conferido no PNG do 1º render).
      terminal: [
        'SIMPLES   R$ 400 a 900     2 sistemas',
        'MÉDIA     R$ 900 a 2.500   com decisão',
        'COM IA    R$ 2.500+        agente que responde',
        'MENSAL    a combinar       manutenção',
      ],
      corpo:
        'Faixas praticadas no mercado brasileiro em 2026, segundo dois guias de precificação. **O agendamento da clínica fica na média, uns R$ 1.500**, e sobe conforme o que você plugar nele.',
    },
    {
      variant: 'dark',
      denso: true,
      eyebrow: 'A parte que serve pra tudo',
      titulo: 'A anatomia de\n**qualquer** automação',
      terminal: [
        '1. GATILHO  → o que dispara (mensagem, horário)',
        '2. DADO     → de onde vem (agenda, planilha, API)',
        '3. DECISÃO  → o que fazer (filtrar, classificar)',
        '4. AÇÃO     → onde termina (responde, marca, avisa)',
      ],
      corpo:
        'Troque as quatro peças e o mesmo fluxo vira outro serviço: **orçamento que some**, lead que ninguém responde, relatório que ninguém monta.',
    },
    {
      variant: 'light',
      eyebrow: 'Um aviso honesto',
      titulo: 'De graça pra você,\nnão pro **cliente**',
      corpo:
        'O n8n não cobra por execução, mas a operação tem custo: **servidor de pé, atualização, backup** e, se tiver IA no meio, a conta do modelo. Isso entra na sua mensalidade, não no seu prejuízo.\n\n' +
        'E o preço não é pela sua hora, é pelo que a clínica **para de perder**.',
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o fluxo e a\ntabela de preço?',
      botao: 'Comenta N8N 👇',
      corpo:
        'Te mando o comando pra subir na sua máquina, o fluxo do agendamento desenhado passo a passo e a tabela de quanto cobrar em cada tipo de automação.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  legenda:
    'Comenta N8N que eu te mando o fluxo e a tabela de preço. 🤖\n\n' +
    'Toda clínica pequena perde consulta pelo mesmo motivo: chega mensagem no WhatsApp fora do horário e ninguém responde. No dia seguinte a pessoa já marcou em outro lugar.\n\n' +
    'Esse problema tem conserto, e o conserto é uma automação que você consegue montar de graça.\n\n' +
    'A ferramenta chama n8n. Você monta o fluxo arrastando caixas, sem escrever código, e a edição Community é gratuita por tempo indeterminado, rodando na sua própria máquina ou num servidor seu.\n\n' +
    'O fluxo do agendamento é assim: chega a mensagem no WhatsApp, a IA lê (texto ou áudio) e entende o que a pessoa quer, o fluxo olha a agenda, marca o horário livre e ainda manda o lembrete na véspera, que é o que derruba a falta.\n\n' +
    'Agora a parte que quase ninguém fala. Quanto cobrar por isso, segundo os guias de precificação brasileiros de 2026:\n\n' +
    'Automação simples, dois sistemas conversando: R$ 400 a R$ 900.\n' +
    'Automação média, várias etapas com decisão no meio: R$ 900 a R$ 2.500.\n' +
    'Com agente de IA que lê, decide e responde: a partir de R$ 2.500.\n' +
    'E a mensalidade de manutenção, que é onde mora o dinheiro que se repete.\n\n' +
    'O agendamento da clínica fica na média, uns R$ 1.500, e sobe conforme o que você plugar nele.\n\n' +
    'O aviso honesto: o n8n não cobra por execução, mas a operação tem custo. Servidor de pé, atualização, backup e a conta do modelo de IA, se tiver um. Isso entra na sua mensalidade, não no seu prejuízo. E o preço nunca é pela sua hora, é pelo que o cliente para de perder.\n\n' +
    'Comenta N8N aqui embaixo que eu te mando o comando pra subir na sua máquina, o fluxo do agendamento desenhado passo a passo e a tabela de quanto cobrar em cada tipo de automação. 👇',
  hashtags:
    'n8n automacao inteligenciaartificial freelancer rendaextra programacao devbr devemdobro produtividade whatsapp',
  ctaFinal:
    'Comenta N8N que eu te mando o comando pra subir na sua máquina, o fluxo do agendamento desenhado passo a passo e a tabela de quanto cobrar em cada tipo de automação.',
  briefing:
    'EIXO NOVO (pedido do dono, 15/08/2026): sai "ferramenta grátis que roda na sua máquina", entra "monta de graça e ' +
    'vende". O dono pediu exemplos práticos de uso e de quanto cobrar, e deu o exemplo âncora: agente de agendamento ' +
    'pra clínica, pelo menos R$ 800 (o dono subiu esse âncora pra R$ 1.500 em 17/08/2026).\n\n' +
    'PREÇOS CONFERIDOS EM DUAS FONTES INDEPENDENTES (15/08/2026), porque preço é afirmação verificável:\n' +
    '  · horadecodar.com.br ("Quanto cobrar automação n8n"): simples R$ 400 a 900; intermediária R$ 900 a 2.500; ' +
    'avançada R$ 2.500 a 10.000 ou mais.\n' +
    '  · automacaohoje.com (14/07/2026): mesmas faixas iniciais, e "o dinheiro consistente está na operação mensal". ' +
    'A mensalidade tem que cobrir VPS (US$ 20 a 50 por cliente), consumo de API de IA, horas de suporte e margem.\n' +
    'O R$ 1.500 do título (o dono subiu de 800 pra 1.500 em 17/08/2026) cai no meio da faixa intermediária das duas ' +
    'fontes, R$ 900 a R$ 2.500, que é onde o serviço mora de verdade: várias integrações, decisão no meio do fluxo e ' +
    'notificação por WhatsApp. O 800 era o piso da faixa simples.\n\n' +
    'OUTROS SERVIÇOS VENDÁVEIS COM O MESMO FLUXO (estão no presente, e servem de pauta pra outros posts):\n' +
    '  1. Agendamento pra clínica, salão, barbearia ou consultório: WhatsApp + agenda + lembrete na véspera. ' +
    'R$ 800 a R$ 2.500, e o argumento de venda é a falta que deixa de acontecer.\n' +
    '  2. Qualificação de lead: formulário chega, a IA classifica, o quente vai pro CRM e o vendedor é avisado na ' +
    'hora. O guia da automacaohoje cita um fluxo desses que poupa 20 horas mensais de um vendedor.\n' +
    '  3. Orçamento que some: cliente pediu, ninguém respondeu. O fluxo cobra sozinho em 24h, 3 dias e 7 dias.\n' +
    '  4. Relatório de segunda: junta os números da semana e entrega pronto no WhatsApp do dono. Faixa simples, ' +
    'R$ 400 a 900, e é a porta de entrada mais fácil de vender.\n' +
    '  5. Onboarding de cliente novo: contrato assinado dispara pastas, e-mail de boas-vindas e a call agendada.\n\n' +
    'FERRAMENTA, NA FONTE PRIMÁRIA: n8n-io/n8n com 200.765 estrelas; Community "free, indefinitely" com "almost the ' +
    'complete feature set" (docs.n8n.io); modelo fair-code sob Sustainable Use License, que NÃO é open source padrão, ' +
    'por isso nenhum slide usa esse termo; número de integrações não é citado porque o README (1500+) e a descrição ' +
    'do repositório (400+) se contradizem.\n\n' +
    'A LACUNA: o comando de instalação e o localhost:5678 não aparecem em slide nenhum, só no presente.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): tem número, tem dinheiro e tem a dor da clínica no subtítulo.\n' +
    'Regra 2 (o slide 2 confirma): a ferramenta é de graça e roda na sua máquina.\n' +
    'Regra 3 (slide sozinho): o serviço, a tabela, a anatomia, o aviso.\n' +
    'Regra 4 (salvável): o slide da tabela de preço, que é o mais salvável que a conta já fez.\n' +
    'Regra 5 (CTA único): comenta N8N.\n\n' +
    'SEMANA DE CARRINHO DO DEVQUEST (17 a 21/08): o carrossel não vende curso. A matrícula aparece só no presente, ' +
    'sem o GIF do GTA 6.\n\n' +
    'PENDENTE ANTES DE PUBLICAR: arte de capa (hoje é o gradiente de fallback) e o link de inscrição do DevQuest.',
};
