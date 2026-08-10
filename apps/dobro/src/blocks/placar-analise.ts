/**
 * apps/dobro — MOTOR do "Placar da IA": compara o que a IA previu com o que o
 * post realmente fez. Módulo PURO (zero React, zero fetch), igual a
 * `carrossel-analise.ts`: a tela mapeia as linhas de `v_conteudo_placar` e passa
 * pra cá.
 *
 * A pergunta que ele responde: **a previsão da IA vale alguma coisa?**
 *
 * Duas medidas, porque uma só engana:
 *   · ACERTO DE CLASSE — previu Forte e deu Forte? É o placar que se conta em voz
 *     alta, mas é grosseiro: errar por pouco e errar feio contam igual.
 *   · VIÉS das taxas — a média dos erros COM SINAL. É o número que ensina: se a
 *     IA erra sempre pra cima, ela é otimista e dá para corrigir a calibragem.
 *     O erro absoluto médio, ao lado, diz o tamanho do erro típico.
 *
 * Previsto e real passam pela mesma régua (`regua-desempenho.ts`) — sem isso a
 * comparação não significaria nada.
 */

import { derive, type Classe, type FormatBenchmarks } from './regua-desempenho';

type Row = Record<string, unknown>;

/**
 * Amostra mínima para levar o placar a sério. Abaixo disso os números aparecem,
 * mas marcados: com 3 posts, 2 acertos viram "67% de acerto" e não querem dizer
 * nada.
 */
export const MIN_AMOSTRA = 5;

/** O que a IA apostou, antes de publicar. */
export interface Previsto {
  classe: Classe;
  confianca: string;
  /** Taxas em %, do jeito que o modelo previu (1.2 = 1,2% do alcance). */
  salvPct: number | null;
  compPct: number | null;
  retPct: number | null;
  furaTotal: number | null;
  aposta: string | null;
  resumo: string | null;
  modelo: string | null;
  registradaEm: string | null;
}

/** O que o post fez de verdade (null enquanto não foi publicado/medido). */
export interface Real {
  classe: Classe;
  /** Mesmas taxas, em %, derivadas dos números crus pela régua. */
  salvPct: number | null;
  compPct: number | null;
  retPct: number | null;
  alcance: number | null;
  salvamentos: number | null;
  compartilhamentos: number | null;
  comentarios: number | null;
  seguidores: number | null;
  publicadoEm: string | null;
  permalink: string | null;
}

/** Uma linha do placar: uma previsão e, quando já existe, o resultado. */
export interface ParPlacar {
  id: string;
  titulo: string;
  estado: string;
  formato: string;
  previsto: Previsto;
  real: Real | null;
  /** null enquanto não há resultado. */
  acertou: boolean | null;
  /** Erro COM SINAL, em pontos percentuais: positivo = a IA previu alto demais. */
  erroSalvPp: number | null;
  erroCompPp: number | null;
}

function str(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Decimal da régua (0,014) → % da previsão (1,4). */
function paraPct(v: number | null): number | null {
  return v == null ? null : v * 100;
}

/** Erro com sinal entre previsto e real, ou null se faltar um dos lados. */
function erro(previsto: number | null, real: number | null): number | null {
  if (previsto == null || real == null) return null;
  return previsto - real;
}

/** Uma classe válida, ou 'na' quando o texto não bate com a régua. */
function classeDe(v: unknown): Classe {
  const s = str(v).toLowerCase();
  return s === 'forte' || s === 'saudavel' || s === 'abaixo' ? s : 'na';
}

/**
 * Linhas de `v_conteudo_placar` → pares comparáveis. O resultado real só existe
 * quando há alcance: sem a base das taxas não há o que comparar, mesmo que a
 * linha de medição já exista.
 */
export function mapearPares(rows: Row[], bench: Record<string, FormatBenchmarks>): ParPlacar[] {
  return rows.map((r, i) => {
    const previsto: Previsto = {
      classe: classeDe(r.classe_prevista),
      confianca: str(r.confianca) || 'media',
      salvPct: num(r.prev_salvamentos_pct),
      compPct: num(r.prev_compartilhamentos_pct),
      retPct: num(r.prev_retencao_pct),
      furaTotal: num(r.fura_total),
      aposta: str(r.aposta_principal) || null,
      resumo: str(r.resumo) || null,
      modelo: str(r.modelo) || null,
      registradaEm: str(r.registrada_em) || null,
    };

    const alcance = num(r.alcance);
    const temResultado = alcance != null && alcance > 0;
    const d = temResultado ? derive(r, bench) : null;

    const real: Real | null =
      d == null
        ? null
        : {
            classe: d.geral,
            salvPct: paraPct(d.taxaSalv),
            compPct: paraPct(d.taxaCompart),
            retPct: paraPct(d.retencao),
            alcance,
            salvamentos: num(r.salvamentos),
            compartilhamentos: num(r.compartilhamentos),
            comentarios: num(r.comentarios),
            seguidores: num(r.seguidores),
            publicadoEm: str(r.publicado_em) || null,
            permalink: str(r.permalink) || null,
          };

    return {
      id: str(r.post_id) || `par-${i}`,
      titulo: str(r.titulo) || '(sem título)',
      estado: str(r.estado) || 'rascunho',
      formato: str(r.formato).toLowerCase() || 'carrossel',
      previsto,
      real,
      // Classe 'na' de um dos lados não é acerto nem erro: é falta de referência.
      acertou:
        real == null || real.classe === 'na' || previsto.classe === 'na'
          ? null
          : real.classe === previsto.classe,
      erroSalvPp: real ? erro(previsto.salvPct, real.salvPct) : null,
      erroCompPp: real ? erro(previsto.compPct, real.compPct) : null,
    };
  });
}

/** Média dos valores não-nulos (null se não houver nenhum). */
function media(valores: Array<number | null>): number | null {
  const v = valores.filter((n): n is number => n != null && Number.isFinite(n));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

/** Um "previu X, deu Y" com quantas vezes aconteceu. */
export interface CelulaMatriz {
  prevista: Classe;
  real: Classe;
  n: number;
}

export interface ResumoPlacar {
  /** Previsões que já têm resultado medido. */
  comResultado: number;
  /** Previsões esperando o post ir ao ar (ou o sync trazer os números). */
  aguardando: number;
  acertos: number;
  /** 0 a 1, ou null sem nenhum par comparável. */
  taxaAcerto: number | null;
  /** Média COM SINAL do erro, em pontos percentuais (+ = otimista). */
  viesSalvPp: number | null;
  viesCompPp: number | null;
  /** Tamanho típico do erro, sem sinal. */
  erroAbsSalvPp: number | null;
  erroAbsCompPp: number | null;
  /** A amostra já dá para confiar? (ver MIN_AMOSTRA) */
  confiavel: boolean;
  /** Onde a IA erra: previu X e deu Y, ordenado pelo que mais acontece. */
  matriz: CelulaMatriz[];
}

/** Consolida os pares no placar. */
export function resumirPlacar(pares: ParPlacar[]): ResumoPlacar {
  const comResultado = pares.filter((p) => p.real != null);
  const comparaveis = pares.filter((p) => p.acertou != null);
  const acertos = comparaveis.filter((p) => p.acertou).length;

  const contagem = new Map<string, CelulaMatriz>();
  for (const p of comparaveis) {
    const chave = `${p.previsto.classe}|${p.real!.classe}`;
    const atual = contagem.get(chave);
    if (atual) atual.n++;
    else contagem.set(chave, { prevista: p.previsto.classe, real: p.real!.classe, n: 1 });
  }

  return {
    comResultado: comResultado.length,
    aguardando: pares.length - comResultado.length,
    acertos,
    taxaAcerto: comparaveis.length ? acertos / comparaveis.length : null,
    viesSalvPp: media(comResultado.map((p) => p.erroSalvPp)),
    viesCompPp: media(comResultado.map((p) => p.erroCompPp)),
    erroAbsSalvPp: media(comResultado.map((p) => (p.erroSalvPp == null ? null : Math.abs(p.erroSalvPp)))),
    erroAbsCompPp: media(comResultado.map((p) => (p.erroCompPp == null ? null : Math.abs(p.erroCompPp)))),
    confiavel: comparaveis.length >= MIN_AMOSTRA,
    matriz: [...contagem.values()].sort((a, b) => b.n - a.n),
  };
}

/**
 * Frase do viés, em português de gente. É a leitura que interessa: não "viés de
 * +0,8 pp", e sim "a IA está esperando mais salvamento do que o post entrega".
 */
export function lerVies(viesPp: number | null, metrica: string): string | null {
  if (viesPp == null) return null;
  const v = Math.abs(viesPp).toFixed(1).replace('.', ',');
  if (Math.abs(viesPp) < 0.1) return `A previsão de ${metrica} está no ponto.`;
  return viesPp > 0
    ? `A IA espera ${v} ponto(s) a MAIS de ${metrica} do que os posts entregam.`
    : `A IA espera ${v} ponto(s) a MENOS de ${metrica} do que os posts entregam.`;
}

/** Ordena para a tela: com resultado primeiro (mais recente), depois os que aguardam. */
export function ordenarParaTela(pares: ParPlacar[]): ParPlacar[] {
  const quando = (p: ParPlacar): number => {
    const iso = p.real?.publicadoEm ?? p.previsto.registradaEm;
    const t = iso ? new Date(iso).getTime() : 0;
    return Number.isFinite(t) ? t : 0;
  };
  return [...pares].sort((a, b) => {
    if ((a.real != null) !== (b.real != null)) return a.real != null ? -1 : 1;
    return quando(b) - quando(a);
  });
}
