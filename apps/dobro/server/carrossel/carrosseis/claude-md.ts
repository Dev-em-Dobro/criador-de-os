/**
 * apps/dobro — carrossel "CLAUDE.md: a memória do Claude Code".
 *
 * ORIGEM (12/08/2026): é o tema nº 1 do nosso banco de referências, e o único com
 * TRÊS capturas independentes batendo na mesma tecla:
 *   @kyle.disruptor  10.659 comentários / 12.360 curtidas (reels) — o campeão absoluto
 *   @vektor.fm        1.142 comentários /  1.397 curtidas (reels)
 *   @iampascio          298 comentários /  2.007 curtidas (carrossel)
 * Três criadores diferentes, e o maior deles é o topo da lista inteira. Isso é
 * sinal de TEMA, não sorte de distribuição.
 *
 * ESTRUTURA PEGA DA REFERÊNCIA CAMPEÃ (decisão do dono, 12/08/2026): a do
 * @kyle.disruptor. Ela é um reels de 35s e faz três coisas, nesta ordem:
 *   1. abre numa DOR SILENCIOSA, algo que todo usuário sente e nem sabia que dava
 *      pra resolver ("your AI doesn't need to reread your codebase every session");
 *   2. guarda o ARTEFATO atrás do comentário, não o conceito;
 *   3. CTA de UMA palavra só ("REPO"), e legenda de duas linhas.
 *
 * O QUE ADAPTAMOS, E POR QUÊ: o reels dela pode viver só de teasing porque dura
 * 35 segundos. Carrossel que só provoca não é salvável, e slide salvável é a regra
 * 4 do Fura a Bolha. Então aqui o CONCEITO vai inteiro (o que é, os três níveis,
 * o esqueleto) e o que fica atrás do "comenta CLAUDE" é o ARQUIVO PRONTO pra colar.
 * A dor de abertura e o CTA de uma palavra são dela; o valor no meio é nosso.
 *
 * O MEIO veio do @vektor.fm: os quatro problemas que o arquivo resolve
 * (reescreve demais, ignora instrução, diz que terminou sem terminar, inventa
 * função). É a parte mais concreta das três referências e vira o slide 2, que é
 * quem confirma a promessa da capa. NÃO usamos a prova social dela ("188.000
 * estrelas", "derivado das notas do Karpathy"): é reivindicação de terceiro que a
 * gente não conferiu, e Article IV não deixa repassar.
 *
 * O ESQUELETO do slide 6 veio do @iampascio, que é o único dos três em carrossel.
 *
 * PRECISÃO (Article IV), conferido em 12/08/2026 contra o comportamento real da
 * ferramenta:
 *   · o Claude Code lê o CLAUDE.md sozinho no início da sessão, sem você mandar;
 *   · são três níveis mesmo: ~/.claude/CLAUDE.md (global do seu PC), o da raiz do
 *     projeto (vai pro git, vale pro time) e o de subpasta (entra quando ele mexe
 *     naquela área);
 *   · `/init` existe e escreve o primeiro CLAUDE.md lendo o próprio projeto.
 * SEM número de token e SEM preço, porque os dois mudam. O slide 8 é o aviso
 * honesto: o arquivo ENTRA no contexto toda sessão, então arquivo gigante é
 * contexto gasto à toa. A referência do @kyle.disruptor vende "menos token"; a
 * gente não repete isso, porque o que economiza de verdade é a ida e volta, não o
 * arquivo em si.
 *
 * SEM TRAVESSÃO em nenhum texto de conteúdo (convenção da casa).
 *
 * CAPA: `semFundo` por ora, com o gradiente JARVIS. A arte (print de editor com o
 * CLAUDE.md aberto na raiz) entra depois e é só trocar por `bgImage`.
 */
import type { Carrossel } from '../types';

export const claudeMd: Carrossel = {
  slug: 'claude-md',
  titulo: 'CLAUDE.md: a memória do Claude Code',
  gancho: 'Um arquivo de texto faz o plano de $20 do Claude render como o de $200.',
  dataProgramada: '2026-08-12',
  refsLinks:
    'https://www.instagram.com/reel/DagrcRcnFll/ (referência campeã: @kyle.disruptor, 10.659 comentários)\n' +
    'https://www.instagram.com/reel/DacJKhmIcW7/ (@vektor.fm, os 4 problemas)\n' +
    'https://www.instagram.com/p/Da7ZkTblprI/ (@iampascio, o esqueleto em carrossel)',
  /**
   * Presente do "comenta CLAUDE" (Notion, 12/08/2026): traz o CLAUDE.md modelo
   * pronto pra colar, as quatro linhas que nunca podem faltar, os três níveis, o
   * atalho /init e o aviso honesto sobre o arquivo ocupar contexto. Fecha com o
   * convite pra Semana e o GIF da landing, como todos os presentes.
   */
  linkPresente: 'https://app.notion.com/p/3ba6dd01fb4881c48241d051e85d72e3',
  /**
   * Capa gerada por `node server/scripts/arte-claude-md.cjs`: janela de editor com
   * o CLAUDE.md aberto e destacado na raiz do projeto. O objeto do post é o próprio
   * arquivo, então ele aparece em tela cheia e o texto vai no rodapé, que é o padrão
   * das capas campeãs. A arte já sai com o rodapé escurecido, por isso `scrim:'bloco'`
   * (a rampa padrão escureceria a janela de novo e velaria o código).
   */
  bgImage: 'server/carrossel/assets/claude-md/capa.png',
  slides: [
    {
      variant: 'photo',
      cover: true,
      scrim: 'bloco',
      baixo: true,
      tituloMenor: true,
      tituloEscala: 1.05,
      // GANCHO DE DINHEIRO (12/08/2026, correção do dono). A 1ª versão usava a
      // LEGENDA da referência ("sua IA relê o codebase toda sessão"), que é o
      // pedaço fraco dela. O gancho de verdade do reels está no texto da TELA
      // ("Anthropic: torne $20 em um plano de $250") e na fala do locutor. Foi
      // isso que fez 10.659 comentários, não a legenda.
      // As quebras são manuais e o nome do produto fica INTEIRO na primeira linha.
      titulo: 'Ele faz o plano de **$20**\ndo Claude render\ncomo o de $200',
      subtitulo: 'E é um arquivo de texto que você cria em 5 minutos',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      // SEM topIcon e com os subtítulos de UMA linha: com quatro itens, o ícone
      // grande no topo mais subtítulo de duas linhas estouram o slide e empurram
      // a barra de progresso pra fora do PNG (visto no 1º render, 12/08/2026).
      eyebrow: 'Onde o seu limite queima',
      // Regra 2 do Fura a Bolha: o slide 2 confirma a promessa da capa. Com o
      // gancho de dinheiro, confirmar é mostrar ONDE o plano é desperdiçado:
      // reexplicar contexto queima limite, e o retrabalho queima de novo. Os
      // quatro itens são os do @vektor.fm, e cada um deles é retrabalho pago.
      titulo: 'Você paga **duas vezes**\npela mesma explicação',
      corpo:
        'Sessão nova, memória zerada. Você reexplica a stack, o padrão e os comandos, e isso consome o seu limite. Aí vem o retrabalho, e consome de novo. É por isso que o plano parece pequeno.',
      itens: [
        { icone: 'layers', titulo: 'Reescreve demais', sub: 'Você pede um ajuste, ele refaz meio arquivo' },
        { icone: 'ban', titulo: 'Ignora o que você mandou', sub: 'A regra que você repetiu some na sessão seguinte' },
        { icone: 'ghost', titulo: 'Diz que terminou sem terminar', sub: 'Marca como pronto sem rodar o teste' },
        { icone: 'skull', titulo: 'Inventa função que não existe', sub: 'Chama um método que nunca foi escrito' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'A solução',
      titulo: 'Um arquivo chamado\n**CLAUDE.md**',
      corpo:
        'É um markdown na raiz do seu projeto. O Claude Code abre ele sozinho no começo da sessão, antes de te responder qualquer coisa. Você explica o projeto uma vez, e ele para de gastar a sua sessão descobrindo tudo de novo. Não precisa instalar nada, e o arquivo não custa nada.',
      terminal: [
        'seu-projeto/',
        '  CLAUDE.md   ✓ ele lê isso sozinho',
        '  src/',
        '  package.json',
      ],
    },
    {
      variant: 'purple',
      // Sem ** no título: em fundo roxo o realce vira lilás claro e apaga a frase
      // (aprendizado do 5-pastas).
      titulo: 'É o manual\ndo primeiro dia',
      corpo:
        'Pensa no que você contaria pra um dev que entrou hoje no time: como rodar o projeto, o que não pode mexer, qual o estilo da casa, o que já deu errado antes. É exatamente isso que vai no arquivo.',
      // Callout + terminal porque só título e corpo deixavam metade do slide
      // vazia. O terminal traz as PERGUNTAS do dev novo, não as seções do
      // arquivo: as seções são o slide 6, e repetir aqui gastaria os dois.
      calloutLabel: 'A conta que fecha',
      callout: 'Você explica uma vez. Vale pra todas as sessões, e pro time inteiro junto.',
      terminal: [
        '→ como eu rodo esse projeto?',
        '→ o que eu não posso mexer?',
        '→ qual é o padrão daqui?',
        '✓ está tudo no CLAUDE.md',
      ],
    },
    {
      variant: 'dark',
      eyebrow: 'Quase ninguém sabe',
      titulo: 'Ele funciona em\n**três níveis**',
      corpo: 'E os três carregam juntos. Dá pra ter mania sua, regra do time e regra de uma pasta só, ao mesmo tempo.',
      itens: [
        { icone: 'laptop', titulo: '~/.claude/CLAUDE.md', sub: 'Suas manias. Valem em todo projeto que você abrir nesse computador' },
        { icone: 'git', titulo: 'CLAUDE.md na raiz', sub: 'Vai junto no git, então a regra vale pro time inteiro e não só pra você' },
        { icone: 'map', titulo: 'CLAUDE.md numa subpasta', sub: 'Entra só quando ele mexe naquela área do projeto' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Salva esse slide',
      titulo: 'O **esqueleto** que funciona',
      terminal: [
        '## Comandos',
        '   como rodar, testar e subir o projeto',
        '## Stack',
        '   o que você usa, com a versão',
        '## Estilo',
        '   as regras que você cansou de repetir',
        '## Não faça',
        '   o que quebra o projeto na hora',
      ],
      corpo:
        'Quatro títulos e uma linha embaixo de cada um. Se você não sabe o que escrever numa seção, é porque ela ainda não é regra: deixa de fora e adiciona no dia que a IA errar.',
    },
    {
      variant: 'dark',
      topIcon: 'robot',
      eyebrow: 'O atalho',
      titulo: 'Não quer escrever?\nRoda **/init**',
      corpo:
        'O próprio Claude Code lê o seu projeto e escreve o primeiro CLAUDE.md sozinho. Depois você corta o que não presta e coloca as suas regras. A folha em branco é o que faz a maioria desistir antes de criar o arquivo, e esse comando tira ela da frente.',
    },
    {
      variant: 'light',
      eyebrow: 'Aviso honesto',
      titulo: 'Ele **não** é mágica',
      // O terminal entrou porque o slide era só título e corpo e ficava com mais
      // da metade vazio. Ele também dá o critério prático do que entra e do que
      // não entra, sem número: número de linha aqui seria chute.
      terminal: [
        '✓ o comando que você digita todo dia',
        '✓ a regra que você cansou de repetir',
        '✗ tutorial da linguagem colado de fora',
        '✗ regra que você nunca vai cobrar',
      ],
      corpo:
        'Ele não multiplica o seu limite. O que ele corta é o desperdício, e o desperdício é grande. E o arquivo também entra no contexto de toda sessão, então CLAUDE.md gigante é contexto gasto à toa: curto e específico ganha de longo e genérico. Ele também não impede a IA de errar, só tira do caminho o erro que vinha de você nunca ter dito nada.',
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o CLAUDE.md\npronto pra colar?',
      // Uma palavra só, como a referência campeã ("REPO"). "Comenta", não
      // "Comente": é o verbo dos CTAs que mais renderam comentário aqui.
      botao: 'Comenta CLAUDE 👇',
      // TRÊS entregas, que é o molde do nosso CTA campeão (SAGA). O slide é onde
      // a promessa precisa caber inteira: é ele que a pessoa lê antes de decidir
      // comentar. A Semana vem com o motivo colado, nunca sozinha.
      corpo:
        'Te mando o modelo pronto pra colar no seu projeto, a lista do que nunca pode faltar dentro dele e a entrada de graça na Semana, onde você aprende a programar guiado por IA.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  // LEGENDA no molde da referência campeã: ela NÃO resume o conteúdo. São duas
  // linhas, a dor e o pedido. Mantivemos a abertura curta e o fecho com a entrega
  // por extenso (regra da casa: a 1ª linha some atrás da linha de follow no
  // preview, então a promessa inteira tem que caber no fecho).
  legenda:
    'Comenta CLAUDE que eu te mando o modelo pronto. 🧠\n\n' +
    'Antes de assinar o plano caro do Claude, olha onde o seu limite está queimando. Você reexplica o projeto toda ' +
    'sessão e paga por isso, e depois paga de novo no retrabalho.\n\n' +
    'Eu demorei pra criar o meu. Achava que era firula de quem gosta de organizar pasta. Não é. É o que separa a ' +
    'IA que acerta de primeira da que reescreve meio arquivo sem ninguém pedir.\n\n' +
    'Comenta CLAUDE que eu te mando o modelo pronto pra colar no seu projeto, a lista do que nunca pode faltar ' +
    'dentro dele e o passo a passo pra entrar de graça na Semana do Zero ao Programador Contratado, onde você ' +
    'aprende a programar guiado por IA.',
  hashtags:
    'claudecode programacao devbr iaparadevs ferramentasdev inteligenciaartificial carreiratech aitools devemdobro vibecoding',
  ctaFinal:
    'Comenta CLAUDE que eu te mando o modelo de CLAUDE.md pronto pra colar no seu projeto, a lista do que nunca ' +
    'pode faltar dentro dele e o passo a passo pra entrar de graça na Semana do Zero ao Programador Contratado, ' +
    'onde você aprende a programar guiado por IA.',
  briefing:
    'FÓRMULA: a estrutura da referência @kyle.disruptor (10.659 comentários / 12.360 curtidas), que é o post com ' +
    'mais comentários de todo o nosso banco. Ela guarda o artefato atrás do comentário e fecha com CTA de uma ' +
    'palavra só. A proporção de 86 comentários por 100 curtidas mostra a palavra gatilho carregando o post.\n\n' +
    'GANCHO (corrigido em 12/08/2026 pelo dono): o gancho dela NÃO é a legenda. A legenda capturada só diz "your AI ' +
    'doesn\'t need to reread your codebase every session", que é o pedaço fraco. O gancho de verdade está no texto ' +
    'da TELA do reels ("Anthropic: torne $20 em um plano de $250") e na fala do locutor, que abre em conflito: a ' +
    'Anthropic estaria incomodada porque os vibe coders estão cancelando o plano caro. É DINHEIRO com TENSÃO, e é ' +
    'isso que fez os 10 mil comentários. Regra que fica: em reels, o gancho está no texto da tela e na fala, nunca ' +
    'na legenda, e o nosso pipeline só captura a legenda.\n\n' +
    'O QUE NÃO COPIAMOS DO GANCHO: a parte da "Anthropic irritada" é falsa e desmonta em um comentário, porque a ' +
    'própria Anthropic criou o comando /init pra gerar esse arquivo. E o valor virou $200, que é o plano Max que ' +
    'existe de verdade, no lugar dos $250 do reels. Ficou o ângulo de economia, que é o que sustenta.\n\n' +
    'EXCEÇÃO CONSCIENTE À REGRA DE PREÇO: a casa não põe preço em slide, porque preço muda. Aqui o preço É o ' +
    'gancho, então ele entra. Se a Anthropic mexer nos planos, esta capa precisa ser refeita (conferido em ' +
    '12/08/2026: Pro $20, Max $100 e $200).\n\n' +
    'POR QUE ESSE TEMA: é o único do banco com três capturas independentes (@kyle.disruptor, @vektor.fm, ' +
    '@iampascio), e o maior deles lidera o ranking geral. Sinal de tema, não de distribuição.\n\n' +
    'O QUE ADAPTAMOS: o reels dela sobrevive só de teasing porque dura 35 segundos. Carrossel que só provoca não é ' +
    'salvável, então aqui o conceito vai inteiro e o que fica atrás do "comenta CLAUDE" é o arquivo pronto. Os ' +
    'quatro erros do slide 2 vieram do @vektor.fm e o esqueleto do slide 6 do @iampascio. Descartamos a prova ' +
    'social dela ("188.000 estrelas", "derivado das notas do Karpathy"): não conferimos, então não repassamos.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): dinheiro. O plano barato rendendo como o caro, que é o gancho da referência campeã.\n' +
    'Regra 2 (o slide 2 confirma): onde o limite queima. Reexplicar contexto custa, e o retrabalho custa de novo, ' +
    'com os quatro erros concretos como prova.\n' +
    'Regra 3 (slide sozinho): uma ideia por slide, o que é, os três níveis, o esqueleto, o atalho, o aviso.\n' +
    'Regra 4 (salvável): o slide 6 é o esqueleto de quatro seções, que a pessoa copia direto.\n' +
    'Regra 5 (CTA único): comenta CLAUDE.\n\n' +
    'HIPÓTESE EM TESTE (12/08/2026) — LEGENDA CURTA vs LEGENDA EM QUATRO BLOCOS\n' +
    'A referência campeã tem legenda de duas linhas (dor + "comment REPO"), enquanto o nosso molde vigente (o da ' +
    '@cindiezhu, usado no 5-pastas) tem quatro blocos. Aqui ficou no meio: abertura curta e confissão curta, com o ' +
    'fecho de três entregas mantido, porque é o fecho que carrega a promessa inteira depois que a linha de follow ' +
    'come o preview. COMO JULGAR: comentários por 1k de alcance contra o 5-pastas, que roda o molde longo.\n\n' +
    'PRECISÃO: sem número de token e sem preço, os dois mudam. O slide 8 é o aviso honesto de que o arquivo ocupa ' +
    'contexto e não impede a IA de errar. Não repetimos o "menos token" que a referência vende: o que economiza é a ' +
    'ida e volta, não o arquivo.\n\n' +
    'CAPA: por ora sem arte, no gradiente JARVIS. A arte prevista é print de editor com o CLAUDE.md aberto na raiz, ' +
    'objeto em tela cheia com o texto no rodapé, no padrão das capas campeãs.\n\n' +
    'PRESENTE: pronto (Notion, em linkPresente). Traz o CLAUDE.md modelo pronto pra colar, as quatro linhas que ' +
    'nunca podem faltar, os três níveis, o atalho /init e o aviso honesto, e fecha com a Semana mais o GIF da ' +
    'landing. ATENÇÃO À DATA: o texto da Semana foi copiado da página do 5-pastas (10 a 16 de agosto, 20h), então ' +
    'no dia da publicação ela já está em andamento. Conferir antes de responder os comentários.',
};
