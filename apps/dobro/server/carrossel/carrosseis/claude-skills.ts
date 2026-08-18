/**
 * apps/dobro — carrossel "Seu Claude mais forte" (as 17 skills oficiais da Anthropic).
 *
 * ORIGEM: referência do @kauandeploy / @agenweb (2.006 curtidas e 2.267
 * comentários, 26/07/2026), capturada pelo Telegram. Ela abre com um organograma
 * ("Seu Claude mais forte. 42 skills reais. 7 times. Um workspace.") e gasta um
 * slide por departamento, com uma grade de seis skills em cada. O CTA é "comente
 * Claude", e é ele que explica os comentários passarem das curtidas.
 *
 * O QUE MUDA AQUI (decisão do dono, 12/08/2026): a estrutura é a mesma (capa com
 * organograma, um slide por time, grade de skills, CTA de uma palavra), mas o
 * conteúdo é o que dá pra instalar hoje e conferir na fonte. Lendo os 10 slides da
 * referência, a maior parte do "workspace de 42 skills" dela são as skills
 * OFICIAIS da Anthropic com o nome traduzido: "Testes de Webapp" é a
 * webapp-testing, "MCP Builder" é a mcp-builder, "Skill Creator" é a
 * skill-creator, "canvas-design", "web-artifacts", "algorithmic-art",
 * "slack-gif", "comunicacao-interna" (internal-comms), "planilhas" (xlsx) e
 * "docx" estão todas no repositório público. Então o nosso post entrega o que a
 * dela cobra: o repositório, os quatro comandos e o que cada skill faz.
 *
 * PRECISÃO (Article IV) — tudo conferido em 12/08/2026 na FONTE PRIMÁRIA, que é o
 * repositório github.com/anthropics/skills (API do GitHub + README + SKILL.md de
 * cada skill + .claude-plugin/marketplace.json):
 *   · 168.468 estrelas pela API, 20.1 mil forks; o print mostra "Star 168k" e
 *     "168.5k stars". Criado em 22/09/2025, último push em 07/08/2026;
 *   · 17 skills em skills/, divididas em TRÊS plugins pelo marketplace.json:
 *       document-skills (4): xlsx, docx, pptx, pdf
 *       example-skills (12): algorithmic-art, brand-guidelines, canvas-design,
 *         doc-coauthoring, frontend-design, internal-comms, mcp-builder,
 *         skill-creator, slack-gif-creator, theme-factory, web-artifacts-builder,
 *         webapp-testing
 *       claude-api (1): claude-api
 *     4 + 12 + 1 = 17. Os QUATRO TIMES do carrossel são um recorte editorial NOSSO
 *     em cima dessa lista (o README agrupa como "Creative & Design, Development &
 *     Technical, Enterprise & Communication, Document Skills"), e a contagem
 *     4/6/4/3 fecha 17. Não existe "time" declarado no repositório: o que existe
 *     são os três plugins acima, e é isso que o slide dos comandos instala;
 *   · comandos VERBATIM do README: `/plugin marketplace add anthropics/skills`
 *     registra, e cada `/plugin install <plugin>@anthropic-agent-skills` instala;
 *   · "These example skills are all already available to paid plans in Claude.ai";
 *   · LICENÇA, com cuidado: o repositório NÃO declara licença única (a API devolve
 *     license null). O README diz "Many skills in this repo are open source
 *     (Apache 2.0)" e que docx, pdf, pptx e xlsx são "source-available, not open
 *     source". O histórico do diretório confirma o Apache 2.0 nas demais ("Fill in
 *     Apache 2.0 copyright notice"). Por isso o slide fala em "nem tudo ali é open
 *     source", e não em "é tudo Apache";
 *   · o próprio README abre um Disclaimer: "These skills are provided for
 *     demonstration and educational purposes only", com o pedido de testar antes
 *     de depender delas. Isso virou o aviso honesto, e é o que separa a gente da
 *     referência, que vende as mesmas skills como produto fechado.
 *
 * As descrições de cada skill nos slides são resumo do campo `description` do
 * SKILL.md de cada uma, lido em 12/08/2026. Nada aqui foi deduzido de terceiro.
 *
 * NÃO REPETE O CARROSSEL DE 07/08 ("4 skills do Claude te deixam à frente de 99%
 * dos outros programadores"): aquele são skills de TERCEIROS (UI/UX Pro Max, Task
 * Observer, GSAP) mais o /security-review embutido. Este é o repositório OFICIAL,
 * e nenhuma das quatro de lá aparece aqui. O CTA também muda de palavra (SKILLS lá,
 * TIMES aqui) pra não misturar as duas entregas nos comentários.
 *
 * SEM TRAVESSÃO em nenhum texto de conteúdo.
 */
import type { Carrossel } from '../types';

const SHOT = 'server/carrossel/assets/claude-skills';

export const claudeSkills: Carrossel = {
  slug: 'claude-skills',
  // Título do card = texto da capa, sem quebra e sem destaque. É a chave de
  // idempotência do render: mudar aqui sem renomear o card cria card novo.
  titulo: 'Seu Claude mais forte',
  gancho: 'Seu Claude mais forte: 17 skills e 4 times pra turbinar seu desenvolvimento.',
  dataProgramada: '2026-08-12',
  refsLinks:
    'https://www.instagram.com/p/DbRaisfDmtK/ (referência: @kauandeploy / @agenweb, 2.267 comentários, "42 skills reais. 7 times. Um workspace.")\n' +
    'https://github.com/anthropics/skills (fonte primária, lida em 12/08/2026)',
  /**
   * Presente do "comenta TIMES" (Notion, 12/08/2026). Traz as 17 em tabela por
   * time (nome, o que faz), os quatro comandos, o primeiro teste de cada time (a
   * parte que não cabe em slide) e o aviso honesto sobre licença. Fecha sem o
   * convite pra Semana, pela decisão de 12/08/2026.
   *
   * LINK PRIVADO: trocar pelo `.notion.site` depois de Compartilhar > Publicar.
   */
  linkPresente: 'https://app.notion.com/p/3ba6dd01fb4881d9aa54ee608da68d4c',
  /**
   * Capa (arte do dono, 12/08/2026): o polvo da casa em versão fisiculturista,
   * fazendo duplo bíceps num pedestal preto, com o mesmo acabamento das capas
   * anteriores (laranja fosco, óculos escuros, luz de cima). É o personagem do
   * carrossel de skills de 07/08 "bombado", que é o que o título promete.
   * Já vem em 4:5 (1122×1402) e com o terço de baixo em preto chapado, então
   * `scrim: 'bloco'` basta: a rampa longa padrão subiria por cima dos braços.
   *
   * A arte do ORGANOGRAMA continua viva em `capa.png` (gerada por
   * `node server/scripts/arte-claude-skills.cjs`), com o repositório e as 168 mil
   * estrelas no topo. Ela foi a capa até esta troca, e serve de alternativa: a
   * prova que ela dava não se perdeu, porque o slide 2 abre com o print do repo.
   */
  bgImage: `${SHOT}/capa-polvo.png`,
  slides: [
    {
      variant: 'photo',
      cover: true,
      scrim: 'bloco',
      baixo: true,
      // A arte ocupa 80% da altura e encosta no topo, em vez de sangrar o slide
      // inteiro. Em tela cheia o pedestal descia até 70% e a palavra roxa do
      // título caía em cima de um tentáculo laranja, onde o roxo some. Assim o
      // polvo termina acima da faixa de texto e o título cai em preto chapado.
      // A largura sobrando fica preta e não aparece: o fundo da arte é preto.
      bgSize: 'auto 80%',
      bgPos: 'center top',
      titulo: 'Seu **Claude**\nmais forte',
      // Subtítulo de PROMESSA, escolhido pelo dono em 12/08/2026. A versão
      // anterior era de tensão ("17 skills oficiais. 4 times. E você não usa
      // nenhuma."), no espírito da memória subtitulo-da-capa-e-tensao; ele trocou
      // pelo benefício direto, que é o que a referência também faz na capa dela.
      subtitulo: '17 skills e 4 times pra turbinar\nseu desenvolvimento',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      eyebrow: 'A pasta que você nunca instalou',
      titulo: 'A Anthropic publicou\nas skills **dela**',
      corpo:
        'Skill é uma **pasta com instruções** que o Claude abre sozinho quando a tarefa pede. As oficiais são **17**, num repositório público.',
      // O print PROVA: "anthropics / skills Public", a contagem de estrelas e os
      // nomes das pastas de skill na tela. Capturado do próprio GitHub em
      // 12/08/2026, e RECORTADO DE NOVO no mesmo dia: o corte anterior começava
      // abaixo do cabeçalho, então mostrava só as pastas, sem o dono nem a
      // estrela, justamente o que o corpo do slide afirma (revisor de fato).
      //   ffmpeg -i skills-dir.png -vf "crop=2000:1330:0:120" pastas.png
      imagem: `${SHOT}/pastas.png`,
    },
    {
      variant: 'light',
      eyebrow: 'Time 01/04 · Documentos',
      titulo: 'Ele entrega o\n**arquivo pronto**',
      // Sub de UMA linha em slide de quatro itens: com duas linhas o bloco
      // encosta no rodapé e o corpo é cortado no meio (aconteceu na 1ª render).
      itens: [
        { icone: 'layers', titulo: 'xlsx', sub: 'Planilha com fórmula que calcula e gráfico' },
        { icone: 'bookmark', titulo: 'docx', sub: 'Word com sumário, comentário e alterações' },
        { icone: 'film', titulo: 'pptx', sub: 'Apresentação montada, com nota do apresentador' },
        { icone: 'eye', titulo: 'pdf', sub: 'Extrai, junta, divide, preenche e faz OCR' },
      ],
      corpo: 'É o pacote que faz ele **entregar o arquivo**, não o texto pra colar.',
    },
    {
      variant: 'dark',
      eyebrow: 'Time 02/04 · Design',
      titulo: 'Interface que não\nparece **template**',
      itens: [
        // "template", não "IA": o SKILL.md fala em "templated defaults" e não cita
        // IA em lugar nenhum (correção do revisor, 12/08/2026).
        { icone: 'laptop', titulo: 'frontend-design', sub: 'Direção visual e tipografia sem cara de template' },
        { icone: 'camera', titulo: 'canvas-design', sub: 'Pôster, capa e arte, salvos em PNG e PDF' },
        { icone: 'layers', titulo: 'theme-factory', sub: '10 temas prontos de cor e fonte' },
        { icone: 'code', titulo: 'web-artifacts-builder', sub: 'React, Tailwind e shadcn/ui num artifact só' },
      ],
      corpo: 'Faltaram duas: **algorithmic-art** (p5.js) e **brand-guidelines**.',
    },
    {
      variant: 'light',
      eyebrow: 'Time 03/04 · Dev',
      titulo: 'O time que **mexe\nno seu projeto**',
      itens: [
        { icone: 'mouse', titulo: 'webapp-testing', sub: 'Abre sua tela, clica, tira print e lê o log' },
        { icone: 'puzzle', titulo: 'mcp-builder', sub: 'Servidor MCP em Python ou TypeScript' },
        { icone: 'ai', titulo: 'claude-api', sub: 'A doc da API: modelo, preço, cache, streaming' },
        { icone: 'loop', titulo: 'skill-creator', sub: 'A skill que cria e melhora as suas skills' },
      ],
      corpo: 'A **skill-creator** é a que muda o jogo: você cria a sua.',
    },
    // REMOVIDO em 12/08/2026 (decisão do dono): era o slide roxo do time 04,
    // Comunicação (internal-comms, doc-coauthoring, slack-gif-creator).
    //
    // Os eyebrows dos outros três CONTINUAM dizendo "01/04", "02/04" e "03/04",
    // e é de propósito: os quatro times existem, e a conta 4+6+4+3 é o que fecha
    // as 17 que a capa promete. Renumerar pra 01/03 faria o carrossel prometer 17
    // e mostrar 14. Por isso o time que saiu é NOMEADO no slide dos comandos, e
    // vai completo no presente.
    {
      variant: 'dark',
      // "Salva esse post pra fazer depois": instalar exige o computador na frente,
      // então o que a pessoa guarda é o post, não o slide (padrão do graphify).
      eyebrow: 'Salva esse post pra fazer depois',
      titulo: 'Instala com\n**três linhas**',
      denso: true,
      // VERBATIM do README (linhas 36, 47 e 48), na ordem em que ele lista.
      //
      // A 4ª linha (`/plugin install claude-api@anthropic-agent-skills`) foi
      // CORTADA em 12/08/2026 pelo revisor de fato: o plugin `claude-api` existe
      // no marketplace.json e a sintaxe `plugin@marketplace` está na doc do Claude
      // Code, mas o comando montado a partir das duas peças não aparece escrito em
      // documentação nenhuma. Comando que não dá pra citar não vai pro slide, que
      // é o pior lugar da casa pra errar. A skill claude-api continua no slide 5,
      // porque ela É uma das 17: o que saiu foi só a linha de instalação dela.
      // Pra trazer de volta: rode as quatro no Claude Code e registre a data aqui.
      terminal: [
        '# dentro do Claude Code',
        '/plugin marketplace add anthropics/skills',
        '/plugin install document-skills@anthropic-agent-skills',
        '/plugin install example-skills@anthropic-agent-skills',
      ],
      // O `denso` é obrigatório aqui: a linha mais longa tem 53 caracteres e no
      // corpo normal ela estoura os 308px úteis e quebra no meio do comando.
      // A segunda frase preenche o vão que sobrava embaixo do bloco e responde a
      // pergunta óbvia de quem não usa o terminal.
      corpo:
        'A primeira linha **registra** o repositório, as outras duas instalam. Depois é só pedir pelo nome: "usa a skill de pdf pra preencher esse formulário".\n\nNão usa o Claude Code? **No site, no plano pago, elas já estão lá.**\n\nO time 04 é o de comunicação: **internal-comms**, doc-coauthoring e slack-gif-creator.',
    },
    // REMOVIDO em 12/08/2026 (decisão do dono): havia aqui um slide claro "Nem
    // tudo ali é open source", com o par licença (as quatro de documento são
    // source-available) e o disclaimer de demonstração que a Anthropic publica no
    // README. A informação NÃO se perdeu: ela continua na legenda e é uma seção
    // inteira do presente no Notion. O carrossel passa a ir do slide dos comandos
    // direto pro CTA, que é a sequência da referência.
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer as 17 numa\nlista só?',
      botao: 'Comenta TIMES 👇',
      corpo:
        'Te mando a lista das 17 com o que cada uma faz, os comandos de instalação e o que pedir pro Claude no primeiro teste de cada time.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  legenda:
    'Comenta TIMES que eu te mando a lista das 17. 🗂️\n\n' +
    'Tem gente entregando pacote de skill do Claude como se fosse produto fechado. As oficiais estão num repositório ' +
    'público da Anthropic, com 168 mil estrelas, e instalam com três linhas.\n\n' +
    'São 17, e dá pra pensar nelas como quatro times.\n\n' +
    'Documentos: xlsx, docx, pptx e pdf. É o pacote que faz ele entregar o arquivo pronto, com fórmula que calcula, ' +
    'controle de alterações, apresentação montada e PDF que ele lê, junta e preenche.\n\n' +
    'Design: frontend-design, canvas-design, theme-factory, web-artifacts-builder, algorithmic-art e ' +
    'brand-guidelines. É o time que tira a cara de template das suas telas.\n\n' +
    'Dev: webapp-testing abre sua tela no navegador e testa, mcp-builder cria servidor MCP, claude-api impede que ' +
    'ele responda de memória sobre a API da Anthropic (modelo, preço, cache, streaming) e skill-creator cria e ' +
    'melhora as suas próprias skills.\n\n' +
    'Comunicação: internal-comms, doc-coauthoring e slack-gif-creator, que é a parte chata que ninguém quer fazer.\n\n' +
    'O aviso honesto: as quatro de documento são source-available, não open source, e a própria Anthropic diz que o ' +
    'repositório é demonstração. Testa antes de depender.\n\n' +
    'Comenta TIMES aqui embaixo que eu te mando a lista das 17 com o que cada uma faz e os comandos. 👇',
  hashtags:
    'claudecode claudeskills programacao inteligenciaartificial devbr ferramentasdev iaparadevs opensource devemdobro carreiratech',
  ctaFinal:
    'Comenta TIMES que eu te mando a lista das 17 skills com o que cada uma faz, os comandos de instalação e o que ' +
    'pedir pro Claude no primeiro teste de cada time.',
  briefing:
    'FÓRMULA: a referência @kauandeploy (2.267 comentários contra 2.006 curtidas, ou seja, mais gente comentou do ' +
    'que curtiu). O que faz isso é o formato catálogo somado ao CTA de uma palavra: ela mostra 42 skills organizadas ' +
    'em 7 times e guarda o acesso atrás do comentário.\n\n' +
    'A VIRADA DESTE POST: lendo os 10 slides dela, a maior parte do "workspace" são as skills OFICIAIS da Anthropic ' +
    'com o nome traduzido (webapp-testing virou "Testes de Webapp", internal-comms virou "comunicacao-interna", e ' +
    'assim por diante). Elas estão públicas em github.com/anthropics/skills. Então a gente não copia o catálogo: ' +
    'entrega o repositório e os comandos, que é justamente o que ela cobra em troca do comentário. Isso é conteúdo ' +
    'de ferramenta com prova, a categoria que mais puxa salvamento na conta.\n\n' +
    'GANCHO: título curto com a promessa ("Seu Claude mais forte", igual à referência) e o subtítulo com os números ' +
    'mais o benefício ("17 skills e 4 times pra turbinar seu desenvolvimento"), escolha do dono em 12/08/2026. A ' +
    'versão anterior era de tensão ("E você não usa nenhuma"), no espírito da memória subtitulo-da-capa-e-tensao.\n\n' +
    'NÃO É REPETIÇÃO DO POST DE 07/08 ("4 skills do Claude"): lá são skills de terceiros (UI/UX Pro Max, Task ' +
    'Observer, GSAP) e o /security-review. Aqui é o repositório oficial, sem nenhuma repetida. O CTA mudou de ' +
    'palavra de propósito: SKILLS já foi usado lá, e misturar as duas entregas na mesma palavra bagunça a DM.\n\n' +
    'OS QUATRO TIMES SÃO RECORTE NOSSO. O repositório não declara time nenhum: ele declara TRÊS plugins ' +
    '(document-skills, example-skills, claude-api). O agrupamento em Documentos, Design, Dev e Comunicação segue as ' +
    'quatro famílias que o README cita e serve pra explicar, mas se alguém cobrar nos comentários, a resposta ' +
    'honesta é essa. A contagem 4/6/4/3 fecha as 17.\n\n' +
    'LICENÇA, o ponto delicado: o repositório NÃO tem licença única (a API do GitHub devolve license null). O ' +
    'README diz que muitas são Apache 2.0 e que as quatro de documento são source-available. Em 12/08/2026 o dono ' +
    'tirou o slide do aviso honesto, então essa ressalva vive agora na LEGENDA e no presente do Notion. Se ela for ' +
    'voltar pro carrossel um dia, o texto certo é "nem tudo ali é open source", nunca "é tudo Apache".\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): o polvo da casa em versão fisiculturista (arte do dono, 12/08/2026), no lugar do ' +
    'organograma que abria o carrossel até então. O organograma virou alternativa e continua em capa.png.\n' +
    'Regra 2 (o slide 2 confirma): o print das pastas no GitHub, com os nomes das skills na tela.\n' +
    'Regra 3 (slide sozinho): um time por slide, com no máximo quatro nomes cada.\n' +
    'Regra 4 (salvável): o slide dos comandos, com o pedido de salvar o post pra fazer no computador.\n' +
    'Regra 5 (CTA único): comenta TIMES.\n\n' +
    'PRESENTE: pronto (Notion, em linkPresente). O carrossel entrega os quatro comandos no slide salvável, e o ' +
    'presente entrega o que não cabe em slide: as 17 em tabela por time, o PRIMEIRO TESTE de cada time (a pergunta ' +
    'exata pra fazer no dia que instalar) e a tabela "se a sua dor é X, comece pela skill Y". Sem captação pra ' +
    'Semana, pela decisão de 12/08/2026.\n\n' +
    'PENDENTE ANTES DE PUBLICAR: a página do Notion está PRIVADA. Compartilhar > Publicar e trocar o link aqui e no ' +
    'campo do card pelo `.notion.site`.\n\n' +
    'REVISÃO DE FATO (12/08/2026, agente revisor-carrossel): passou nos 17 nomes de skill, na contagem (4+12+1=17), ' +
    'nas descrições contra o SKILL.md de cada uma, nas 168 mil estrelas (API: 168.486) e nas duas citações do README ' +
    '(source-available e o disclaimer de demonstração). Voltou com um bloqueante e três correções, todas aplicadas:\n' +
    '  1. o comando `/plugin install claude-api@anthropic-agent-skills` NÃO existe escrito em documentação nenhuma ' +
    '(é composição do marketplace.json com a sintaxe genérica da doc do Claude Code). A linha saiu, o slide virou ' +
    '"três linhas" e o corpo virou "as outras duas instalam". Pra trazer de volta, rode as quatro no Claude Code e ' +
    'registre a data aqui.\n' +
    '  2. o sub da frontend-design dizia "sem cara de padrão de IA"; o SKILL.md fala em "templated defaults" e não ' +
    'cita IA. Virou "sem cara de template".\n' +
    '  3. a legenda dizia que a claude-api "mantém a documentação da API na resposta". Ela é uma referência que o ' +
    'Claude lê ANTES de responder, pra não responder de memória. Frase trocada.\n' +
    '  4. a legenda dizia "tem gente VENDENDO pacote de skill". Não há fonte de dinheiro, e o link da referência está ' +
    'no card, então a frase apontava pra uma pessoa identificável. Virou "entregando".\n' +
    'O print do slide 2 também foi recortado de novo: o corte anterior não mostrava o dono nem a estrela, que é o ' +
    'que o corpo do slide afirma.',
};
