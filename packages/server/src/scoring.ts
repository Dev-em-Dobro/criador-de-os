/**
 * @os/server — motor de ICP score GENÉRICO (config-driven).
 *
 * A régua (campos/pesos/tiers) vem do MANIFESTO do cliente, não é chumbada aqui.
 * Portado do padrão do Dobro OS, parametrizado por regras declarativas.
 */

export interface ScoreMatch {
  contains?: string;
  equals?: string;
  points: number;
}
export interface ScoreRule {
  field: string;
  label?: string;
  max?: number;
  default?: number;
  match: ScoreMatch[];
}
export interface TierCut {
  tier: string;
  min: number;
}
export interface ScoringSpec {
  rules: ScoreRule[];
  tiers: TierCut[];
  maxScore?: number;
}

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

function fieldValue(raw: Record<string, string>, field: string): string {
  const f = field.toLowerCase();
  if (raw[field] !== undefined) return raw[field];
  for (const [k, val] of Object.entries(raw)) {
    if (k.toLowerCase().includes(f)) return val;
  }
  return '';
}

function capped(points: number, max?: number): number {
  return typeof max === 'number' ? Math.min(points, max) : points;
}

function applyRule(value: string, rule: ScoreRule): number {
  const v = value.toLowerCase();
  for (const m of rule.match) {
    if (m.equals !== undefined && v === m.equals.toLowerCase()) return capped(m.points, rule.max);
    if (m.contains !== undefined && v.includes(m.contains.toLowerCase())) return capped(m.points, rule.max);
  }
  return rule.default ?? 0;
}

export function computeScore(raw: Record<string, string> | null, spec: ScoringSpec): number {
  if (!raw) return 0;
  const total = spec.rules.reduce((sum, rule) => sum + applyRule(fieldValue(raw, rule.field), rule), 0);
  const max = spec.maxScore ?? 100;
  return Math.max(0, Math.min(max, Math.round(total)));
}

export function tierOf(score: number, spec: ScoringSpec): string {
  const sorted = [...spec.tiers].sort((a, b) => b.min - a.min);
  for (const t of sorted) if (score >= t.min) return t.tier;
  return sorted[sorted.length - 1]?.tier ?? 'C';
}
