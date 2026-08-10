/**
 * apps/dobro — CASAMENTO entre o card do board e a medição do Instagram.
 *
 * `conteudo_desempenho.post_id` existe desde o começo, mas nasce NULL: o sync dos
 * Insights (`desempenho-sync.ts`) só conhece o `media_id` do Instagram, e o board
 * não guarda esse id (a publicação ainda é feita na mão, fora do OS). Resultado:
 * o que a IA PREVIU (`conteudo_previsoes`) e o que o post REALMENTE fez viviam em
 * duas tabelas que nunca se encontram.
 *
 * Este módulo fecha esse elo por TEXTO. A caption publicada é, na prática,
 * [linha de follow] + [legenda do card] + [hashtags], mas o sync guarda dela só
 * os primeiros 300 caracteres (`conteudo_desempenho.tema`). Então a pergunta que
 * se pode responder é a INVERSA da intuitiva: não "a legenda do card cabe na
 * caption?" (nunca cabe, a caption gravada é um pedaço), e sim "o pedaço de
 * caption que eu tenho aparece dentro da legenda deste card?".
 *
 * A medida é CONTENÇÃO dos trigramas da caption na legenda do card. Assimétrica
 * de propósito: o que sobra de texto no card não conta como diferença. Legenda
 * editada na hora de postar continua casando; post de outro assunto não casa.
 *
 * Três travas contra o falso positivo, que aqui é o erro caro (vincular a medição
 * ao card errado envenena o placar da IA e ninguém percebe):
 *   1. MARGEM: o melhor candidato tem de ganhar do segundo por uma folga clara.
 *      Dois carrosséis parecidos → não casa nenhum, fica para o humano.
 *   2. TEMPO: post publicado antes do card existir não pode ser aquele card.
 *   3. FORMATO: carrossel casa com carrossel, reels casa com reel.
 *
 * Módulo PURO de propósito (zero banco, zero rede): quem lê e escreve é o sync e
 * o script admin. Assim dá para testar o casamento com dados na mão.
 */

/** Card do board que pode ter virado um post publicado. */
export interface CardParaVincular {
  id: string;
  titulo: string | null;
  gancho: string | null;
  legenda: string | null;
  formato: string | null;
  estado: string | null;
  dataProgramada: Date | null;
  createdAt: Date | null;
}

/** Uma linha de `conteudo_desempenho` ainda sem card. */
export interface MedicaoParaVincular {
  id: string;
  /** A `caption` do post publicado (o sync grava a legenda real aqui). */
  tema: string | null;
  /** Data de publicação vinda do Instagram. */
  data: Date | null;
  /** 'carrossel' | 'reel' | 'post' | 'story'. */
  formato: string | null;
}

/** O veredito para UMA medição. */
export interface Vinculo {
  medicaoId: string;
  /** Card escolhido, ou null quando nada passou nas travas. */
  postId: string | null;
  /** Contenção do melhor candidato (0 a 1). */
  score: number;
  /** Folga para o segundo colocado (0 quando só havia um candidato). */
  margem: number;
  /** Como foi decidido: só pelo texto, ou pelo texto apoiado na data. */
  via?: 'texto' | 'texto+data';
  /**
   * O melhor candidato mesmo quando NÃO casou. É o que permite ao script mostrar
   * a zona cinza ("quase casou com o card X") para alguém decidir na mão, em vez
   * de sumir com a informação.
   */
  candidatoId?: string;
  /** Por que não casou (só quando `postId` é null) — vai para o relatório. */
  motivo?: string;
}

/**
 * PORTA 1 (só texto): 60% das sequências de 3 palavras da caption presentes no
 * card. Quando o post sai do board sem edição pesada, o par certo passa dos 90%
 * e o segundo colocado fica abaixo de 25% — a separação é limpa.
 */
const SCORE_MIN = 0.6;

/**
 * PORTA 2 (texto + data): legenda reescrita antes de publicar derruba o texto
 * para a faixa dos 30%, mas nesses casos o post saiu no MESMO dia do card. Com a
 * data por perto, um sinal de texto moderado já identifica o par. Abaixo disto
 * não se casa nada automaticamente: vira sugestão para alguém confirmar.
 */
const SCORE_MIN_COM_DATA = 0.25;
const JANELA_DIAS = 3;

/**
 * Caption curta casa por acaso com facilidade (poucas sequências, todas comuns),
 * então acima deste tamanho valem os limiares normais e abaixo dele só passa por
 * texto, e alto.
 */
const CAPTION_CURTA = 120;
const SCORE_MIN_CURTA = 0.8;

/** Folga mínima sobre o 2º colocado. Empate técnico = não casa (trava 1). */
const MARGEM_MIN = 0.15;
const MARGEM_MIN_COM_DATA = 0.1;

/** Piso para aparecer como sugestão no relatório (abaixo disso é ruído puro). */
const SCORE_SUGESTAO = 0.1;

/** Folga de fuso/atraso ao comparar a publicação com a criação do card (trava 2). */
const FOLGA_DIAS = 1;
const FOLGA_MS = FOLGA_DIAS * 24 * 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Normaliza texto para comparação: minúsculas, sem acento, sem emoji/pontuação,
 * espaços colapsados. Hashtags e @ somem junto com a pontuação, o que é bom: o
 * que resta é a prosa, que é onde mora a identidade do post.
 */
export function normalizar(texto: string | null | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // acentos (marcas de combinação do NFD)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // pontuação, emoji, #, @
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tira a chamada de follow do começo da caption ("Segue @fulano pra ...").
 *
 * Essa linha é padrão da casa: o app a monta na hora de publicar e ela NÃO existe
 * na legenda do card. Como o sync guarda só os primeiros 300 caracteres, ela come
 * um quinto do pouco texto que temos para comparar, e ainda por cima é idêntica
 * em todos os posts, o que aproxima cards que não têm nada a ver.
 */
export function semLinhaDeFollow(caption: string | null | undefined): string {
  return (caption ?? '').replace(/^\s*segue\s+@[a-z0-9_.]+[^\n.!?]*[.!?\n]?\s*/i, '');
}

/** Quantas palavras seguidas formam uma "impressão digital" do texto. */
const N_PALAVRAS = 3;

/**
 * Sequências de N palavras consecutivas do texto normalizado.
 *
 * Trigramas de CARACTERES não servem aqui: em dois textos longos de português
 * quase todo trigrama de letra aparece nos dois, e o ruído de fundo subia a 75%
 * mesmo entre posts sem nenhuma relação. Três PALAVRAS seguidas iguais, por
 * outro lado, praticamente não acontecem por acaso, e continuam batendo quando a
 * legenda foi editada aqui e ali antes de publicar.
 */
function ngramas(texto: string): Set<string> {
  const palavras = texto.split(' ').filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i + N_PALAVRAS <= palavras.length; i++) {
    set.add(palavras.slice(i, i + N_PALAVRAS).join(' '));
  }
  return set;
}

/**
 * CONTENÇÃO de `agulha` em `palheiro`: fração das sequências de 3 palavras da
 * agulha que aparecem no palheiro. 1 = a agulha inteira está lá dentro. É
 * assimétrico de propósito — o card tem muito mais texto que o pedaço de caption
 * que a gente guardou, e essa sobra não pode contar como diferença.
 */
export function contencao(agulha: string, palheiro: string): number {
  const a = ngramas(agulha);
  if (a.size === 0) return 0;
  const p = ngramas(palheiro);
  let comuns = 0;
  for (const t of a) if (p.has(t)) comuns++;
  return comuns / a.size;
}

/** 'reels' (board) e 'reel' (desempenho) são o mesmo formato com nomes diferentes. */
function formatoCompativel(card: string | null, medicao: string | null): boolean {
  const c = (card ?? '').toLowerCase();
  const m = (medicao ?? '').toLowerCase();
  if (!c || !m) return true; // sem informação, não é motivo para descartar
  if (c === 'reels' || c === 'reel') return m === 'reel' || m === 'reels';
  if (c === 'carrossel') return m === 'carrossel';
  return c === m;
}

/**
 * Todo o texto do card onde a caption pode aparecer. A legenda é o sinal forte;
 * gancho e título entram junto porque a primeira frase publicada às vezes é o
 * gancho da capa, e porque cards antigos, criados na mão antes de a geração
 * existir, não têm legenda nenhuma.
 */
function textoDoCard(card: CardParaVincular): string {
  return normalizar([card.legenda, card.gancho, card.titulo].filter(Boolean).join(' '));
}

/**
 * A data que representa o card: a programada quando existe (é a que o criador
 * escolheu para publicar), senão a de criação.
 */
function dataDoCard(card: CardParaVincular): Date | null {
  return card.dataProgramada ?? card.createdAt;
}

/** True se a publicação caiu na janela de dias em torno da data do card. */
function dataPorPerto(medicao: MedicaoParaVincular, card: CardParaVincular): boolean {
  const dCard = dataDoCard(card);
  if (!medicao.data || !dCard) return false;
  return Math.abs(medicao.data.getTime() - dCard.getTime()) <= JANELA_DIAS * DIA_MS;
}

/** Uma nota de par: o quanto o texto bate e se a data ajuda a confirmar. */
interface Nota {
  card: CardParaVincular;
  score: number;
  proximo: boolean;
}

/** Nota de UM par. `score` 0 quando o candidato é inelegível por formato/data. */
function pontuar(medicao: MedicaoParaVincular, card: CardParaVincular, caption: string): Nota {
  const zero: Nota = { card, score: 0, proximo: false };
  if (!formatoCompativel(card.formato, medicao.formato)) return zero;

  // Trava 2: um post publicado ANTES de o card existir não pode ser aquele card.
  if (medicao.data && card.createdAt) {
    if (medicao.data.getTime() < card.createdAt.getTime() - FOLGA_MS) return zero;
  }

  const alvo = textoDoCard(card);
  if (alvo.length < 20) return zero; // card sem texto suficiente para identificar
  return { card, score: contencao(caption, alvo), proximo: dataPorPerto(medicao, card) };
}

/** Decide se a melhor nota vira vínculo, e por qual porta. */
function aprovar(
  melhor: Nota,
  margem: number,
  captionCurta: boolean,
): 'texto' | 'texto+data' | null {
  if (captionCurta) {
    // Caption curta só passa por texto, e alto: não há material para mais que isso.
    return melhor.score >= SCORE_MIN_CURTA && margem >= MARGEM_MIN ? 'texto' : null;
  }
  if (melhor.score >= SCORE_MIN && margem >= MARGEM_MIN) return 'texto';
  if (melhor.proximo && melhor.score >= SCORE_MIN_COM_DATA && margem >= MARGEM_MIN_COM_DATA) {
    return 'texto+data';
  }
  return null;
}

/**
 * Decide o card de CADA medição. Recebe tudo em memória (são dezenas de linhas,
 * não milhões) e devolve um veredito por medição, inclusive os "não casou" com o
 * motivo — é esse relatório que o dry-run do script mostra antes de gravar.
 *
 * `postsJaVinculados` são os cards que já têm medição: um card publicado é UM
 * post, então ele sai da disputa e não vira ímã de tudo que se parece com ele.
 */
export function casarMedicoes(
  medicoes: MedicaoParaVincular[],
  cards: CardParaVincular[],
  postsJaVinculados: ReadonlySet<string> = new Set(),
): Vinculo[] {
  const usados = new Set(postsJaVinculados);

  // Medição mais antiga primeiro: quando duas disputam o mesmo card, quem foi
  // publicado antes tem prioridade, que é a ordem em que os cards são usados.
  const ordenadas = [...medicoes].sort(
    (a, b) => (a.data?.getTime() ?? 0) - (b.data?.getTime() ?? 0),
  );

  const out: Vinculo[] = [];
  for (const medicao of ordenadas) {
    const caption = normalizar(semLinhaDeFollow(medicao.tema));
    if (caption.length < 20) {
      out.push({ medicaoId: medicao.id, postId: null, score: 0, margem: 0, motivo: 'sem legenda no post medido' });
      continue;
    }

    const notas = cards
      .filter((c) => !usados.has(c.id))
      .map((c) => pontuar(medicao, c, caption))
      .filter((n) => n.score > 0)
      .sort((a, b) => b.score - a.score);

    if (notas.length === 0) {
      out.push({ medicaoId: medicao.id, postId: null, score: 0, margem: 0, motivo: 'nenhum card parecido' });
      continue;
    }

    const melhor = notas[0];
    const margem = melhor.score - (notas[1]?.score ?? 0);
    const via = aprovar(melhor, margem, caption.length < CAPTION_CURTA);

    if (!via) {
      out.push({
        medicaoId: medicao.id,
        postId: null,
        score: melhor.score,
        margem,
        candidatoId: melhor.score >= SCORE_SUGESTAO ? melhor.card.id : undefined,
        motivo:
          melhor.score < SCORE_SUGESTAO
            ? 'nenhum card parecido'
            : margem < MARGEM_MIN_COM_DATA
              ? 'dois cards igualmente parecidos (decidir na mão)'
              : 'parecido, mas não o bastante (decidir na mão)',
      });
      continue;
    }

    usados.add(melhor.card.id);
    out.push({ medicaoId: medicao.id, postId: melhor.card.id, score: melhor.score, margem, via });
  }
  return out;
}
