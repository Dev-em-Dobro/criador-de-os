/**
 * apps/dobro — carrossel "O Claude lembra de tudo, de graça, em 1 linha"
 * (claude-mem, a memória que atravessa sessões do Claude Code).
 *
 * ORIGEM: a aba Referências, em 19/08/2026. Quatro capturas independentes
 * apontam pro MESMO assunto, que é o sinal que a casa usa pra escolher pauta
 * (foi assim que o CLAUDE.md virou o tema nº 1):
 *   · @kyle.disruptor, reels, 10.659 comentários e 12.360 curtidas, a maior
 *     referência do mês em comentário: "Your AI doesn't need to reread your
 *     codebase every session". Ele mostra a DOR e esconde a solução atrás do
 *     comentário "REPO".
 *   · @gabrielalvess.cc, reels, 4.705 comentários: "segundo cérebro com o
 *     Claude Code".
 *   · @hasantoxr, carrossel de 5 skills: a de número 2 é justamente memória
 *     entre sessões.
 *   · @swiperightai, carrossel: "o Claude fica muito mais útil quando você para
 *     de usar como chatbot".
 *
 * POR QUE ESTE E NÃO OUTRO (19/08/2026): a semana já tinha quatro posts de
 * carreira/vaga e o dia 20 nasceu com mais um. Ferramenta com nome próprio é o
 * traço de maior lift medido nos 150 carrosséis da conta (22 seguidores
 * medianos contra 0 sem âncora), e essa é a ferramenta que a própria audiência
 * pediu quatro vezes.
 *
 * PRECISÃO — TODA AFIRMAÇÃO VERIFICÁVEL, NA FONTE PRIMÁRIA (19/08/2026):
 *   · github.com/thedotmack/claude-mem: 91,2 mil estrelas, licença Apache 2.0,
 *     versão 13.4.0. Descrição LITERAL do repositório: "Captures everything your
 *     agent does during sessions, compresses it with AI, and injects relevant
 *     context back into future sessions". Funciona com Claude Code, OpenCode,
 *     OpenClaw, Codex, Gemini, Hermes e Copilot.
 *   · docs.claude-mem.ai/installation: instala com UMA linha, exige Node 20 ou
 *     superior, e os dados ficam em `~/.claude-mem/`, com o banco em
 *     `claude-mem.db` (SQLite com índice de busca FTS5). Dá pra mudar a pasta
 *     com a variável CLAUDE_MEM_DATA_DIR. A instalação é interativa: detecta a
 *     IDE, CONFIGURA O PROVEDOR DE IA que faz o resumo e sobe o serviço.
 *   · O repositório expõe quatro ferramentas MCP (`search`, `timeline`,
 *     `get_observations`) mais a skill `mem-search`, e traz a marcação
 *     `<private>` pra deixar conteúdo sensível fora do que é gravado.
 *
 * O QUE O POST NÃO AFIRMA, DE PROPÓSITO:
 *   · Não diz que "nada sai da sua máquina". O banco fica no seu computador,
 *     isso está documentado; mas o resumo é feito COM IA, por um provedor que
 *     você escolhe na instalação, então o conteúdo passa por ele. Afirmar
 *     privacidade total seria invenção (Article IV).
 *   · "De graça" no título se refere ao plugin, que é Apache 2.0. Nenhum slide
 *     promete que o resumo não consome o plano de IA que você já usa.
 *
 * A LACUNA (memória carrossel-lacuna-do-endereco): o comando de instalação NÃO
 * aparece em slide nenhum. Ensinar o caminho inteiro e esconder só o endereço
 * rendeu 65,3 comentários por mil, contra 7,3 dos posts que põem o comando no
 * slide. O comando, as perguntas prontas e a régua de privacidade vivem no
 * presente.
 *
 * SEM TRAVESSÃO em nenhum texto de conteúdo.
 */
import type { Carrossel } from '../types';

export const claudeMem: Carrossel = {
  slug: 'claude-mem',
  // 45 caracteres exatos, o teto do traço "título curto". Tem os quatro sinais
  // que a régua mede: nome próprio (Claude), "de graça", número (1 linha) e o
  // tamanho. Nota 90/100.
  titulo: 'O Claude lembra de tudo, de graça, em 1 linha',
  gancho: 'O Claude lembra de tudo o que você já fez com ele, de graça, em 1 linha de comando',
  dataProgramada: '2026-08-20',
  refsLinks:
    'https://www.instagram.com/reel/DagrcRcnFll/ (referência do board: @kyle.disruptor, 10.659 comentários)\n' +
    'https://www.instagram.com/reel/DbvPWKGhMl4/ (@gabrielalvess.cc, "segundo cérebro", 4.705 comentários)\n' +
    'https://github.com/thedotmack/claude-mem (Apache 2.0, 91,2 mil estrelas, v13.4.0, o que ele captura)\n' +
    'https://docs.claude-mem.ai/installation (uma linha, Node 20+, banco em ~/.claude-mem/claude-mem.db)',
  /**
   * Presente do "comenta MEMÓRIA", criado no Notion em 19/08/2026. Entrega as
   * três coisas do CTA, nesta ordem: o comando de instalação com as checagens
   * de antes, as perguntas prontas que puxam o histórico (as três ferramentas
   * de busca na ordem que a documentação recomenda) e a régua de privacidade.
   *
   * O CTA do DevQuest está NO TOPO, antes do callout do presente, que é o
   * padrão dos presentes desta semana de carrinho aberto. A parte 4 diz com
   * todas as letras o que o post não podia dizer inteiro: o banco é local, mas
   * o resumo passa pelo provedor de IA escolhido na instalação.
   */
  linkPresente: 'https://app.notion.com/p/3c16dd01fb4881b69f91d388ef1a0c55',
  slides: [
    {
      variant: 'photo',
      cover: true,
      // SEM ARTE ainda: capa nasce no gradiente de fallback e espera a imagem do
      // dono (memória capa-quem-faz-e-o-dono). Quando ela chegar, sai o
      // `semFundo` e entra a `bgImage` do carrossel.
      semFundo: true,
      // O texto grande da capa é o TÍTULO do post, inteiro
      // (memória capa-repete-o-titulo). 45 caracteres pedem `tituloMenor`.
      tituloMenor: true,
      titulo: 'O Claude lembra\nde tudo, **de graça**,\nem 1 linha',
      // Subtítulo é TENSÃO, nunca argumento (memória subtitulo-da-capa-e-tensao).
      // A tensão aqui é verdadeira e é a dor da referência campeã.
      subtitulo: 'Hoje ele começa do zero toda vez que você abre.',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      topIcon: 'loop',
      eyebrow: 'O que ninguém percebe',
      // O slide 2 CONFIRMA o gancho (Fura a Bolha, regra 2): a capa promete
      // memória, e aqui está o preço de não ter.
      titulo: 'Você paga pra ele\n**reaprender** tudo',
      corpo:
        'Fecha o terminal e a conversa morre. Na próxima vez ele não sabe o que já tentou, o que deu errado, nem por que aquele arquivo ficou daquele jeito. E lê o projeto de novo, do começo.',
      calloutLabel: 'Traduzindo',
      callout: 'A parte mais cara da sessão de hoje é a que você já pagou ontem.',
      calloutDepois: true,
    },
    {
      variant: 'light',
      eyebrow: 'A ferramenta',
      // Título é o NOME e o subtítulo diz o que ele faz numa frase: é o uso do
      // `subtitulo` fora da capa (ver types.ts), igual ao slide do n8n.
      titulo: 'Chama **claude-mem**',
      subtitulo: 'Ele anota o que a IA fez e devolve isso na sessão seguinte.',
      corpo:
        'Enquanto vocês trabalham, ele registra o que o agente faz, **resume sozinho** e injeta o pedaço que importa quando a próxima sessão abre. Você não digita nada pra isso acontecer.',
      calloutLabel: 'De onde ele vem',
      callout: 'Código aberto com licença Apache 2.0 e 91 mil estrelas no GitHub. Funciona no Claude Code e também no Codex, no Gemini e no Copilot.',
      calloutDepois: true,
    },
    {
      variant: 'purple',
      // SEM **destaque** em slide roxo: o realce vira lilás e some.
      eyebrow: 'Onde a memória mora',
      titulo: 'No seu computador,\nnum arquivo só',
      corpo:
        'Tudo o que ele grava vai pra uma pasta na sua máquina, e não pra um serviço que você precisa assinar. Você abre, procura e apaga quando quiser.',
      calloutLabel: 'O endereço',
      callout: 'A pasta é ~/.claude-mem e o banco é o claude-mem.db lá dentro. Dá pra mandar pra outro lugar se você preferir.',
      calloutDepois: true,
    },
    {
      variant: 'light',
      eyebrow: 'Não é o CLAUDE.md',
      // A conta já publicou o carrossel do CLAUDE.md. Sem este slide, parte do
      // público lê os dois posts como o mesmo post.
      titulo: 'Um **manda**,\no outro **lembra**',
      versus: {
        ruim: {
          rotulo: 'CLAUDE.md',
          linhas: [
            'A regra que você escreve',
            'Você atualiza na mão',
            'Entra inteiro, toda sessão',
            'Diz como ele deve trabalhar',
          ],
        },
        bom: {
          rotulo: 'claude-mem',
          linhas: [
            'O registro do que ele fez',
            'Ele grava sozinho',
            'Volta só o que tem a ver com agora',
            'Diz o que já foi tentado',
          ],
        },
      },
      corpo: 'Um não substitui o outro. O arquivo é a lei da casa, a memória é o diário de bordo.',
    },
    {
      variant: 'dark',
      eyebrow: 'Salva esse slide',
      titulo: 'Você pergunta pro\npróprio **histórico**',
      // Quatro itens, sub de uma linha (memória slide-com-4-itens-nao-cabe-corpo).
      // Cada um é uma das ferramentas que o plugin instala, dita em português de
      // gente: search, timeline, get_observations e a injeção automática.
      itens: [
        { icone: 'eye', titulo: 'O que já tentamos aqui', sub: 'Ele procura no registro das sessões passadas' },
        { icone: 'loop', titulo: 'A linha do tempo', sub: 'A ordem do que foi feito, do começo ao fim' },
        { icone: 'code', titulo: 'Por que ficou assim', sub: 'A decisão que você tomou e já esqueceu' },
        { icone: 'ghost', titulo: 'Continua de onde parou', sub: 'O contexto entra sozinho quando a sessão abre' },
      ],
    },
    {
      variant: 'light',
      topIcon: 'ban',
      // ESTE SLIDE NENHUMA DAS REFERÊNCIAS TEM. É o que separa o post delas, e é
      // o pedido de precisão da casa: memória boa guarda coisa que você não
      // queria guardar.
      eyebrow: 'O detalhe que ninguém conta',
      titulo: 'Ele guarda o que\nvocê **não quer**',
      corpo:
        'Chave de acesso, senha e nome de cliente entram na conversa e viram registro no seu disco. E o resumo é feito por uma IA que **você escolhe na instalação**, então o conteúdo passa por ela.',
      calloutLabel: 'O que fazer antes da primeira sessão',
      callout: 'O projeto tem uma marcação pra deixar trecho sensível de fora do que é gravado. Quem decide o que marcar é você, e isso se faz antes, não depois.',
      calloutDepois: true,
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer instalar isso\nhoje, na sua máquina?',
      botao: 'Comenta MEMÓRIA 👇',
      // Três entregas concretas e diferentes entre si (memória cta-tres-entregas).
      // O comando de instalação é a lacuna: não aparece em slide nenhum.
      corpo:
        'Te mando o comando de instalação, as perguntas prontas pra puxar o histórico e a régua de privacidade pra não gravar segredo de cliente.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  // Legenda pela METADE e 5 hashtags (memória legenda-curta-e-5-hashtags). A
  // linha "Segue @devemdobro..." NÃO entra aqui: é montada na hora.
  legenda:
    'Comenta MEMÓRIA que eu te mando o comando pronto. 🧠\n\n' +
    'Todo dia a mesma cena: você abre o Claude Code, ele não faz ideia do que vocês fizeram ontem e começa a reler ' +
    'o projeto inteiro pra se situar. Você explica de novo o que já tinha explicado, e a parte cara da sessão é ' +
    'justamente essa.\n\n' +
    'O claude-mem ataca por outro lado. Ele registra o que o agente faz enquanto vocês trabalham, resume sozinho e ' +
    'devolve o pedaço que interessa quando a sessão seguinte abre. É código aberto, licença Apache 2.0, e o que ele ' +
    'grava fica numa pasta no seu computador.\n\n' +
    'O detalhe que ninguém conta: o que entra na conversa entra no registro, inclusive chave e nome de cliente. Dá ' +
    'pra marcar o que não pode ser gravado, e isso se faz antes da primeira sessão.\n\n' +
    'Comenta MEMÓRIA aqui embaixo. 👇',
  // Cinco, uma de cada função: nicho exato, categoria, alcance, público, marca.
  hashtags: 'claudecode opensource inteligenciaartificial iaparadev devemdobro',
  ctaFinal:
    'Comenta MEMÓRIA que eu te mando o comando de instalação, as perguntas prontas pra puxar o histórico e a régua de privacidade pra não gravar segredo de cliente.',
  briefing:
    'ORIGEM: a aba Referências, em 19/08/2026. Quatro capturas independentes apontam pro mesmo assunto (memória ' +
    'entre sessões do agente), que é o sinal que a casa usa pra escolher pauta: @kyle.disruptor (10.659 ' +
    'comentários, a maior do mês), @gabrielalvess.cc (4.705, "segundo cérebro"), @hasantoxr (a skill nº 2 da lista ' +
    'dele é memória) e @swiperightai ("pare de usar o Claude como chatbot").\n\n' +
    'POR QUE ESTE E NÃO OUTRO: a semana já tinha quatro posts de carreira/vaga e o dia 20 nasceu com mais um. ' +
    'Ferramenta com nome próprio é o traço de maior lift da conta (22 seguidores medianos contra 0 sem âncora), e ' +
    'essa é a ferramenta que a própria audiência pediu quatro vezes.\n\n' +
    'O QUE MUDA EM RELAÇÃO ÀS REFERÊNCIAS: o @kyle.disruptor mostra a dor e esconde a ferramenta atrás do ' +
    'comentário "REPO". Aqui a ferramenta tem nome desde o slide 3, e o que fica guardado é o passo a passo de ' +
    'instalação. Entrou também o slide 7, que nenhuma referência tem: o que essa memória grava sem você pedir.\n\n' +
    'AFIRMAÇÕES VERIFICÁVEIS E SUAS FONTES (conferidas em 19/08/2026)\n' +
    '  · "Apache 2.0", "91 mil estrelas", "funciona no Codex, Gemini e Copilot" e "registra, resume e injeta ' +
    'sozinho": github.com/thedotmack/claude-mem, descrição literal do repositório e README (v13.4.0, 91,2 mil ' +
    'estrelas).\n' +
    '  · "uma linha", "a pasta ~/.claude-mem e o banco claude-mem.db", "dá pra mandar pra outro lugar" e "a IA que ' +
    'faz o resumo você escolhe na instalação": docs.claude-mem.ai/installation. O instalador é interativo, detecta ' +
    'a IDE, configura o provedor de IA e sobe o serviço. Exige Node 20 ou superior, o que NÃO entra em slide (vai ' +
    'na parte 1 do presente).\n' +
    '  · "marcação pra deixar trecho sensível de fora": a tag <private>, documentada no repositório. O slide não ' +
    'escreve a tag, de propósito: é parte do presente.\n' +
    '  · as quatro perguntas do slide 6 são as ferramentas que o plugin instala (search, timeline, ' +
    'get_observations e a injeção automática de contexto), ditas em português de gente.\n\n' +
    'O QUE O POST NÃO AFIRMA, DE PROPÓSITO: que "nada sai da sua máquina". O banco é local, isso é documentado, ' +
    'mas o resumo é feito com IA por um provedor escolhido na instalação, então o conteúdo passa por ele. O slide ' +
    '7 diz isso com todas as letras. "De graça" no título é sobre o plugin (Apache 2.0), e nenhum slide promete ' +
    'que o resumo não consome o plano de IA que a pessoa já usa.\n\n' +
    'LACUNA (memória carrossel-lacuna-do-endereco): o comando de instalação não aparece em slide nenhum. Ensinar o ' +
    'caminho inteiro e esconder só o endereço rendeu 65,3 comentários por mil, contra 7,3 de quem põe o comando no ' +
    'slide.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): "lembra de tudo" contra "começa do zero toda vez que você abre".\n' +
    'Regra 2 (o slide 2 confirma): o preço de não ter memória, antes de qualquer solução.\n' +
    'Regra 3 (slide sozinho): cada slide se explica sem o anterior.\n' +
    'Regra 4 (salvável): o slide 6, marcado com "salva esse slide".\n' +
    'Regra 5 (CTA único): comenta MEMÓRIA.\n\n' +
    'PRESENTE: página criada no Notion em 19/08/2026 (link em linkPresente e no campo do card). Tem as três ' +
    'entregas do CTA e mais a régua de privacidade completa.\n\n' +
    'PENDENTE ANTES DE PUBLICAR: a arte de capa. Hoje a capa está no gradiente de fallback (semFundo), esperando a ' +
    'imagem do dono. Quando ela chegar, tirar o semFundo do slide 1 e apontar a bgImage do carrossel.',
};
