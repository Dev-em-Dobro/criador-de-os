/**
 * apps/dobro — carrossel "Falta mão de obra no setor de tecnologia, isso pro
 * iniciante muda tudo".
 *
 * ORIGEM: card do cronograma criado pelo dono ("URGENTE - SAIU NO SBT - Falta de
 * profissionais atrasa contratações e desafia empresas de tecnologia, procura no
 * youtube SBT news"). O card não tinha roteiro, só o briefing.
 *
 * A FONTE, achada pelo título que o dono deu: SBT Brasil, "Falta de profissionais
 * atrasa contratações e desafia empresas de tecnologia", reportagem de Felipe
 * Siane, youtube.com/watch?v=FmJFozdSAYc, publicada em **09/08/2026**, oito dias
 * antes deste post. A transcrição foi baixada com yt-dlp e lida em 17/08/2026.
 *
 * ATENÇÃO, JÁ ERREI ISSO AQUI: a primeira versão deste carrossel foi escrita em
 * cima de OUTRA reportagem do SBT, de 19/06/2025 (youtube.com/watch?v=2Q9E-V6Zv0w,
 * "Empresas de tecnologia enfrentam déficit de profissionais e salários chegam a
 * R$ 20 mil"), que a busca devolve primeiro. Foi o dono quem avisou que a dele era
 * de oito dias atrás. Os fatos daquela (200 postos abertos numa empresa de 2.500
 * funcionários, salário de até R$ 20 mil, 147 mil empregos formais no ano, a fala
 * sobre modernizar sistemas antigos) SAÍRAM de todos os slides, porque são de
 * 2025 e não estão nesta reportagem.
 *
 * O QUE A REPORTAGEM DE 09/08/2026 DIZ, verbatim da transcrição:
 *   · abre no contraste: "quase um Rio de Janeiro inteiro. Essa é a quantidade de
 *     gente sem emprego no Brasil. Isso é mais de 6 milhões de pessoas", e ao
 *     mesmo tempo "um monte de empresa cheia de cadeira vazia, sem ninguém para
 *     ocupar, principalmente quando a vaga é de tecnologia";
 *   · a entrevistada de uma empresa de seguros: "a gente tá com 16 posições
 *     abertas agora aqui, profissionais de dados, profissionais de cybersegurança,
 *     profissionais que entendam de inteligência artificial. A demanda tá mais
 *     alta que o usual";
 *   · "quase tudo quanto é empresa hoje meio que virou empresa de tecnologia",
 *     inclusive a Ford, que "também tá penando para encontrar essa galera";
 *   · a pesquisa: a Ford "decidiu se juntar com o Datafolha para conversar com 250
 *     gestores de recursos humanos e tecnologia de tudo quanto é região e setor";
 *   · "a dificuldade deles era também de 98 em cada 100 empresas";
 *   · "quase 80% das empresas sinalizaram que a falta do domínio do inglês pode
 *     ser um impeditivo no momento de contratação";
 *   · "quase 40% das empresas falaram que profissionais capacitados tecnicamente
 *     deixavam de ser considerados por uma vaga por falta de competências
 *     comportamentais";
 *   · a fala do RH, que é a melhor notícia da reportagem pra quem começa: "o hard,
 *     o técnico, você vai aprender. A parte soft a gente tem bastante trabalho, a
 *     gente procura também soft skill na hora de contratar, mas a gente trabalha
 *     muito em desenvolver esses soft skills";
 *   · "72% das empresas reclamam que tá faltando conhecimento técnico na galera
 *     que se candidata e para mais da metade, quem chega procurando vaga não tem
 *     experiência suficiente";
 *   · "metade dos CNPJ leva de 1 a 2 meses para achar alguém. Em alguns casos o RH
 *     precisa de mais de 120 dias";
 *   · "num país que forma coisa só de 1/3 da demanda que realmente existe";
 *   · fecha em "para quem tá começando a universidade, é bom ficar de olho nisso".
 *
 * A PESQUISA COMPLETA (Ford e Datafolha, divulgada em abril de 2026, 250 líderes
 * de RH e TI, margem de 6 pontos e confiança de 95%) é a fonte dos percentuais que
 * a reportagem cita arredondados. Dela vêm os números exatos usados nos slides:
 * 98% com dificuldade, 72% falta de conhecimento técnico, 54% ausência de
 * experiência, 37% que reprovam candidato tecnicamente qualificado, e a divisão do
 * tempo pra fechar a vaga (14% em menos de um mês, 50% de um a dois, 24% de dois a
 * três, 11% acima de quatro).
 *
 * O ÂNGULO: a reportagem entrega a vaga (existe, sobra, e não é só em empresa de
 * tecnologia). A pesquisa entrega o filtro (o que reprova quem se candidata). O
 * post junta os dois, que é o que nenhuma das duas faz sozinha, e cai exatamente
 * na promessa do DevQuest, do zero ao primeiro emprego, sem virar anúncio.
 *
 * O GANCHO é o do dono (17/08/2026): selo vermelho de plantão "URGENTE - SAIU NO
 * SBT" e a manchete da reportagem virando o título, com a virada pro leitor colada
 * nela ("isso pro iniciante muda tudo"). O `swipe` saiu porque o subtítulo pedido
 * ("Veja como surfar essa onda") já é o convite pra deslizar, e os dois juntos
 * diziam a mesma coisa duas vezes.
 *
 * CAPA (trocada pelo dono em 17/08/2026): arte gerada por IA de um estúdio de
 * telejornal, com o apresentador na metade de cima e o rodapé preto vazio, que é
 * o formato que encaixa no template sem o texto comer a imagem. Ela substitui o
 * frame real do SBT, que ficou guardado em `capa-frame-sbt.png`. A troca também
 * derruba quase toda a exposição de direito autoral e de imagem da capa: não é
 * obra da emissora nem rosto de pessoa real. O que sobra é o print do slide 2, que
 * é frame desta reportagem, em uso ilustrativo. Ver a análise no `briefing`.
 *
 * SEM TRAVESSÃO em conteúdo. CTA sem captação para a Semana.
 */
import type { Carrossel } from '../types';

export const sbtVagas: Carrossel = {
  slug: 'sbt-vagas',
  titulo: 'Falta mão de obra no setor de tecnologia, isso pro iniciante muda tudo',
  gancho: 'Falta mão de obra no setor de tecnologia, isso pro iniciante muda tudo.',
  dataProgramada: '2026-08-17',
  refsLinks:
    'https://www.youtube.com/watch?v=FmJFozdSAYc (FONTE: SBT Brasil, 09/08/2026, reportagem de Felipe Siane, ' +
    'transcrição lida em 17/08/2026)\n' +
    'https://www.autodata.com.br/noticias/2026/04/24/98-das-empresas-relatam-dificuldade-para-contratar-profissionais-em-tecnologia/102610/ ' +
    '(a pesquisa Ford e Datafolha com os percentuais exatos)',
  bgImage: 'server/carrossel/assets/sbt-vagas/capa.png',
  /**
   * Presente do "comenta VAGA" (Notion, 17/08/2026). Entrega o que o CTA promete:
   * o link da reportagem completa e o que fazer pra se preparar pra essas vagas.
   * Traz o bloco de matrícula do DevQuest com o Builders Club junto, no padrão do
   * presente do Hermes.
   */
  linkPresente: 'https://app.notion.com/p/3bf6dd01fb48816eb3cfe1de83dcc9ab',
  slides: [
    {
      variant: 'photo',
      cover: true,
      scrim: 'bloco',
      baixo: true,
      tituloMenor: true,
      // 0.9 porque o título tem 3 linhas longas: no tamanho cheio a primeira
      // quebrava sozinha e o bloco subia pra cima da foto, onde não há contraste.
      tituloEscala: 0.9,
      eyebrow: 'URGENTE - SAIU NO SBT',
      seloUrgente: true,
      titulo: 'Falta mão de obra no setor\nde tecnologia, isso pro\niniciante muda tudo',
      subtitulo: 'Veja como surfar essa onda',
    },
    {
      variant: 'dark',
      eyebrow: 'O que saiu no SBT',
      // É a abertura da reportagem, e é o contraste que sustenta o post inteiro:
      // desemprego alto e cadeira vazia ao mesmo tempo.
      titulo: '**6 milhões** sem emprego,\ne cadeira vazia sobrando',
      corpo:
        'O repórter começa com o contraste: mais de 6 milhões de brasileiros procurando vaga, e empresa que não acha ninguém pra sentar. **Principalmente quando a vaga é de tecnologia.**',
      // Frame escolhido pelo dono (17/08/2026): mão no teclado, o editor e o
      // GitHub na tela, com o letreiro "TECNOLOGIA: FALTAM PROFISSIONAIS
      // QUALIFICADOS". Mostra o trabalho de quem ocuparia a vaga.
      imagem: 'server/carrossel/assets/sbt-vagas/dev-codigo.png',
    },
    {
      variant: 'light',
      eyebrow: 'A conta não fecha',
      titulo: '**98%** das empresas\nnão acham quem contratar',
      // Era um bloco de terminal com "menos de 1 mês  14%", e o dono não entendeu:
      // fora de um slide de comando, o retângulo preto parece saída de programa e
      // a tabela não diz de que número está falando. Virou lista, e o `subtitulo`
      // (que o template põe ANTES do bloco, ao contrário do corpo) rotula ela.
      //
      // São TRÊS linhas e não quatro: com as quatro faixas da pesquisa mais o
      // rótulo, o conteúdo empurrava a barra de progresso pra fora do slide. A
      // última linha soma as duas últimas faixas (24% de dois a três meses e 11%
      // acima de quatro), que são categorias disjuntas da mesma pergunta, então a
      // soma é legítima. As quatro aparecem separadas no presente.
      subtitulo: 'Quanto tempo levam pra contratar:',
      steps: [
        { n: '14%', titulo: 'Fecham em menos de um mês', sub: 'A minoria das empresas' },
        { n: '50%', titulo: 'Levam de um a dois meses', sub: 'Metade das vagas de tecnologia' },
        { n: '35%', titulo: 'Passam de dois meses', sub: 'Tem RH que leva mais de 120 dias' },
      ],
      corpo: 'Pesquisa Ford e Datafolha, 250 líderes de RH e TI. **A vaga fica meses aberta esperando você.**',
    },
    {
      variant: 'purple',
      eyebrow: 'A pergunta que incomoda',
      titulo: 'Se falta gente,\npor que não te chamam?',
      // A 1ª versão deste slide dizia "as empresas dizem com número o que elas não
      // estão achando, e diploma não está na lista", e o dono não entendeu: ele
      // falava de uma lista que só aparece no slide seguinte e nem respondia a
      // pergunta do título. Agora responde em uma frase e entrega o próximo slide.
      corpo:
        'Porque a empresa prefere ficar meses sem ninguém a contratar quem não dá conta.\n\nNa próxima página estão os motivos que ela usa pra cortar candidato. Faculdade não é um deles.',
    },
    {
      variant: 'light',
      eyebrow: 'Salva esse slide',
      titulo: 'O que **reprova**\no candidato',
      // O `n` leva o % junto: sem ele o número vira nota, e aqui é percentual de
      // empresas. São perguntas diferentes da mesma pesquisa, então não somam 100.
      //
      // O item do INGLÊS (quase 80% das empresas, na fala do repórter) saiu daqui a
      // pedido do dono em 17/08/2026, e do presente junto.
      steps: [
        { n: '72%', titulo: 'Falta conhecimento técnico', sub: 'O motivo mais citado pelas empresas' },
        { n: '54%', titulo: 'Falta experiência', sub: 'Não precisa ser em empresa, vale projeto seu' },
        { n: '37%', titulo: 'Corta quem sabe programar', sub: 'Por comportamento, não por código' },
      ],
      corpo: 'Cada número é **quanto das empresas cita aquele item**. Nenhum deles é faculdade.',
    },
    {
      variant: 'dark',
      eyebrow: 'Onde estão as vagas',
      titulo: 'Dados, segurança\ne **inteligência artificial**',
      itens: [
        { icone: 'layers', titulo: 'Profissionais de dados', sub: 'A primeira vaga que ela cita na reportagem' },
        // "Área que quase ninguém disputa" era invenção minha: a reportagem não
        // diz isso. Ficou o que ela diz de fato, que é a ordem em que ela cita.
        { icone: 'eye', titulo: 'Cybersegurança', sub: 'A segunda, na mesma frase dela' },
        { icone: 'ai', titulo: 'Quem entende de IA', sub: 'A demanda está mais alta que o usual' },
      ],
      // A empresa entrevistada não é de tecnologia, é de seguros. Esse é o ponto do
      // slide: a vaga não está só onde você imagina.
      callout: 'A gente tá com 16 posições abertas agora aqui. A demanda tá mais alta que o usual.',
      calloutLabel: 'A entrevistada, numa empresa de seguros',
      calloutDepois: true,
    },
    {
      variant: 'light',
      // Terceira versão deste slide. Foi bloco de terminal com trocas ("3 projetos
      // de tutorial → 1 no ar"), caiu na crítica do retângulo preto; virou lista de
      // três itens do que um bom currículo tem, e o dono disse que ficou ruim
      // porque a lista sozinha não mostra o contraste. Agora é COMPARATIVO: os
      // dois perfis lado a lado, linha por linha, cada comportamento do eterno
      // estudante de frente com o do dev contratável. As quatro linhas de cada
      // lado deixam espaço pro corpo com a fala do dono fechar o slide.
      eyebrow: 'A real',
      titulo: 'Eterno estudante ou\n**dev contratável**',
      // Uma palavra em realce por linha, no máximo: o realce pinta de roxo, e
      // linha inteira roxa vira ruído. As frases são curtas porque a coluna é
      // estreita e o pareamento só se lê quando os dois lados têm a mesma altura.
      versus: {
        ruim: {
          rotulo: 'Eterno estudante',
          linhas: [
            'Só **assiste** vídeo',
            'Termina sem **nada pronto**',
            'Projeto é a **calculadora**',
            'Para no **mínimo**',
          ],
        },
        bom: {
          rotulo: 'Dev contratável',
          linhas: [
            'Assiste e **constrói**',
            'Termina com **projeto no ar**',
            'Projeto que **resolve problema real**',
            'Sabe **explicar** o que decidiu',
          ],
        },
      },
      corpo:
        '**É o que a gente sempre fala:** projeto de tutorial some na pilha. Não dá pra ser preguiçoso aqui.',
    },
    {
      variant: 'dark',
      eyebrow: 'Não é notícia requentada',
      titulo: 'Isso foi ao ar\n**há 8 dias**',
      corpo:
        'A reportagem é de 9 de agosto e está no YouTube do **SBT News**, pra você assistir inteira e conferir cada número.\n\nE ela termina com o dado que resume tudo: **o Brasil forma só um terço da demanda que existe.**',
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer ir atrás\ndessas vagas?',
      botao: 'Comenta VAGA 👇',
      corpo:
        'Te mando o link da reportagem completa e o que fazer pra se preparar pra essas vagas, item por item do que as empresas dizem que reprova.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  // Legenda pela METADE e 5 hashtags: padrão novo pedido pelo dono em 17/08/2026.
  // O que saiu daqui está nos slides e no presente: as 16 posições da empresa de
  // seguros, o um terço da demanda e a divisão do tempo pra fechar a vaga.
  legenda:
    'Comenta VAGA que eu te mando o link da reportagem e o caminho. 📺\n\n' +
    'Saiu no SBT há 8 dias e começa com um contraste que dói: mais de 6 milhões de brasileiros sem emprego, e um ' +
    'monte de empresa com cadeira vazia que ninguém ocupa. Principalmente quando a vaga é de tecnologia.\n\n' +
    'A pesquisa que a Ford fez com o Datafolha, com 250 gestores de RH, explica por que essas vagas não fecham. ' +
    '98% das empresas têm dificuldade pra contratar. O que reprova é falta de conhecimento técnico (72%), falta de ' +
    'experiência (mais da metade) e comportamento (quase 40% cortam gente que sabe programar). Faculdade não ' +
    'aparece na lista.\n\n' +
    'E o RH entrevistado solta a frase que todo iniciante precisa ouvir: "o hard, o técnico, você vai aprender".\n\n' +
    'Comenta VAGA que eu te mando o link da reportagem completa e o que fazer pra se preparar pra essas vagas.',
  // Cinco, uma de cada função: nicho exato, categoria, alcance, intenção, marca.
  hashtags: 'vagadev programacao carreiratech primeiroemprego devemdobro',
  ctaFinal:
    'Comenta VAGA que eu te mando o link da reportagem completa e o que fazer pra se preparar pra essas vagas, ' +
    'item por item do que as empresas dizem que reprova.',
  briefing:
    'ORIGEM: card do dono, "URGENTE - SAIU NO SBT - Falta de profissionais atrasa contratações e desafia empresas ' +
    'de tecnologia, procura no youtube SBT news". O vídeo é o SBT Brasil de 09/08/2026, reportagem de Felipe ' +
    'Siane, e a transcrição foi baixada com yt-dlp e lida em 17/08/2026. Tudo que está nos slides saiu da fala da ' +
    'reportagem ou da pesquisa que ela cita, não de resumo de terceiro.\n\n' +
    'ERRO CORRIGIDO NO MEIO DO CAMINHO, pra não repetir: a primeira versão foi escrita em cima de OUTRA reportagem ' +
    'do SBT sobre o mesmo assunto, de junho de 2025, que é a que a busca devolve primeiro. Foi o dono quem avisou ' +
    'que a dele era de oito dias atrás. Os fatos daquela (200 vagas numa empresa de 2.500 funcionários, salário de ' +
    'até R$ 20 mil, 147 mil empregos no ano) saíram de todos os slides.\n\n' +
    'PAPEL NO FUNIL: preparação de matrícula, não venda. A promessa do DevQuest é do zero ao primeiro emprego, e ' +
    'este post mostra a distância entre a vaga aberta e o candidato cortado. O carrossel não vende nada: entrega ' +
    'a régua e o presente entrega o resto.\n\n' +
    'GANCHO (definido pelo dono em 17/08/2026): selo vermelho de plantão "URGENTE - SAIU NO SBT" e a manchete da ' +
    'reportagem como título, com a virada pro leitor colada nela, "isso pro iniciante muda tudo". O subtítulo é o ' +
    'convite, "Veja como surfar essa onda".\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): o selo de plantão vermelho mais a manchete, sobre arte de estúdio de telejornal.\n' +
    'Regra 2 (o slide 2 confirma): 6 milhões sem emprego e cadeira vazia sobrando, com o print da reportagem.\n' +
    'Regra 3 (slide sozinho): uma ideia por slide, cada número com a fonte dita no próprio slide.\n' +
    'Regra 4 (salvável): o slide "o que reprova o candidato", com os três percentuais.\n' +
    'Regra 5 (CTA único): comenta VAGA.\n\n' +
    'O QUE FICOU DE FORA DOS SLIDES, de propósito:\n' +
    '1) O INGLÊS (quase 80% das empresas dizem que a falta dele pode impedir a contratação). O dono tirou do slide ' +
    'e do presente em 17/08/2026.\n' +
    '2) A melhor frase da reportagem pra quem começa, dita pelo RH entrevistado: "o hard, o técnico, você vai ' +
    'aprender. A parte soft a gente trabalha muito em desenvolver". Ela está na legenda e no presente, porque no ' +
    'slide competiria com o recado de que não dá pra ser preguiçoso.\n\n' +
    'RESSALVAS REGISTRADAS, pra ter resposta pronta nos comentários:\n' +
    '1) "Faculdade não está na lista" é o que a pesquisa mostra: nenhum dos itens de reprovação citados é ' +
    'formação. Ausência na lista não é o mesmo que diploma não pesar em vaga nenhuma, e a reportagem fecha ' +
    'justamente falando com quem está começando a universidade.\n' +
    '2) Os percentuais do slide salvável são de perguntas diferentes da mesma pesquisa, e por isso não somam 100. ' +
    'O corpo do slide explica isso.\n' +
    '3) No slide do tempo, a linha de 35% soma duas faixas da pesquisa (24% de dois a três meses e 11% acima de ' +
    'quatro). São categorias disjuntas, então a soma é legítima, e as quatro aparecem separadas no presente.\n' +
    '4) A empresa entrevistada não é nomeada nos slides, só o setor dela e a função de quem fala.\n\n' +
    'DIREITO AUTORAL E DE IMAGEM (levantado pelo dono em 17/08/2026): os números e os fatos são livres, fato não ' +
    'tem proteção autoral, e a fala da entrevistada é citação curta com a fonte indicada. A capa deixou de ser ' +
    'frame do SBT e virou arte gerada, o que derrubou a maior parte da exposição. O que resta é o print do slide ' +
    '2, uso ilustrativo pequeno dentro de conteúdo que comenta a própria reportagem. Mitigações combinadas: nunca ' +
    'usar o ÁUDIO da reportagem (se virar reels o risco sobe muito, por detecção automática), não sugerir ' +
    'parceria com a emissora, e citar o SBT na legenda e no slide 8. Pendente e barato: crédito visível na arte ' +
    'da capa.\n\n' +
    'PRESENTE: pronto (Notion, em linkPresente). Entrega o que o CTA promete, o link da reportagem completa e o ' +
    'que fazer pra se preparar pra essas vagas, item por item. Sem roteiro de 30 dias e sem inglês, por decisão do ' +
    'dono. Abre e fecha com o bloco de matrícula do DevQuest, com o Builders Club junto nesta turma, e diz que no ' +
    'DevQuest a gente prepara a pessoa pra vaga e pra conseguir o emprego.',
};
