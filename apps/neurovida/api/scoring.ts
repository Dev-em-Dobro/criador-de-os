/**
 * apps/neurovida — motor de ICP score GENÉRICO (config-driven).
 *
 * A "máquina" (parse/dedup/merge/tiers) é do produto; a RÉGUA (quais campos da
 * pesquisa pontuam, com que peso, e os cortes de tier) é do NEGÓCIO e vem do
 * MANIFESTO (config do bloco). Assim cada cliente pontua com o próprio ICP —
 * a fórmula da DevQuest (curso de programação) não é chumbada aqui.
 *
 * Portado do padrão do Dobro OS (`utils/leadQuality.ts`), mas parametrizado:
 * em vez de funções fixas por pergunta, uma lista de regras declarativas.
 */

export interface ScoreMatch {
  /** Casa se o valor CONTÉM esta string (case-insensitive). */
  contains?: string;
  /** Casa se o valor é IGUAL a esta string (case-insensitive). */
  equals?: string;
  /** Pontos concedidos quando casa (primeira regra que casa vence). */
  points: number;
}

export interface ScoreRule {
  /** Campo da pesquisa (casa por "contém" no nome da coluna — tolera cabeçalhos longos). */
  field: string;
  /** Rótulo opcional (documentação). */
  label?: string;
  /** Teto de pontos desta regra (opcional). */
  max?: number;
  /** Pontos quando nenhuma opção casa (default 0). */
  default?: number;
  /** Opções de pontuação (primeira que casa vence). */
  match: ScoreMatch[];
}

export interface TierCut {
  tier: string;
  min: number;
}

export interface ScoringSpec {
  rules: ScoreRule[];
  /** Cortes de tier (ex.: S≥60, A≥40, B≥20, C≥0). */
  tiers: TierCut[];
  /** Teto do score (default 100). */
  maxScore?: number;
}

/** Valida (defensivamente) o formato da spec vinda do front. */
export function isScoringSpec(v: unknown): v is ScoringSpec {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  if (!Array.isArray(s.rules) || !Array.isArray(s.tiers)) return false;
  const rulesOk = s.rules.every(
    (r) => r && typeof (r as ScoreRule).field === 'string' && Array.isArray((r as ScoreRule).match),
  );
  const tiersOk = s.tiers.every(
    (t) => t && typeof (t as TierCut).tier === 'string' && typeof (t as TierCut).min === 'number',
  );
  return rulesOk && tiersOk && s.tiers.length > 0;
}

/** Valor de um campo na linha de pesquisa: casa a coluna por "contém" (ci). */
function fieldValue(raw: Record<string, string>, field: string): string {
  const f = field.toLowerCase();
  // 1) chave exata; 2) chave que contém `field`.
  if (raw[field] !== undefined) return raw[field];
  for (const [k, val] of Object.entries(raw)) {
    if (k.toLowerCase().includes(f)) return val;
  }
  return '';
}

function applyRule(value: string, rule: ScoreRule): number {
  const v = value.toLowerCase();
  for (const m of rule.match) {
    if (m.equals !== undefined && v === m.equals.toLowerCase()) return capped(m.points, rule.max);
    if (m.contains !== undefined && v.includes(m.contains.toLowerCase())) return capped(m.points, rule.max);
  }
  return rule.default ?? 0;
}

function capped(points: number, max?: number): number {
  return typeof max === 'number' ? Math.min(points, max) : points;
}

/** Score 0..maxScore a partir das respostas de pesquisa (ou 0 se sem pesquisa). */
export function computeScore(raw: Record<string, string> | null, spec: ScoringSpec): number {
  if (!raw) return 0;
  const total = spec.rules.reduce((sum, rule) => sum + applyRule(fieldValue(raw, rule.field), rule), 0);
  const max = spec.maxScore ?? 100;
  return Math.max(0, Math.min(max, Math.round(total)));
}

/** Tier a partir do score (maior corte que o score alcança). */
export function tierOf(score: number, spec: ScoringSpec): string {
  const sorted = [...spec.tiers].sort((a, b) => b.min - a.min);
  for (const t of sorted) if (score >= t.min) return t.tier;
  return sorted[sorted.length - 1]?.tier ?? 'C';
}
