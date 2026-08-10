/**
 * apps/dobro — A RÉGUA de desempenho (Forte / Saudável / Abaixo), módulo PURO.
 *
 * Era código privado de `ConteudoDesempenho.tsx`. Saiu de lá quando o Placar da
 * IA passou a precisar da MESMA classificação: previsto e real só são comparáveis
 * se passarem pela mesma régua, e duas cópias da fórmula viram, com o tempo, duas
 * medidas diferentes sem ninguém perceber.
 *
 * Continua espelhada no servidor (`server/conteudo-previsao.ts`), que classifica a
 * previsão no momento em que ela é registrada, sem browser. Mexeu numa faixa aqui,
 * mexa lá — é a única duplicação que sobrou, e é intencional (front e back).
 */

/** [limite saudável, limite forte] em decimal (0,5% = 0,005). */
export type Threshold = [number, number];

export interface FormatBenchmarks {
  compartilhamentos?: Threshold;
  salvamentos?: Threshold;
  /** Só Reel — retenção = tempo médio / duração. */
  retencao?: Threshold;
}

/**
 * Benchmarks default — exatamente as faixas de Instagram do `desempenho-guia.ts`
 * (aba "Referências" da planilha). Só as métricas que entram na CLASSIFICAÇÃO
 * automática vivem aqui (compart./salv./retenção); o guia carrega o resto pra
 * leitura humana e pra IA. Se mexer numa faixa, mexa nos dois — batem por design.
 */
export const DEFAULT_BENCH: Record<string, FormatBenchmarks> = {
  reel: { compartilhamentos: [0.005, 0.015], salvamentos: [0.003, 0.01], retencao: [0.5, 0.7] },
  carrossel: { compartilhamentos: [0.003, 0.01], salvamentos: [0.005, 0.02] },
  post: { compartilhamentos: [0.002, 0.007], salvamentos: [0.002, 0.007] },
};

export type Classe = 'forte' | 'saudavel' | 'abaixo' | 'na';

export const CLASSE_TONE: Record<Classe, { label: string; pill: string; dot: string }> = {
  forte: { label: 'Forte', pill: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', dot: 'bg-emerald-400' },
  saudavel: { label: 'Saudável', pill: 'border-sky-500/30 bg-sky-500/10 text-sky-300', dot: 'bg-sky-400' },
  abaixo: { label: 'Abaixo', pill: 'border-red-500/30 bg-red-500/10 text-red-300', dot: 'bg-red-400' },
  na: { label: 'Sem referência', pill: 'border-gray-600/40 bg-gray-700/40 text-gray-400', dot: 'bg-gray-500' },
};

type Row = Record<string, unknown>;

function str(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

/** Valor numérico ou null (aceita number ou string numérica). */
function num(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Razão a/b protegida (null se faltar dado ou b=0). */
function ratio(a: number | null, b: number | null): number | null {
  if (a == null || b == null || b === 0) return null;
  return a / b;
}

/** value < saudável → Abaixo; value >= forte → Forte; senão Saudável (igual à planilha). */
export function classify(value: number | null, bench: Threshold | undefined): Classe {
  if (bench == null || value == null || !Number.isFinite(value)) return 'na';
  const [saud, forte] = bench;
  if (value >= forte) return 'forte';
  if (value < saud) return 'abaixo';
  return 'saudavel';
}

/**
 * Classe geral a partir das sub-classes: 2+ fortes → Forte; 2+ abaixos → Abaixo;
 * senão Saudável. Num carrossel só duas métricas se aplicam, então "Forte" exige
 * as DUAS fortes — é exceção por construção, não elogio fácil.
 */
export function classeGeral(subs: Classe[]): Classe {
  const fortes = subs.filter((s) => s === 'forte').length;
  const abaixos = subs.filter((s) => s === 'abaixo').length;
  const aplicaveis = subs.filter((s) => s !== 'na').length;
  if (aplicaveis === 0) return 'na';
  if (fortes >= 2) return 'forte';
  if (abaixos >= 2) return 'abaixo';
  return 'saudavel';
}

/** Métricas derivadas + classificação de UMA linha (post). */
export interface Derived {
  taxaCurtidas: number | null;
  taxaComentarios: number | null;
  taxaCompart: number | null;
  taxaSalv: number | null;
  taxaPerfil: number | null;
  conversaoSeg: number | null;
  retencao: number | null;
  classeCompart: Classe;
  classeSalv: Classe;
  classeRetencao: Classe;
  geral: Classe;
}

/**
 * Deriva taxas e classes de uma linha com as colunas cruas de desempenho
 * (`alcance`, `salvamentos`, `compartilhamentos`, `tempo_medio_s`, `duracao_s`,
 * `formato`). Serve tanto para `v_conteudo_desempenho` quanto para o resultado
 * real dentro de `v_conteudo_placar` — as colunas têm os mesmos nomes de propósito.
 */
export function derive(row: Row, bench: Record<string, FormatBenchmarks>): Derived {
  const formato = str(row.formato).toLowerCase();
  const alcance = num(row.alcance);
  const b = bench[formato];

  const taxaCompart = ratio(num(row.compartilhamentos), alcance);
  const taxaSalv = ratio(num(row.salvamentos), alcance);
  const retencao = ratio(num(row.tempo_medio_s), num(row.duracao_s));

  const classeCompart = classify(taxaCompart, b?.compartilhamentos);
  const classeSalv = classify(taxaSalv, b?.salvamentos);
  const classeRetencao = formato === 'reel' ? classify(retencao, b?.retencao) : 'na';

  return {
    taxaCurtidas: ratio(num(row.curtidas), alcance),
    taxaComentarios: ratio(num(row.comentarios), alcance),
    taxaCompart,
    taxaSalv,
    taxaPerfil: ratio(num(row.visitas_perfil), alcance),
    conversaoSeg: ratio(num(row.seguidores), alcance),
    retencao,
    classeCompart,
    classeSalv,
    classeRetencao,
    geral: classeGeral([classeCompart, classeSalv, classeRetencao]),
  };
}
