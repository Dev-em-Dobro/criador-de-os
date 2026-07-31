/**
 * apps/dobro — MOTOR DE ANÁLISE de conteúdo (Lead Score). Módulo PURO: zero React,
 * zero servidor — igual a `desempenho-guia.ts`, de propósito (testável isolado e
 * importável por tela OU futura rota de IA).
 *
 * É o coração da Story 1 do epic "Social Media Estrategista": rankeia os posts
 * medidos por um **Lead Score de funil** (captar/nutrir → lançamento) e extrai
 * padrões (por formato, por dia). Determinístico e explicável.
 *
 * COMO o sinal de cada taxa é normalizado (0..3):
 *   1) Relativo à MEDIANA do próprio perfil no mesmo formato — quando há amostra
 *      suficiente (o guia recomenda comparar com a mediana dos últimos 10–20 do
 *      mesmo formato). `sinal = clamp(taxa / mediana, 0, 3)`.
 *   2) Fallback por FAIXA de mercado (Fraco/Saudável/Forte de `IG_FAIXAS`) quando
 *      a amostra é pequena — calibração de mercado, não do perfil ainda.
 *
 * A tela mapeia as linhas cruas de `v_conteudo_desempenho` → `PostMetrics` (números
 * limpos) e passa pra cá; este módulo não conhece `Row` nem fetch.
 */

import { IG_FAIXAS } from './desempenho-guia';

/** Objetivo de negócio — inclina os pesos do score (ver `PESOS`). */
export type Objetivo = 'lead' | 'autoridade' | 'alcance' | 'equilibrado';

/** As 6 métricas que entram no Lead Score (cada uma vira taxa por alcance). */
export type Sinal =
  | 'comentarios'
  | 'visitasPerfil'
  | 'salvamentos'
  | 'compartilhamentos'
  | 'seguidores'
  | 'curtidas';

export const SINAIS: readonly Sinal[] = [
  'comentarios',
  'visitasPerfil',
  'salvamentos',
  'compartilhamentos',
  'seguidores',
  'curtidas',
];

/** Métricas de UM post, já parseadas em números (a tela faz Row → isto). */
export interface PostMetrics {
  id: string;
  /** 'reel' | 'carrossel' | 'post' | 'story' (ou outro). */
  formato: string;
  /** ISO de publicação — usado só na agregação por dia (opcional). */
  data?: string | null;
  tema?: string | null;
  alcance: number | null;
  comentarios: number | null;
  visitasPerfil: number | null;
  salvamentos: number | null;
  compartilhamentos: number | null;
  seguidores: number | null;
  curtidas: number | null;
}

/**
 * Pesos por objetivo (somam 1,0). Default = **lead** (modelo de lançamento:
 * comentários = proxy do CTA "comenta X" → DM; visitas ao perfil = porta do
 * funil; salvamentos = nutrição). Curtidas não pesam (vaidade).
 */
export const PESOS: Record<Objetivo, Record<Sinal, number>> = {
  lead: { comentarios: 0.3, visitasPerfil: 0.25, salvamentos: 0.2, compartilhamentos: 0.15, seguidores: 0.1, curtidas: 0 },
  autoridade: { comentarios: 0.1, visitasPerfil: 0.15, salvamentos: 0.4, compartilhamentos: 0.2, seguidores: 0.15, curtidas: 0 },
  alcance: { comentarios: 0.1, visitasPerfil: 0.1, salvamentos: 0.15, compartilhamentos: 0.45, seguidores: 0.2, curtidas: 0 },
  equilibrado: { comentarios: 0.2, visitasPerfil: 0.2, salvamentos: 0.2, compartilhamentos: 0.2, seguidores: 0.2, curtidas: 0 },
};

export const OBJETIVO_LABEL: Record<Objetivo, string> = {
  lead: 'Captar lead',
  autoridade: 'Autoridade',
  alcance: 'Alcance',
  equilibrado: 'Equilibrado',
};

export const SINAL_LABEL: Record<Sinal, string> = {
  comentarios: 'Comentários',
  visitasPerfil: 'Visitas ao perfil',
  salvamentos: 'Salvamentos',
  compartilhamentos: 'Compartilhamentos',
  seguidores: 'Seguidores',
  curtidas: 'Curtidas',
};

/** Mínimo de posts do MESMO formato p/ confiar na mediana do perfil. */
const MIN_AMOSTRA_FORMATO = 8;
/** Teto do sinal normalizado (evita que um outlier domine o score). */
const SINAL_MAX = 3;

/** Nossa chave de sinal → chave da métrica no guia (`IG_FAIXAS` usa snake_case). */
const CHAVE_GUIA: Record<Sinal, string> = {
  comentarios: 'comentarios',
  visitasPerfil: 'visitas_perfil',
  salvamentos: 'salvamentos',
  compartilhamentos: 'compartilhamentos',
  seguidores: 'seguidores',
  curtidas: 'curtidas',
};

const DIA_LABEL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/** Taxa de um sinal por alcance (null se sem alcance ou métrica ausente). */
function taxa(post: PostMetrics, s: Sinal): number | null {
  const alc = post.alcance;
  if (alc == null || alc <= 0) return null;
  const v = post[s];
  return v == null || !Number.isFinite(v) ? null : v / alc;
}

/** Mediana de uma lista (null se vazia). */
function mediana(nums: number[]): number | null {
  const a = nums.filter((n) => Number.isFinite(n)).sort((x, y) => x - y);
  if (!a.length) return null;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

/** Faixa [saudável, forte] daquele sinal no formato, do guia (ou null). */
function faixaDoFormato(formato: string, s: Sinal): readonly [number, number] | null {
  const grupo = IG_FAIXAS.find((g) => g.chave === formato);
  if (!grupo) return null;
  const m = grupo.metricas.find((x) => x.chave === CHAVE_GUIA[s]);
  return m ? m.faixa : null;
}

/** Taxa → sinal 0..3 usando a faixa de mercado (fraco 0..1, saudável 1..2, forte 2..3). */
function sinalPorFaixa(t: number, faixa: readonly [number, number]): number {
  const [saud, forte] = faixa;
  if (t <= 0) return 0;
  if (t < saud) return clamp(t / saud, 0, 1);
  if (t < forte) return 1 + (t - saud) / (forte - saud);
  return Math.min(SINAL_MAX, 2 + (t - forte) / forte);
}

/** Contexto de análise: medianas do perfil por formato + se a amostra dá pra confiar nelas. */
export interface Contexto {
  objetivo: Objetivo;
  medianas: Record<string, Partial<Record<Sinal, number>>>;
  usarMediana: Record<string, boolean>;
}

/** Pré-computa as medianas por formato/sinal a partir dos posts com alcance válido. */
export function construirContexto(posts: PostMetrics[], objetivo: Objetivo): Contexto {
  const porFormato = new Map<string, PostMetrics[]>();
  for (const p of posts) {
    if (p.alcance == null || p.alcance <= 0) continue;
    const f = p.formato.toLowerCase();
    let arr = porFormato.get(f);
    if (!arr) {
      arr = [];
      porFormato.set(f, arr);
    }
    arr.push(p);
  }

  const medianas: Contexto['medianas'] = {};
  const usarMediana: Contexto['usarMediana'] = {};
  for (const [f, ps] of porFormato) {
    usarMediana[f] = ps.length >= MIN_AMOSTRA_FORMATO;
    const md: Partial<Record<Sinal, number>> = {};
    for (const s of SINAIS) {
      const taxas = ps.map((p) => taxa(p, s)).filter((n): n is number => n != null);
      const m = mediana(taxas);
      if (m != null && m > 0) md[s] = m;
    }
    medianas[f] = md;
  }
  return { objetivo, medianas, usarMediana };
}

/** Sinal 0..3 de uma taxa: mediana do perfil se der; senão faixa de mercado; senão mediana crua. */
function sinalDe(t: number, formato: string, s: Sinal, ctx: Contexto): number | null {
  const medFormato = ctx.medianas[formato]?.[s];
  if (ctx.usarMediana[formato] && medFormato != null && medFormato > 0) {
    return clamp(t / medFormato, 0, SINAL_MAX);
  }
  const faixa = faixaDoFormato(formato, s);
  if (faixa) return sinalPorFaixa(t, faixa);
  // Sem amostra e sem faixa (ex.: story): usa a mediana crua se existir.
  if (medFormato != null && medFormato > 0) return clamp(t / medFormato, 0, SINAL_MAX);
  return null;
}

export type Rotulo = 'Campeão' | 'Bom' | 'Médio' | 'Fraco';

function rotuloDe(score: number): Rotulo {
  if (score >= 66) return 'Campeão';
  if (score >= 40) return 'Bom';
  if (score >= 20) return 'Médio';
  return 'Fraco';
}

/** Resultado do Lead Score de um post. */
export interface ScorePost {
  id: string;
  /** 0–100. */
  score: number;
  rotulo: Rotulo;
  /** Métrica que mais puxou o score (peso × sinal) — o "porquê". */
  taxaTop: Sinal | null;
  /** Sinal normalizado (0..3) por métrica usada. */
  sinais: Partial<Record<Sinal, number>>;
  /** Sem alcance → fora do ranking (dados insuficientes). */
  semAlcance: boolean;
}

/** Calcula o Lead Score de um post no contexto/objetivo dados. */
export function leadScore(post: PostMetrics, ctx: Contexto): ScorePost {
  if (post.alcance == null || post.alcance <= 0) {
    return { id: post.id, score: 0, rotulo: 'Fraco', taxaTop: null, sinais: {}, semAlcance: true };
  }
  const formato = post.formato.toLowerCase();
  const pesos = PESOS[ctx.objetivo];
  const sinais: Partial<Record<Sinal, number>> = {};
  const contrib: Partial<Record<Sinal, number>> = {};
  let somaPesos = 0;
  let somaPond = 0;

  for (const s of SINAIS) {
    const peso = pesos[s];
    if (peso <= 0) continue;
    const t = taxa(post, s);
    if (t == null) continue;
    const sig = sinalDe(t, formato, s, ctx);
    if (sig == null) continue;
    sinais[s] = sig;
    contrib[s] = peso * sig;
    somaPesos += peso;
    somaPond += peso * sig;
  }

  // Renormaliza pelos pesos EFETIVAMENTE usados (justo quando falta alguma métrica).
  const media = somaPesos > 0 ? somaPond / somaPesos : 0; // 0..3
  const score = Math.round((media / SINAL_MAX) * 100);

  let taxaTop: Sinal | null = null;
  let maior = -Infinity;
  for (const s of SINAIS) {
    const c = contrib[s];
    if (c != null && c > maior) {
      maior = c;
      taxaTop = s;
    }
  }

  return { id: post.id, score, rotulo: rotuloDe(score), taxaTop, sinais, semAlcance: false };
}

/** Post + seu score, para a lista rankeada. */
export interface ScoredPost extends ScorePost {
  post: PostMetrics;
}

export interface Ranking {
  /** Posts com alcance, do maior Lead Score ao menor. */
  ranked: ScoredPost[];
  /** Posts sem alcance — listados à parte (dados insuficientes). */
  semAlcance: PostMetrics[];
}

/** Rankeia todos os posts por Lead Score (desc). Empate: mantém ordem estável. */
export function rankear(posts: PostMetrics[], ctx: Contexto): Ranking {
  const ranked: ScoredPost[] = [];
  const semAlcance: PostMetrics[] = [];
  for (const post of posts) {
    const s = leadScore(post, ctx);
    if (s.semAlcance) semAlcance.push(post);
    else ranked.push({ ...s, post });
  }
  ranked.sort((a, b) => b.score - a.score);
  return { ranked, semAlcance };
}

/** Média simples de números finitos (null se vazio). */
function media(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export interface AggFormato {
  formato: string;
  n: number;
  scoreMedio: number;
}

/** Lead Score médio por formato (desc). Só posts com alcance entram. */
export function agregarPorFormato(posts: PostMetrics[], ctx: Contexto): AggFormato[] {
  const porFormato = new Map<string, number[]>();
  for (const post of posts) {
    const s = leadScore(post, ctx);
    if (s.semAlcance) continue;
    const f = post.formato.toLowerCase();
    const arr = porFormato.get(f) ?? [];
    arr.push(s.score);
    porFormato.set(f, arr);
  }
  const out: AggFormato[] = [];
  for (const [formato, scores] of porFormato) {
    out.push({ formato, n: scores.length, scoreMedio: Math.round(media(scores) ?? 0) });
  }
  return out.sort((a, b) => b.scoreMedio - a.scoreMedio);
}

export interface AggDia {
  /** 0=Dom … 6=Sáb. */
  dia: number;
  label: string;
  n: number;
  scoreMedio: number;
}

/** Lead Score médio por dia da semana (desc). Ignora posts sem `data` ou sem alcance. */
export function agregarPorDiaSemana(posts: PostMetrics[], ctx: Contexto): AggDia[] {
  const porDia = new Map<number, number[]>();
  for (const post of posts) {
    if (!post.data) continue;
    const d = new Date(post.data);
    if (Number.isNaN(d.getTime())) continue;
    const s = leadScore(post, ctx);
    if (s.semAlcance) continue;
    const dia = d.getDay();
    const arr = porDia.get(dia) ?? [];
    arr.push(s.score);
    porDia.set(dia, arr);
  }
  const out: AggDia[] = [];
  for (const [dia, scores] of porDia) {
    out.push({ dia, label: DIA_LABEL[dia], n: scores.length, scoreMedio: Math.round(media(scores) ?? 0) });
  }
  return out.sort((a, b) => b.scoreMedio - a.scoreMedio);
}

export type Confianca = 'baixa' | 'media' | 'boa';

/** Confiança da análise pela quantidade de posts com alcance válido. */
export function nivelConfianca(posts: PostMetrics[]): { nivel: Confianca; n: number } {
  const n = posts.filter((p) => p.alcance != null && p.alcance > 0).length;
  const nivel: Confianca = n < 5 ? 'baixa' : n <= 15 ? 'media' : 'boa';
  return { nivel, n };
}
