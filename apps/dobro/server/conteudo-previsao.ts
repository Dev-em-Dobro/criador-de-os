/**
 * apps/dobro — PREVISÃO de desempenho ("Placar da IA", metade PREVISTO).
 *
 * Antes de publicar, a IA registra o que ESPERA do conteúdo. Depois, quando o
 * desempenho real entrar (`conteudo_desempenho`), dá pra comparar previsto x real
 * e medir se a IA prevê bem. Esta é a metade "previsto"; a metade "real" já existe
 * (bloco "Resumo de desempenho").
 *
 * Duas decisões que fazem a previsão valer alguma coisa:
 *
 *  1. AVALIADOR INDEPENDENTE. É uma segunda chamada à Claude, com prompt de
 *     crítico, que recebe SÓ o post pronto — nunca a `analise` de quem escreveu.
 *     Se o mesmo prompt que criou o carrossel também o julgasse, todo post sairia
 *     "alta chance" e o placar não mediria nada.
 *
 *  2. A IA PREVÊ NÚMEROS, NÃO A NOTA. Ela estima as taxas (salvamentos/alcance e
 *     compartilhamentos/alcance); a CLASSE (Forte/Saudável/Abaixo) sai daqui, por
 *     código, com a mesma fórmula da tela de desempenho. Previsto e real passam
 *     pela mesma régua, então a comparação é honesta.
 *
 * Best-effort por design: se a previsão falhar, o rascunho é gravado do mesmo
 * jeito (ver `conteudo-pipeline.ts`). O post é o produto; a previsão é o extra.
 *
 * ATENÇÃO: os benchmarks e a fórmula abaixo ESPELHAM os do front:
 *   - limites: `src/manifest.ts` → aba 'desempenho' → `config.benchmarks`
 *   - fórmula: `src/blocks/ConteudoDesempenho.tsx` → `classify()` + `derive()`
 * Mexeu em um, mexa no outro, senão previsto e real deixam de ser comparáveis.
 */

import Anthropic from '@anthropic-ai/sdk';

/** Classificação da régua de desempenho (a mesma da tela). */
export type ClassePrevista = 'forte' | 'saudavel' | 'abaixo' | 'na';

/** Confiança da IA na própria previsão. */
export type Confianca = 'alta' | 'media' | 'baixa';

/** [limite saudável, limite forte] em decimal (0,5% = 0,005). */
type Faixa = [number, number];

interface BenchFormato {
  compartilhamentos?: Faixa;
  salvamentos?: Faixa;
  retencao?: Faixa;
}

/** Espelha `config.benchmarks` do manifesto (aba "Desempenho"). */
const BENCHMARKS: Record<string, BenchFormato> = {
  reel: { compartilhamentos: [0.005, 0.015], salvamentos: [0.003, 0.01], retencao: [0.5, 0.7] },
  carrossel: { compartilhamentos: [0.003, 0.01], salvamentos: [0.005, 0.02] },
  post: { compartilhamentos: [0.002, 0.007], salvamentos: [0.002, 0.007] },
};

/** O formato do board ('reels') é 'reel' na tabela de desempenho. */
function chaveBenchmark(formato: string): string {
  return formato === 'reels' ? 'reel' : formato;
}

/** value < saudável → Abaixo; value >= forte → Forte; senão Saudável (igual à tela). */
function classify(value: number | null, bench: Faixa | undefined): ClassePrevista {
  if (bench == null || value == null || !Number.isFinite(value)) return 'na';
  const [saud, forte] = bench;
  if (value >= forte) return 'forte';
  if (value < saud) return 'abaixo';
  return 'saudavel';
}

/**
 * Classe geral a partir das sub-classes: 2+ fortes → Forte; 2+ abaixos → Abaixo;
 * senão Saudável. Idêntico ao `derive()` da tela — num carrossel só compartilhamentos
 * e salvamentos são aplicáveis, então "Forte" exige os DOIS fortes.
 */
function classeGeral(subs: ClassePrevista[]): ClassePrevista {
  const fortes = subs.filter((s) => s === 'forte').length;
  const abaixos = subs.filter((s) => s === 'abaixo').length;
  const aplicaveis = subs.filter((s) => s !== 'na').length;
  if (aplicaveis === 0) return 'na';
  if (fortes >= 2) return 'forte';
  if (abaixos >= 2) return 'abaixo';
  return 'saudavel';
}

/** Rótulo humano da classe (o mesmo texto da tela). */
const CLASSE_LABEL: Record<ClassePrevista, string> = {
  forte: 'Forte',
  saudavel: 'Saudável',
  abaixo: 'Abaixo',
  na: 'Sem referência',
};

/** As 5 regras do sistema "Fura a Bolha", 0 a 5 cada (25 no total). */
export interface NotasFuraABolha {
  capaParaODedo: number;
  slide2Confirma: number;
  slideSozinho: number;
  slideSalvavel: number;
  ctaUnico: number;
}

/** A previsão registrada antes de publicar. */
export interface PrevisaoIa {
  /** Classe esperada, DERIVADA das taxas pela régua da tela (não é chute do modelo). */
  classe: ClassePrevista;
  confianca: Confianca;
  /** Taxa esperada de salvamentos sobre alcance, em % (ex.: 1.2 = 1,2%). */
  taxaSalvamentosPct: number;
  /** Taxa esperada de compartilhamentos sobre alcance, em %. */
  taxaCompartilhamentosPct: number;
  /** Retenção esperada em % (só reels; null em carrossel). */
  retencaoPct: number | null;
  /** Sub-classes por métrica, pra depois comparar métrica a métrica com o real. */
  subClasses: { salvamentos: ClassePrevista; compartilhamentos: ClassePrevista; retencao: ClassePrevista };
  /** A métrica em que a IA está apostando (o que deve puxar o resultado). */
  apostaPrincipal: string;
  /** O que pode derrubar o post. */
  riscos: string[];
  furaABolha: { total: number; notas: NotasFuraABolha; justificativa: string };
  resumo: string;
  /** ISO da hora em que a previsão foi registrada (sempre ANTES de publicar). */
  registradaEm: string;
  modelo: string;
}

/** O post a avaliar (só o que vai ao ar — nada da justificativa de quem escreveu). */
export interface PostParaPrever {
  formato: 'carrossel' | 'reels';
  titulo: string;
  gancho: string;
  slides?: Array<{ titulo: string; corpo: string }>;
  cenas?: Array<{ tempo: string; fala: string; texto_tela: string }>;
  legenda: string;
  ctaFinal: string;
  hashtags?: string;
}

/** Tool que FORÇA a saída estruturada da previsão (o modelo a chama ao terminar). */
const PREVER_TOOL: Anthropic.Tool = {
  name: 'registrar_previsao',
  description:
    'Registra a previsão de desempenho deste conteúdo. Chame UMA vez, ao terminar. ' +
    'Preveja NÚMEROS (as taxas), não a classificação: a classe Forte/Saudável/Abaixo ' +
    'é calculada pelo sistema a partir das taxas que você informar.',
  input_schema: {
    type: 'object',
    properties: {
      taxa_salvamentos_pct: {
        type: 'number',
        description:
          'Salvamentos ÷ alcance, EM PORCENTAGEM (ex.: 1.2 significa 1,2%). Este é o ' +
          'número mais importante da previsão. Use uma casa decimal.',
      },
      taxa_compartilhamentos_pct: {
        type: 'number',
        description: 'Compartilhamentos ÷ alcance, EM PORCENTAGEM (ex.: 0.4 = 0,4%).',
      },
      retencao_pct: {
        type: 'number',
        description:
          'SÓ para reels: tempo médio ÷ duração, EM PORCENTAGEM (ex.: 55 = 55%). ' +
          'Deixe de fora se o formato for carrossel.',
      },
      confianca: {
        type: 'string',
        enum: ['alta', 'media', 'baixa'],
        description:
          'Quanta confiança você tem NESTA previsão. Use "baixa" quando o conteúdo for ' +
          'de um tipo que você tem pouca base para julgar.',
      },
      aposta_principal: {
        type: 'string',
        description:
          'Uma frase: qual métrica deve puxar o resultado e por causa de QUAL elemento ' +
          'concreto do post (cite o slide/cena). Ex.: "salvamentos, pelo slide 5 com os 3 comandos".',
      },
      riscos: {
        type: 'array',
        items: { type: 'string' },
        description: '1 a 3 riscos concretos que podem derrubar o desempenho deste post.',
      },
      fura_a_bolha: {
        type: 'object',
        description:
          'Nota de 0 a 5 em cada uma das 5 regras. Em reels, avalie o equivalente ' +
          '(gancho nos 3s, confirmação, cena que se sustenta sozinha, momento salvável, CTA).',
        properties: {
          capa_para_o_dedo: {
            type: 'integer',
            description: '0-5: a capa faz PARAR o dedo? Afirmação forte e completa, com tensão, não só descrição.',
          },
          slide_2_confirma: {
            type: 'integer',
            description: '0-5: o slide 2 confirma a promessa e dá motivo pra ficar, em vez de abrir pelo problema?',
          },
          slide_sozinho: {
            type: 'integer',
            description: '0-5: cada slide tem UMA ideia e faz sentido se for printado sozinho?',
          },
          slide_salvavel: {
            type: 'integer',
            description: '0-5: existe um slide que a pessoa quer GUARDAR (cheatsheet, lista, modelo) e ele é sinalizado?',
          },
          cta_unico: {
            type: 'integer',
            description: '0-5: um único pedido no fim, de preferência palavra-gatilho de comentário?',
          },
          justificativa: {
            type: 'string',
            description: 'Duas ou três frases explicando as notas mais baixas. Seja específico.',
          },
        },
        required: [
          'capa_para_o_dedo',
          'slide_2_confirma',
          'slide_sozinho',
          'slide_salvavel',
          'cta_unico',
          'justificativa',
        ],
      },
      resumo: {
        type: 'string',
        description: 'Duas frases no máximo: o veredito e o motivo principal.',
      },
    },
    required: [
      'taxa_salvamentos_pct',
      'taxa_compartilhamentos_pct',
      'confianca',
      'aposta_principal',
      'riscos',
      'fura_a_bolha',
      'resumo',
    ],
  },
};

/** Renderiza o post como texto pro avaliador ler (só o que vai ao ar). */
function postEmTexto(p: PostParaPrever): string[] {
  const linhas = [`Formato: ${p.formato}`, `Capa/gancho: ${p.gancho}`];
  if (p.formato === 'carrossel') {
    (p.slides ?? []).forEach((s, i) => linhas.push(`Slide ${i + 1} | ${s.titulo} | ${s.corpo}`));
  } else {
    (p.cenas ?? []).forEach((c, i) =>
      linhas.push(`Cena ${i + 1} [${c.tempo}] | tela: ${c.texto_tela} | fala: ${c.fala}`),
    );
  }
  linhas.push(`Legenda: ${p.legenda}`);
  linhas.push(`CTA final: ${p.ctaFinal}`);
  if (p.hashtags) linhas.push(`Hashtags: ${p.hashtags}`);
  return linhas;
}

/**
 * Prompt do avaliador. Deliberadamente DIFERENTE do prompt que gera o post: se
 * fosse a mesma régua, o modelo premiaria o post por ter seguido as próprias
 * instruções. Aqui ele julga contra os números reais do perfil.
 */
function buildPromptPrevisao(p: PostParaPrever): string {
  const bench = BENCHMARKS[chaveBenchmark(p.formato)];
  const pct = (v: number) => `${(v * 100).toFixed(1).replace('.', ',')}%`;

  return [
    'Você é um analista CÉTICO de desempenho no Instagram. Um post do @devemdobro (ensino',
    'de programação e carreira tech) ainda NÃO foi publicado. Sua tarefa: prever como ele',
    'vai performar, para depois comparar sua previsão com o resultado real.',
    '',
    'Você NÃO escreveu este post e não sabe o que o autor pretendia. Julgue só o que está aqui.',
    '',
    '## A régua (a mesma que mede o resultado real depois)',
    'A classificação sai de duas taxas sobre o ALCANCE:',
    `- Salvamentos: abaixo de ${pct(bench?.salvamentos?.[0] ?? 0)} é fraco; ${pct(bench?.salvamentos?.[1] ?? 0)} ou mais é forte.`,
    `- Compartilhamentos: abaixo de ${pct(bench?.compartilhamentos?.[0] ?? 0)} é fraco; ${pct(bench?.compartilhamentos?.[1] ?? 0)} ou mais é forte.`,
    ...(bench?.retencao
      ? [`- Retenção (só reels): abaixo de ${pct(bench.retencao[0])} é fraco; ${pct(bench.retencao[1])} ou mais é forte.`]
      : []),
    'Para ser "Forte" no geral, o post precisa ser forte em DUAS métricas. Ou seja: Forte é',
    'exceção, não regra. A maior parte do que se publica fica em "Saudável".',
    '',
    '## Calibragem (não seja simpático)',
    '- Se você prever "vai bem" para todo post, sua previsão não vale nada. O objetivo é ACERTAR,',
    '  não elogiar. Prever "Abaixo" e acertar vale tanto quanto prever "Forte" e acertar.',
    '- O que historicamente puxa salvamento neste perfil: FERRAMENTA concreta (grátis, open source,',
    '  roda no PC, com nome próprio) e CONCEITO que destrava iniciante (Git, array em JS, lógica).',
    '- O que historicamente rende pouco: motivacional, opinião genérica, "contrarian" sem dado,',
    '  promessa vaga. Se o post for disso, preveja taxas baixas mesmo que o texto esteja bonito.',
    '- Texto bem escrito não é sinal de desempenho. O que gera salvamento é o post ter algo que a',
    '  pessoa QUER GUARDAR; o que gera compartilhamento é ela querer marcar alguém.',
    '- Não invente números do perfil que você não tem. Estime a partir da régua acima.',
    '',
    '## O post',
    ...postEmTexto(p),
    '',
    '## O que entregar',
    'Chame `registrar_previsao` UMA vez. Preveja as TAXAS (a classe é calculada pelo sistema),',
    'dê as notas do Fura a Bolha, a aposta principal e os riscos.',
    'Em nenhum campo use travessão "—" nem meia-risca "–": escreva com vírgula, ponto ou dois-pontos.',
  ].join('\n');
}

/** Remove travessão/meia-risca (cara de texto de IA) e limpa a pontuação resultante. */
function semTravessao(s: string): string {
  return (s ?? '')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s*,\s*,/g, ',')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/,\s*([.!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s,]+$/g, '')
    .trim();
}

/** Número finito ou fallback (o modelo pode devolver string ou nada). */
function num(v: unknown, fallback: number): number {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Inteiro preso na faixa 0-5 (as notas do Fura a Bolha). */
function nota(v: unknown): number {
  return Math.max(0, Math.min(5, Math.round(num(v, 0))));
}

/** Modelo usado no avaliador. Efeito e limite abaixo mantêm a chamada curta. */
const MODELO_PREVISAO = 'claude-opus-5';

/** Teto de espera da previsão. Estoura → sem previsão, o rascunho segue normal. */
const TIMEOUT_PREVISAO_MS = 25_000;

/** Cru que a tool devolve (validado/normalizado logo em seguida). */
interface PrevisaoBruta {
  taxa_salvamentos_pct?: unknown;
  taxa_compartilhamentos_pct?: unknown;
  retencao_pct?: unknown;
  confianca?: unknown;
  aposta_principal?: unknown;
  riscos?: unknown;
  fura_a_bolha?: Record<string, unknown>;
  resumo?: unknown;
}

/**
 * Prevê o desempenho de UM post (uma chamada à Claude) e devolve a previsão já
 * classificada pela régua. Lança em caso de falha — quem chama decide se ignora.
 */
export async function preverDesempenho(post: PostParaPrever, apiKey: string): Promise<PrevisaoIa> {
  const client = new Anthropic({ apiKey });

  const res = await client.messages.create(
    {
      model: MODELO_PREVISAO,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      tools: [PREVER_TOOL],
      tool_choice: { type: 'tool', name: 'registrar_previsao' },
      messages: [{ role: 'user', content: buildPromptPrevisao(post) }],
    },
    { timeout: TIMEOUT_PREVISAO_MS },
  );

  if (res.stop_reason === 'refusal') throw new Error('O modelo recusou avaliar este conteúdo.');

  const bloco = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'registrar_previsao',
  );
  if (!bloco) throw new Error('O modelo terminou sem registrar a previsão estruturada.');

  return normalizarPrevisao(bloco.input as PrevisaoBruta, post.formato);
}

/** Valida a saída da tool e DERIVA a classe pela régua (previsto e real, mesma fórmula). */
function normalizarPrevisao(raw: PrevisaoBruta, formato: 'carrossel' | 'reels'): PrevisaoIa {
  const bench = BENCHMARKS[chaveBenchmark(formato)];

  const taxaSalvamentosPct = num(raw.taxa_salvamentos_pct, 0);
  const taxaCompartilhamentosPct = num(raw.taxa_compartilhamentos_pct, 0);
  const retencaoPct = formato === 'reels' && raw.retencao_pct != null ? num(raw.retencao_pct, 0) : null;

  // As taxas chegam em %, os benchmarks vivem em decimal.
  const salvamentos = classify(taxaSalvamentosPct / 100, bench?.salvamentos);
  const compartilhamentos = classify(taxaCompartilhamentosPct / 100, bench?.compartilhamentos);
  const retencao =
    formato === 'reels' && retencaoPct != null ? classify(retencaoPct / 100, bench?.retencao) : 'na';

  const f = raw.fura_a_bolha ?? {};
  const notas: NotasFuraABolha = {
    capaParaODedo: nota(f.capa_para_o_dedo),
    slide2Confirma: nota(f.slide_2_confirma),
    slideSozinho: nota(f.slide_sozinho),
    slideSalvavel: nota(f.slide_salvavel),
    ctaUnico: nota(f.cta_unico),
  };

  const confiancaRaw = String(raw.confianca ?? '').toLowerCase();
  const confianca: Confianca =
    confiancaRaw === 'alta' || confiancaRaw === 'baixa' ? confiancaRaw : 'media';

  return {
    classe: classeGeral([salvamentos, compartilhamentos, retencao]),
    confianca,
    taxaSalvamentosPct,
    taxaCompartilhamentosPct,
    retencaoPct,
    subClasses: { salvamentos, compartilhamentos, retencao },
    apostaPrincipal: semTravessao(String(raw.aposta_principal ?? '')),
    riscos: Array.isArray(raw.riscos)
      ? raw.riscos.map((r) => semTravessao(String(r))).filter(Boolean).slice(0, 3)
      : [],
    furaABolha: {
      total: Object.values(notas).reduce((a, b) => a + b, 0),
      notas,
      justificativa: semTravessao(String(f.justificativa ?? '')),
    },
    resumo: semTravessao(String(raw.resumo ?? '')),
    registradaEm: new Date().toISOString(),
    modelo: MODELO_PREVISAO,
  };
}

/** dd/mm/aaaa (sem depender de locale do runtime). */
function dataBr(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "1,2%" a partir de 1.2. */
function pctBr(v: number): string {
  return `${v.toFixed(1).replace('.', ',')}%`;
}

/**
 * Formata a previsão como texto do `briefing` do card, no mesmo formato do 1º
 * ciclo (feito à mão no elevator-saga). Fica visível no popup do editor, e é
 * ele que a gente compara com os Insights quando o post sair.
 */
export function formatarPrevisaoBriefing(p: PrevisaoIa): string {
  const n = p.furaABolha.notas;
  const linhas = [
    `🔮 PREVISÃO DA IA (registrada em ${dataBr(p.registradaEm)}, ANTES de publicar)`,
    `Classe esperada: ${CLASSE_LABEL[p.classe]} (confiança ${p.confianca})`,
    `Números previstos: salvamentos ${pctBr(p.taxaSalvamentosPct)} do alcance, ` +
      `compartilhamentos ${pctBr(p.taxaCompartilhamentosPct)} do alcance` +
      (p.retencaoPct != null ? `, retenção ${pctBr(p.retencaoPct)}` : ''),
    `Fura a Bolha: ${p.furaABolha.total}/25 ` +
      `(capa ${n.capaParaODedo}, slide 2 ${n.slide2Confirma}, slide sozinho ${n.slideSozinho}, ` +
      `salvável ${n.slideSalvavel}, CTA ${n.ctaUnico})`,
    `Aposta principal: ${p.apostaPrincipal}`,
  ];
  if (p.riscos.length) linhas.push(`Riscos: ${p.riscos.join(' | ')}`);
  if (p.furaABolha.justificativa) linhas.push(`Notas: ${p.furaABolha.justificativa}`);
  if (p.resumo) linhas.push(`Veredito: ${p.resumo}`);
  linhas.push(
    '',
    '⏳ INSIGHTS A VERIFICAR depois de publicar: alcance, salvamentos, compartilhamentos e ' +
      'comentários com a palavra-gatilho. Lançar no "Resumo de desempenho" e comparar previsto x real.',
    `(previsão automática, modelo ${p.modelo}, régua igual à do Resumo de desempenho)`,
  );
  return linhas.join('\n');
}
