/**
 * apps/dobro — carrossel "Enquanto você brinca com IA, tem gente ganhando dinheiro".
 *
 * ORIGEM: card do board (id e271b214), briefing do dono = o roteiro do Dia 1 da
 * Imersão "2 a 5k com IA". O ângulo pedido, na íntegra: "a pessoa que se
 * interessa por tecnologia ou já é dev já deveria estar usando IA pra ganhar
 * dinheiro com as 3 soluções, ao invés de só ficar usando IA de brincadeira".
 *
 * O DIAGNÓSTICO É DO PRÓPRIO BRIEFING, e é o que o slide 2 carrega: "você
 * aprendeu a usar a ferramenta, mas ninguém te ensinou a empacotar e vender o
 * que ela faz". Não é preguiça nem falta de inteligência, é mapa errado.
 *
 * NÚMEROS CONFERIDOS NA FONTE PRIMÁRIA (17/08/2026), porque os três do briefing
 * não sobreviveram iguais à checagem:
 *   · +1.200% CONFIRMADO. Vendas online de micro e pequenas empresas saíram de
 *     R$ 5 bi (2019) para R$ 67 bi (2024). Fonte: Painel Nacional do E-commerce
 *     (3ª edição), MDIC com dados da Receita Federal, divulgado em junho/2025.
 *     gov.br/mdic → "Vendas de pequenas empresas pela internet crescem 1.200%".
 *   · 52% CONFIRMADO. Só 52% das pequenas empresas têm site próprio (era 51% em
 *     2019), contra 77% das médias e 85% das grandes. Fonte: TIC Empresas 2024,
 *     CGI.br/Cetic.br. Ou seja: quase METADE não tem site.
 *   · "2 a 4h de resposta no WhatsApp, cliente desiste em 15 min" NÃO CONFIRMADO
 *     e por isso NÃO entra em slide nenhum. O que existe medido, e é melhor: 80%
 *     de quem usa WhatsApp conversa com empresa por ali, e 69% considera o app um
 *     ótimo canal pra isso (Panorama Mobile Time/Opinion Box, Mensageria no
 *     Brasil). É esse que está no slide 5.
 *
 * PREÇOS: R$ 800 a R$ 1.500 pelo site e R$ 500 a R$ 3.000 pela solução são do
 * BRIEFING DO DONO, o mercado dele. Não achei fonte pública pra citar junto, e
 * por isso o slide diz "o que o mercado paga", sem carimbar instituto nenhum.
 *
 * A LACUNA (memória carrossel-lacuna-do-endereco): o post mostra as três
 * soluções, os números e as faixas, e NÃO entrega o passo a passo de montar nem
 * o roteiro de vender. É isso que o presente carrega e é o motivo de o CTA
 * existir.
 *
 * SEM TRAVESSÃO em nenhum texto de conteúdo.
 */
import type { Carrossel } from '../types';

export const brincaComIa: Carrossel = {
  slug: 'brinca-com-ia',
  // Igual ao texto da capa (memória capa-repete-o-titulo). Trocado em 17/08/2026
  // junto com o gancho novo do dono; o card do título anterior foi apagado à mão,
  // porque o render casa card por TÍTULO e um rename deixa o antigo órfão.
  titulo: 'Enquanto você brinca com IA, outros ganham de R$ 2.000 a R$ 5.000 por mês',
  gancho:
    'Enquanto você brinca com IA, outros ganham de R$ 2.000 a R$ 5.000 por mês com 3 soluções.',
  refsLinks:
    'https://www.gov.br/mdic/pt-br/assuntos/noticias/2025/junho/vendas-de-pequenas-empresas-pela-internet-crescem-1-200-desde-a-pandemia-mostra-painel-do-mdic (MDIC/Receita Federal, jun/2025)\n' +
    'https://cetic.br/media/docs/publicacoes/2/20250512121759/tic_empresas_2024_resumo_executivo.pdf (TIC Empresas 2024, CGI.br)\n' +
    'https://www.mobiletime.com.br/pesquisas/ (Panorama Mobile Time/Opinion Box, Mensageria no Brasil)\n' +
    'briefing do dono: Dia 1 da Imersão 2 a 5k com IA (card e271b214)',
  /**
   * Presente do "comenta GRANA" (Notion, 17/08/2026): as três soluções com as
   * ferramentas e o caminho de cada uma, a tabela de prazo e preço, e o roteiro
   * de fechar o primeiro cliente com a mensagem de abordagem pronta pra colar.
   * É ele que carrega o passo a passo que os slides de propósito não trazem.
   *
   * LINK PRIVADO: trocar pelo `.notion.site` depois de Compartilhar > Publicar.
   */
  linkPresente: 'https://app.notion.com/p/3c06dd01fb4881388b15c892d9534f2c',
  /**
   * Capa: a cabeça do burro de óculos escuros (arte do dono, 17/08/2026). A
   * piada é a leitura do título: enquanto você brinca com IA, o burro é você.
   *
   * Ela chegou pronta pro encaixe, o que é raro: 1122×1402 é 4:5 exato, a mesma
   * proporção do slide (logo `cover` não corta nada), o fundo já é escuro e o
   * terço de baixo já veio vazio pro texto. Sem script de encaixe nenhum.
   */
  bgImage: 'server/carrossel/assets/brinca-com-ia/capa.png',
  slides: [
    {
      variant: 'photo',
      cover: true,
      // A arte já é preta embaixo, então o escurecido só precisa entrar no
      // último terço: 'faixa' ou o padrão comeriam o pescoço do bicho à toa.
      scrim: 'curto',
      baixo: true,
      tituloMenor: true,
      tituloEscala: 1.05,
      /**
       * Gancho escrito pelo dono, 17/08/2026. Sem subtítulo por decisão dele: o
       * título já carrega a faixa e as três soluções, e a linha extra só
       * empurrava a arte pra cima.
       *
       * 4 linhas de 20, 21, 23 e 22 caracteres (cabem ~23 em 27,1px).
       */
      titulo:
        'Enquanto você brinca\ncom IA, outros ganham\n**de R$ 2.000 a R$ 5.000**\npor mês com 3 soluções',
      // Swipe personalizado, como na capa de maior salvamento da conta (o
      // "Deslize e veja os 7" do 7-repos): dizer QUANTAS coisas vêm faz o dedo
      // saber o que ganha se deslizar.
      swipe: 'Deslize e veja as 3 ›',
    },
    /**
     * UM SLIDE POR SOLUÇÃO (reestruturação do dono, 17/08/2026), no lugar de um
     * slide que listava as três e outros dois que juntavam preço e ferramenta
     * fora de contexto. Cada um responde as mesmas três perguntas na mesma
     * ordem: com o quê, em quanto tempo, por quanto.
     *
     * O CARROSSEL VAI DA CAPA DIRETO PRA SOLUÇÃO 1 (decisão do dono): saíram o
     * slide de diagnóstico e o de "salva esse post". Vale saber o que isso
     * custa, pra decidir de novo depois com dado: o pedido de salvar cedo é uma
     * das quatro alavancas do post campeão (o JARVIS gastava um slide inteiro
     * nisso, no 3), e salvamento é a métrica que este formato mais rende.
     */
    {
      variant: 'purple',
      eyebrow: 'Solução 1',
      // Sem **destaque** em slide roxo: o lilás some no roxo (memória
      // carrossel-estilo-jarvis).
      titulo: 'Site e página\nde venda',
      itens: [
        {
          icone: 'loop',
          titulo: 'Poucas horas',
          sub: 'Da conversa com o dono até a página no ar, no mesmo dia',
        },
        {
          icone: 'ai',
          titulo: 'R$ 800 a R$ 1.500',
          sub: 'O que o mercado paga por uma página que vende',
        },
        {
          icone: 'globe',
          titulo: 'Cliente é o que não falta',
          sub: 'Quase metade das pequenas empresas não tem site',
        },
      ],
      marcas: ['vercel', 'replit', 'lovable'],
    },
    {
      variant: 'light',
      eyebrow: 'Solução 2',
      titulo: 'Agente de IA\nno **WhatsApp**',
      itens: [
        {
          icone: 'chat',
          titulo: 'GPT Maker, pronto pra usar',
          sub: 'Plataforma brasileira, sem escrever código, com teste grátis',
        },
        {
          icone: 'loop',
          titulo: 'Um dia de trabalho',
          sub: 'Você treina o agente com o material do cliente e liga no número dele',
        },
        {
          icone: 'ai',
          titulo: 'R$ 500 a R$ 3.000',
          sub: 'E a ferramenta te custa a partir de R$ 87 por mês',
        },
      ],
      /**
       * O GPT Maker é real e foi conferido em 17/08/2026 (gptmaker.ai): monta
       * agente sem código, pluga em WhatsApp, Instagram, Messenger e site, tem
       * teste grátis, e os planos publicados são R$ 87, R$ 397 e R$ 1.197 por
       * mês, por créditos e número de agentes. O R$ 87 do slide é o plano de
       * entrada, não uma estimativa nossa.
       */
      corpo:
        'A conta que fecha esse serviço: a ferramenta custa dezenas por mês, o cliente paga milhares pela instalação, e o agente atende de madrugada sem reclamar.',
    },
    /**
     * O PEDIDO É DE SEGUIR, NÃO DE SALVAR (decisão do dono, 17/08/2026). Ele
     * entra aqui no meio, depois de duas soluções entregues: a pessoa já viu que
     * o post cumpre o que promete, e é aí que o pedido tem lastro.
     *
     * O corpo também segura a passagem pro próximo slide, prometendo o mais caro
     * dos três. Sem isso, um slide de pedido no meio do carrossel é um degrau
     * onde a pessoa desce.
     */
    {
      variant: 'dark',
      layout: 'center',
      icone: 'follow',
      titulo: 'Segue pra aprender\na montar essas 3',
      corpo:
        'É isso que a gente ensina aqui: construir cada uma delas com IA, do zero, sem precisar ser sênior.\n\n' +
        'E não sai daqui, porque a próxima é a mais cara das três, e a única que continua te pagando todo mês depois de entregue.',
    },
    {
      // Roxo, não escuro: o slide de seguir acabou de usar o escuro, e dois
      // seguidos apagam o ritmo de fundos do padrão.
      variant: 'purple',
      eyebrow: 'Solução 3',
      // Sem **destaque** no roxo: o lilás some.
      titulo: 'Sistema sob medida',
      itens: [
        {
          icone: 'layers',
          titulo: 'CRM e financeiro',
          sub: 'A empresa que ainda controla cliente e caixa em planilha',
        },
        {
          icone: 'loop',
          titulo: 'Poucas semanas',
          sub: 'Com IA escrevendo o código, o que era trimestre virou semanas',
        },
        {
          icone: 'ai',
          titulo: 'O ticket mais alto dos três',
          sub: 'E manutenção mensal em cima, de 15% a 25% do projeto por ano',
        },
      ],
      /**
       * ANCORAGEM COM FONTE, não chute: guias brasileiros de precificação de
       * 2026 põem software sob medida a partir de ~R$ 80 mil em software house
       * (chegando a R$ 800 mil em alta complexidade), a hora de desenvolvimento
       * entre R$ 150 (freelancer) e R$ 600 (software house), e sustentação anual
       * em 15% a 25% do valor do projeto.
       *
       * ⚠️ O SLIDE NÃO CRAVA UMA FAIXA PRA VOCÊ COBRAR, de propósito: os números
       * publicados são de empresa com equipe, e o público deste post está
       * começando sozinho. Cravar "cobre R$ 30 mil" seria inventar. Se o dono
       * quiser um número, é ele que dá.
       */
      corpo:
        'Software house cobra a partir de R$ 80 mil por um sistema desses, e a hora de um freelancer brasileiro está em R$ 150. Entre esses dois extremos mora o seu preço.',
    },
    {
      variant: 'light',
      eyebrow: 'Por que agora',
      // Este slide era a lista dos três números. Virou a JANELA depois que cada
      // solução passou a carregar o próprio dado: repetir "52% não tem site"
      // aqui, logo depois do slide 1, seria falar duas vezes a mesma coisa.
      titulo: 'A janela **é agora**',
      itens: [
        {
          icone: 'ai',
          titulo: '+1.200% em 5 anos',
          sub: 'Venda online de pequena empresa: R$ 5 bi em 2019, R$ 67 bi em 2024',
        },
        {
          icone: 'map',
          titulo: 'Quem chega primeiro fica',
          sub: 'Cada negócio da sua cidade contrata uma vez e não troca à toa',
        },
        {
          icone: 'chat',
          titulo: '8 em cada 10 falam por WhatsApp',
          sub: 'É lá que o cliente pergunta, e lá que ninguém responde a tempo',
        },
      ],
      corpo:
        'Números do MDIC com dados da Receita Federal (2025) e do Panorama Mobile Time/Opinion Box. O mercado cresceu, as empresas ficaram para trás, e alguém vai atender essa fila.',
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer as três com\no preço de cada uma?',
      botao: 'Comenta GRANA 👇',
      corpo:
        'Te mando as três soluções destrinchadas, a tabela de quanto cobrar por cada uma e o roteiro pra fechar o primeiro cliente.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  legenda:
    'Salva esse post e comenta GRANA que eu te mando as três soluções e a tabela de preço. 💰\n\n' +
    'Tem uma diferença entre quem usa IA e quem ganha dinheiro com IA, e ela não é técnica.\n\n' +
    'Você já testou prompt, já viu tutorial, já brincou com o ChatGPT e com o Claude. E não entrou um real na sua conta por causa disso. O problema não é força de vontade: é que usar a ferramenta e empacotar um serviço são coisas diferentes, e só uma delas paga.\n\n' +
    'As três soluções que o mercado brasileiro compra hoje, com ferramenta, prazo e preço:\n\n' +
    'Site e página de venda. Sai em poucas horas com v0 da Vercel, Replit ou Lovable, e o mercado paga de R$ 800 a R$ 1.500. Quase metade das pequenas empresas não tem site nenhum: só 52% têm o próprio, contra 85% das grandes, pelo TIC Empresas 2024 do CGI.br.\n\n' +
    'Agente de IA no WhatsApp. Dá pra montar em um dia com o GPT Maker, que é plataforma brasileira, sem escrever código e com teste grátis. A ferramenta começa em R$ 87 por mês e o serviço vai de R$ 500 a R$ 3.000.\n\n' +
    'Sistema sob medida, tipo CRM ou financeiro. É o ticket mais alto dos três, e com IA escrevendo código o que levava um trimestre virou poucas semanas. Software house cobra a partir de R$ 80 mil por um sistema desses, e a hora do freelancer brasileiro está em R$ 150. Ainda dá manutenção mensal em cima, de 15% a 25% do valor por ano.\n\n' +
    'E por que agora: a venda online das pequenas empresas saiu de R$ 5 bilhões em 2019 para R$ 67 bilhões em 2024, alta de 1.200%, segundo o painel do MDIC com dados da Receita Federal. E 8 em cada 10 usuários de WhatsApp conversam com empresa por ali, pelo Panorama Mobile Time/Opinion Box.\n\n' +
    'Traduzindo: quase metade dos negócios da sua cidade não tem site, e o cliente deles está esperando resposta num WhatsApp que ninguém atende.\n\n' +
    'Se você já programa, está com a faca e o queijo na mão e está perdendo tempo. O que falta não é técnica, é empacotar.\n\n' +
    'Salva esse post e comenta GRANA aqui embaixo que eu te mando as três soluções destrinchadas, a tabela de quanto cobrar por cada uma e o roteiro pra fechar o primeiro cliente. 👇',
  hashtags:
    'inteligenciaartificial iaparadev freelancer rendaextra programacao devbr empreendedorismo trabalharemcasa devemdobro tecnologia',
  ctaFinal:
    'Comenta GRANA que eu te mando as três soluções destrinchadas, a tabela de quanto cobrar por cada uma e o roteiro pra fechar o primeiro cliente.',
  briefing:
    'Carrossel do ângulo pedido pelo dono no card e271b214: quem se interessa por tecnologia, e principalmente quem já é dev, ' +
    'já deveria estar usando IA pra ganhar dinheiro com as três soluções da Imersão 2 a 5k, em vez de só brincar. ' +
    'O diagnóstico do slide 2 é o do próprio briefing (aprendeu a ferramenta, não aprendeu a empacotar). ' +
    'Os números foram conferidos na fonte em 17/08/2026 e um deles foi cortado por não bater: ver o cabeçalho do arquivo.',
};
