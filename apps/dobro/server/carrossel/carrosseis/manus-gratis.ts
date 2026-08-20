/**
 * apps/dobro — carrossel "O Manus está de graça até dia 25".
 *
 * ORIGEM: card do board (id 775b4a37), com a referência
 * https://www.instagram.com/p/Db88sT6llAQ/ capturada pelo Telegram em 12/08/2026.
 *
 * ⚠️ A REFERÊNCIA NÃO PÔDE SER LIDA (19/08/2026). O post existe, mas a conta
 * restringiu quem vê o conteúdo ("This account has set limits on who can see
 * their profile and content"), e nem o `capturar-slides.cjs` logado passou: voltou
 * com zero slides em duas tentativas. Então este carrossel NÃO copia a estrutura
 * da ref, ele nasce do próprio tema. Se o dono mandar os prints, vale reescrever
 * seguindo a espinha dela.
 *
 * ⚠️⚠️ GATE DE PRECISÃO, LEIA ANTES DE PUBLICAR. A campanha é real e quatro
 * fontes independentes concordam nos detalhes, MAS a fonte primária não confirma
 * publicamente: manus.im é uma SPA que não entrega conteúdo pra leitor headless, o
 * blog oficial não tem post sobre a campanha (o mais recente é de 17/07/2026), e o
 * anúncio vive num POPUP dentro do app logado. O que as fontes dizem, e o que
 * precisa ser conferido no popup por quem tem conta:
 *   · termina em 25 de agosto de 2026, às 23:59 (uma fonte diz fuso de Singapura,
 *     as outras não citam fuso);
 *   · valem Manus 1.6 e Manus 1.6 Lite, SEM consumir créditos;
 *   · Manus 1.6 Max fica DE FORA;
 *   · dentro das cotas diárias: usuário gratuito faz até 20 imagens e 1 vídeo por
 *     dia, pagante até 200 imagens e 10 vídeos;
 *   · não pede cartão de crédito;
 *   · ativa em manus.im/app, entrando na conta e clicando no popup da oferta.
 * Fontes: gate.com/news (12/08/2026, que cita theblockbeats), note.com/naoaki27,
 * resourify.com e um fio no X. NENHUMA delas é o anúncio oficial.
 *
 * POR ISSO O CARROSSEL NÃO DIZ "100% DE GRAÇA" em lugar nenhum. Diz "sem gastar
 * crédito", que é o que as fontes sustentam, e traz a cota diária e o Max de fora
 * num slide próprio. "100% de graça" com cota diária e modelo fora vira promessa
 * quebrada no comentário, e a conta paga isso.
 *
 * O QUE O MANUS FAZ, DA FONTE PRIMÁRIA: o menu do próprio manus.im lista Web app,
 * AI design, AI slides, AI image generator, AI music generator, Manus browser
 * operator, Wide Research, Mail Manus e integração com Slack. É daí que sai o
 * slide 3, sem inventar capacidade.
 *
 * PREÇO: NÃO entra em slide nenhum. Os planos aparecem em comparativos de terceiro
 * (US$ 20, 40 e 200 por mês), nunca conferidos na fonte primária, e preço errado é
 * o erro mais caro que a conta pode cometer. O gancho funciona sem ele.
 *
 * SEM TRAVESSÃO em nenhum texto de conteúdo.
 */
import type { Carrossel } from '../types';

export const manusGratis: Carrossel = {
  slug: 'manus-gratis',
  titulo: 'Manus AI: o agente mais hypado DE GRAÇA até dia 25',
  gancho:
    'Manus AI: o agente mais hypado DE GRAÇA até dia 25. Veja 4 formas de usar antes que acabe.',
  dataProgramada: '2026-08-19',
  refsLinks:
    'https://www.instagram.com/p/Db88sT6llAQ/ (referência do card, NÃO pôde ser lida: conta restrita)\n' +
    'https://manus.im/ (fonte primária: o menu lista o que a ferramenta faz)\n' +
    'https://www.gate.com/news/detail/manus-launches-limited-time-free-campaign-through-august-25-23393121 (12/08/2026)\n' +
    'https://note.com/naoaki27/n/n845ac7b15c1b (detalhes da campanha e limites diários)',
  /**
   * Presente criado em 19/08/2026. Traz os quatro comandos prontos pra colar (um
   * por uso do carrossel), o passo a passo de ativação, a tabela de preço da
   * landing page com as fontes, o que fazer quando a cota diária acabar e a ordem
   * sugerida pros dias que sobram.
   *
   * PENDENTE na página: o link de inscrição do DevQuest, que está como placeholder
   * no último bloco.
   */
  linkPresente: 'https://app.notion.com/p/3c16dd01fb4881d495a8d674b0600881',
  /**
   * Capa gerada pelo dono em 19/08/2026: panda e tigre de roupa de kung fu num
   * confronto sobre plataforma de pedra, com pôr do sol dourado nas montanhas.
   * O chinês vem do próprio Manus, que é uma empresa chinesa.
   *
   * Não é personagem de estúdio nenhum, é criatura nossa, na mesma família do
   * gambá do 7-repos e do macaco do cara-de-caro. A arte já nasceu com os dois
   * animais nos dois terços de cima e a plataforma vazia embaixo, que é
   * exatamente onde o texto entra.
   */
  bgImage: 'server/carrossel/assets/manus-gratis/capa.png',
  slides: [
    {
      variant: 'photo',
      cover: true,
      baixo: true,
      tituloMenor: true,
      // Gancho do dono (19/08/2026). A 25.8px cabem ~21 caracteres por linha, e a
      // segunda metade da frase dele desce pro subtítulo, que é onde ela cabe sem
      // espremer a arte.
      titulo: 'Manus AI: o agente\nmais hypado **DE GRAÇA**\naté dia 25',
      subtitulo: 'Veja 4 formas de usar antes que acabe.',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'light',
      eyebrow: 'Uso 1 de 4',
      titulo: 'Uma página que\n**vende** pro cliente',
      subtitulo: 'Você descreve o negócio e ele monta e publica sozinho.',
      corpo:
        'Não é rascunho: sai com endereço pra abrir. E é o serviço mais fácil de vender pra quem está começando, porque o dono do negócio entende na hora pra que serve.',
      // Único comando que entra em slide. Os outros três vão pro presente, senão
      // o CTA perde a razão de existir (memória carrossel-lacuna-do-endereco).
      calloutLabel: 'Cola e manda',
      callout:
        'Monte uma página de uma dobra pro meu serviço, com foto, preço e botão de WhatsApp, e publique num endereço que eu possa abrir.',
      calloutDepois: true,
    },
    {
      variant: 'dark',
      eyebrow: 'Quanto isso vale',
      titulo: 'De **R$ 500 a R$ 2.500**\npela primeira',
      terminal: [
        'FREELANCER      R$ 500 a 3.000',
        'PEQUENA EMPRESA R$ 800 a 3.320',
        'COM TRÁFEGO     R$ 2.000 a 5.000',
      ],
      corpo:
        'Faixas praticadas no Brasil em 2026, em dois guias de precificação. **Começando, os R$ 500 a R$ 2.500 são o seu lugar**, e a página sai numa tarde.',
    },
    {
      // SEM destaque `**` neste slide: em `purple` o realce sai lilás sobre roxo
      // e o contraste morre (bug conhecido do template, ver memória
      // capas-carrossel-padrao). O peso aqui vem do bloco de resultado, não do
      // negrito.
      variant: 'purple',
      eyebrow: 'Uso 2 de 4',
      titulo: 'A lista de quem\npode te contratar',
      corpo:
        'Ele abre dezenas de páginas sozinho e volta com a fila pronta. Você pede os que ainda não têm site, e recebe exatamente quem precisa do uso 1.',
      // Colunas curtas pra alinhar: nome comprido empurra a coluna do meio e o
      // bloco vira escada no PNG (já aconteceu na tabela de preço do n8n).
      terminal: [
        'NEGÓCIO        CONTATO      SITE?',
        'Clínica        (11) 9xxxx   não',
        'Barbearia      (11) 9xxxx   não',
        'Loja de bolo   (11) 9xxxx   só perfil',
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Uso 3 de 4',
      titulo: 'A proposta pronta\npra **mandar hoje**',
      corpo:
        'Você conta o que vai entregar e por quanto, e ele devolve a proposta escrita. O que travava a noite inteira sai **enquanto você janta**.',
      terminal: [
        'O QUE ENTRA    as páginas e o que tem em cada',
        'PRAZO          quando fica pronto',
        'PAGAMENTO      como e quando você recebe',
        'O QUE NÃO ENTRA o que vira orçamento à parte',
      ],
    },
    {
      variant: 'dark',
      eyebrow: 'Uso 4 de 4',
      titulo: 'Um **jogo** seu,\nno ar hoje',
      corpo:
        'Peça um joguinho de navegador e ele monta e publica. Serve de portfólio, serve de brinde pro cliente e, principalmente, **é o jeito mais rápido de entender do que ele é capaz**.',
      calloutLabel: 'Por que isso importa',
      callout:
        'Ninguém acredita em automação por explicação. Acredita quando abre o link no celular e a coisa funciona.',
      calloutDepois: true,
    },
    {
      variant: 'light',
      eyebrow: 'Salva esse slide',
      titulo: 'Como **ativar**',
      steps: [
        { n: '01', titulo: 'Abre manus.im/app', sub: 'No navegador do computador, que é onde o aviso aparece' },
        { n: '02', titulo: 'Entra na sua conta', sub: 'Se não tiver, cria na hora. Não pede cartão' },
        { n: '03', titulo: 'Clica no aviso da oferta', sub: 'Ele aparece sozinho assim que a tela abre' },
      ],
      corpo: 'Feito isso, as tarefas rodam **sem descontar do seu crédito** até o dia 25.',
    },
    {
      // Também sem `**`: slide roxo. Ver a nota do "Uso 2 de 4".
      variant: 'purple',
      eyebrow: 'A parte que ninguém conta',
      titulo: 'O que fica de fora',
      corpo:
        'A versão Max não entra na promoção, e a conta gratuita tem cota diária. O resto das tarefas roda solto.',
      terminal: [
        'LIBERADO    1.6 e Lite, sem crédito',
        'DE FORA     a versão Max',
        'COTA GRÁTIS 20 imagens e 1 vídeo/dia',
        'COTA PAGA   200 imagens e 10 vídeos/dia',
        'ACABA       dia 25, e volta a custar',
      ],
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer testar\nantes de fechar?',
      botao: 'Comenta MANUS 👇',
      corpo:
        'Te mando o passo a passo com print de onde fica o aviso, as 5 tarefas que valem testar antes do dia 25 e o que fazer quando a cota do dia acabar.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  // Alvo de 700 a 900 caracteres. A linha "Segue @devemdobro..." NÃO entra aqui:
  // é montada na hora pela descricao-insta.ts.
  legenda:
    'Comenta MANUS que eu te mando os 4 comandos prontos e o passo a passo pra ativar. 🤖\n\n' +
    'O Manus é agente de IA de verdade: você descreve a tarefa e ele executa do começo ao fim, sozinho. Até o dia ' +
    '25 ele roda sem gastar crédito, e não pede cartão.\n\n' +
    'Quatro coisas pra fazer com os dias grátis:\n\n' +
    '1. Uma página que vende, publicada com endereço pra abrir. É o serviço mais fácil de vender pra quem está ' +
    'começando, e a faixa de freelancer no Brasil em 2026 vai de R$ 500 a R$ 3.000.\n\n' +
    '2. A lista de quem pode te contratar: ele abre dezenas de páginas e volta com nome, contato e o que o negócio ' +
    'faz. Peça os que ainda não têm site.\n\n' +
    '3. A proposta escrita, com escopo, prazo e forma de pagamento.\n\n' +
    '4. Um jogo de navegador seu, no ar hoje, que é o jeito mais rápido de entender do que ele é capaz.\n\n' +
    'A parte que ninguém conta: a versão Max fica de fora e a conta gratuita tem cota de 20 imagens e 1 vídeo por ' +
    'dia. O resto roda solto.\n\n' +
    'Comenta MANUS aqui embaixo. 👇',
  // Cinco, uma de cada função: nicho exato, categoria, alcance, intenção, marca.
  hashtags: 'manus agentedeia inteligenciaartificial freelancer devemdobro',
  // "com print de onde fica o aviso" saiu do CTA em 19/08/2026: a página do
  // presente não tem esse print (ninguém aqui tem conta no Manus pra tirar), e
  // prometer no carrossel o que o presente não entrega é o jeito mais rápido de
  // queimar a palavra-gatilho. Se o dono mandar o print, volta.
  ctaFinal:
    'Comenta MANUS que eu te mando os 4 comandos prontos pra colar (a página, a lista de clientes, a proposta e o jogo), o passo a passo pra ativar o período gratuito e o que fazer quando a cota do dia acabar.',
  briefing:
    'GATE DE PRECISÃO, RESOLVER ANTES DE PUBLICAR: a campanha é real e quatro fontes independentes concordam, mas ' +
    'NENHUMA é o anúncio oficial. O manus.im não entrega conteúdo pra leitor automático, o blog oficial não tem post ' +
    'sobre isso (o último é de 17/07/2026) e o aviso vive num popup dentro do app logado. Quem tem conta abre ' +
    'manus.im/app e confere em trinta segundos: (1) a data e o horário de término, (2) se vale mesmo pro 1.6 e pro ' +
    '1.6 Lite e se o Max está fora, (3) a cota diária de imagem e vídeo da conta gratuita.\n\n' +
    'POR QUE O CARROSSEL NÃO DIZ "100% DE GRAÇA", mesmo o card tendo nascido com esse nome: existe cota diária e ' +
    'existe modelo de fora. Promessa de "100%" com asterisco vira briga no comentário e queima a conta. O post diz ' +
    '"sem gastar crédito" e dedica um slide inteiro ao que fica de fora, o que é mais forte: quem conta a parte ruim ' +
    'ganha a confiança pra dizer o resto.\n\n' +
    'EIXO (pedido do dono, 19/08/2026): não é "o que o Manus faz", é O QUE FAZER COM OS DIAS GRÁTIS. Um uso por ' +
    'slide, começando pelo que dá dinheiro. Os quatro escolhidos por ele: landing page, prospecção de cliente, ' +
    'proposta comercial e criação de jogo.\n\n' +
    'PREÇO DA LANDING PAGE, CONFERIDO EM DUAS FONTES INDEPENDENTES (19/08/2026), porque preço é afirmação ' +
    'verificável:\n' +
    '  · bqhost.com.br e freelasemcrise.com.br: freelancer de R$ 500 a R$ 3.000; pequena empresa e MEI de R$ 800 a ' +
    'R$ 3.320; projeto com tráfego pago a partir de R$ 2.000 a R$ 5.000; a faixa geral do mercado vai de R$ 497 a ' +
    'R$ 7.100.\n' +
    '  · Os R$ 500 a R$ 2.500 que o dono deu como âncora de iniciante caem DENTRO da faixa de freelancer das duas ' +
    'fontes, e são conservadores. Mantidos.\n' +
    'Os outros três usos NÃO levam preço: prospecção, proposta e jogo não têm tabela de mercado, e inventar faixa ' +
    'pra eles seria o mesmo erro que o post evita no preço do Manus.\n\n' +
    'PREÇO DO MANUS FORA DE PROPÓSITO: os planos pagos aparecem em comparativos de terceiro (US$ 20, 40 e 200 por ' +
    'mês), nunca conferidos na fonte primária. Preço errado é o erro mais caro que a conta pode cometer, e o gancho ' +
    'já é forte sem ele. Se alguém quiser usar numa próxima versão, confere logado antes.\n\n' +
    'A LACUNA: um comando entra em slide (o da página) e os outros três vivem só no presente. Dar os quatro na tela ' +
    'mataria a razão do CTA existir (memória carrossel-lacuna-do-endereco).\n\n' +
    'A REFERÊNCIA NÃO PÔDE SER LIDA: o post existe, mas a conta restringiu quem vê o conteúdo, e nem o capturador ' +
    'logado passou (zero slides em duas tentativas). Este carrossel nasceu do tema, não da estrutura dela. Se o dono ' +
    'mandar os prints, vale comparar a espinha.\n\n' +
    'O QUE O MANUS FAZ saiu do MENU do próprio manus.im (fonte primária): Web app, AI design, AI slides, AI image ' +
    'generator, AI music generator, browser operator, Wide Research, Mail Manus e Slack. Nenhuma capacidade foi ' +
    'inventada, e o slide 3 traduz cada uma pro que a pessoa recebe no fim.\n\n' +
    'AVISO NO SITE, que pode virar pauta ou ressalva: "Manus will soon resume operating as an independent company. ' +
    'Action may be required for your Manus account." Não entrou no carrossel porque não muda o que a pessoa faz ' +
    'hoje, mas se alguém perguntar nos comentários, a resposta é essa.\n\n' +
    'URGÊNCIA REAL: publicando em 19/08, sobram seis dias. É o tipo de post que envelhece rápido, então se escorregar ' +
    'da semana, ele morre. Prioridade alta ou não vai.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): nome próprio, "de graça" e uma data que fecha.\n' +
    'Regra 2 (o slide 2 confirma): o que é um agente, na diferença com o chat que a pessoa já usa.\n' +
    'Regra 3 (slide sozinho): o que ele entrega, como ativar, o que fica de fora, a tarefa pra testar.\n' +
    'Regra 4 (salvável): o slide do passo a passo de ativação.\n' +
    'Regra 5 (CTA único): comenta MANUS.\n\n' +
    'PENDENTE ANTES DE PUBLICAR: confirmar o popup, criar a página do presente no Notion e a arte de capa.',
};
