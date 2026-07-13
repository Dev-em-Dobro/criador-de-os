/**
 * @os/scaffolder — normalização + validação das respostas (de JSON ou do wizard)
 * para um `ClientAnswers` completo e seguro. Erros são amigáveis (o CLI os mostra).
 */

import type { BlockKind, ClientAnswers, MenuAnswer, Period, Preset } from './types';
import { isValidSlug, toKebab } from './util';

export const BLOCK_KINDS: BlockKind[] = [
  'kpi-dashboard',
  'data-table',
  'kanban-board',
  'metric-comparison',
  'doc-viewer',
];
const PRESETS: Preset[] = ['static', 'full'];
const PERIODS: Period[] = ['weekly', 'monthly', 'quarterly'];

/** "cliente-exemplo" → "Cliente Exemplo". */
export function titleize(slug: string): string {
  return toKebab(slug)
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function asObject(v: unknown, ctx: string): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) {
    throw new Error(`${ctx}: esperava um objeto.`);
  }
  return v as Record<string, unknown>;
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

/** Constrói e valida um `ClientAnswers` a partir de um JSON/objeto arbitrário. */
export function normalizeAnswers(raw: unknown): ClientAnswers {
  const o = asObject(raw, 'config');

  const slugInput = asString(o.slug);
  if (!slugInput) throw new Error('config.slug é obrigatório (kebab-case, ex.: "cliente-exemplo").');
  const slug = toKebab(slugInput);
  if (!isValidSlug(slug)) {
    throw new Error(`slug inválido: "${slugInput}". Use letras minúsculas, números e hífens (ex.: "cliente-exemplo").`);
  }

  const displayName = asString(o.displayName) ?? titleize(slug);
  const productName = asString(o.productName);

  const preset = (asString(o.preset) ?? 'full') as Preset;
  if (!PRESETS.includes(preset)) throw new Error(`preset inválido: "${preset}". Use "static" ou "full".`);

  const themeRaw = o.theme ? asObject(o.theme, 'config.theme') : {};
  const brand = asString(themeRaw.brand) ?? '#4f46e5';
  const signal = asString(themeRaw.signal);

  const auth = typeof o.auth === 'boolean' ? o.auth : preset === 'full';
  const allowedDomain = asString(o.allowedDomain);

  // Período
  const periodRaw = o.period ? asObject(o.period, 'config.period') : {};
  const periodEnabled = typeof periodRaw.enabled === 'boolean' ? periodRaw.enabled : true;
  const periodDefault = (asString(periodRaw.default) ?? 'monthly') as Period;
  if (!PERIODS.includes(periodDefault)) {
    throw new Error(`period.default inválido: "${periodDefault}". Use weekly | monthly | quarterly.`);
  }
  const periodOptions = Array.isArray(periodRaw.options)
    ? (periodRaw.options.filter((p): p is Period => PERIODS.includes(p as Period)))
    : PERIODS;

  // Menus
  const menusRaw = o.menus;
  if (!Array.isArray(menusRaw) || menusRaw.length === 0) {
    throw new Error('config.menus precisa de ao menos 1 menu.');
  }
  const seenKeys = new Set<string>();
  const menus: MenuAnswer[] = menusRaw.map((mRaw, i) => {
    const m = asObject(mRaw, `config.menus[${i}]`);
    const block = asString(m.block) as BlockKind | undefined;
    if (!block || !BLOCK_KINDS.includes(block)) {
      throw new Error(
        `config.menus[${i}].block inválido: "${String(m.block)}". Use um de: ${BLOCK_KINDS.join(', ')}.`,
      );
    }
    const keyInput = asString(m.key) ?? asString(m.label);
    if (!keyInput) throw new Error(`config.menus[${i}] precisa de "key" ou "label".`);
    const key = toKebab(keyInput);
    if (!isValidSlug(key)) throw new Error(`config.menus[${i}].key inválido após normalizar: "${keyInput}".`);
    if (seenKeys.has(key)) throw new Error(`config.menus[${i}].key duplicado: "${key}".`);
    seenKeys.add(key);

    return {
      key,
      label: asString(m.label) ?? titleize(key),
      block,
      icon: asString(m.icon),
      title: asString(m.title),
      subtitle: asString(m.subtitle),
    };
  });

  return {
    slug,
    displayName,
    productName,
    theme: { brand, signal },
    preset,
    auth,
    allowedDomain,
    period: { enabled: periodEnabled, default: periodDefault, options: periodOptions },
    menus,
    footerText: asString(o.footerText),
  };
}
