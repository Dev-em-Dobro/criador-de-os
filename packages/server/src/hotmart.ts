/**
 * @os/server — Faturamento da Hotmart (genérico, SÓ AGREGADOS).
 *
 * Privacidade (Caminho C + "só agregados"): a integração usa as credenciais BYOK
 * do cliente (cifradas em app_settings) e consome o endpoint de RESUMO de vendas
 * da Hotmart — que já devolve TOTAIS. Nenhum dado de comprador (nome/e-mail/CPF)
 * é solicitado nem persistido; a tabela `hotmart_metrics` só tem números. Assim a
 * minimização é estrutural, não uma promessa.
 *
 * `makeHotmart(db, getSetting)` devolve as operações ligadas ao banco do app e às
 * credenciais do cliente. O token OAuth fica em cache SÓ em memória (nunca no DB).
 */

import { desc } from 'drizzle-orm';
import { hotmartMetrics } from './schema';
import type { ServerDb } from './db';

// Endpoints públicos da Hotmart (API v1). Constantes para ajuste fácil caso a
// conta do cliente use outra base. Não são segredo.
const HOTMART_TOKEN_URL = 'https://api-sec-vlc.hotmart.com/security/oauth/token';
const HOTMART_API_BASE = 'https://developers.hotmart.com/payments/api/v1';

export const HOTMART_SETTING_KEYS = ['hotmart_client_id', 'hotmart_client_secret'] as const;

const ALL_PRODUCTS = 'Todos os produtos';

/** Um mês de faturamento já agregado (nunca contém dado de comprador). */
export interface MonthAggregate {
  period: string; // 'YYYY-MM'
  product: string;
  productId: string | null;
  grossRevenue: number;
  netRevenue: number;
  salesCount: number;
  currency: string;
}

export interface HotmartMetricRow {
  period: string;
  product: string;
  grossRevenue: number;
  netRevenue: number;
  salesCount: number;
  currency: string;
}

export interface HotmartMetricsResponse {
  rows: HotmartMetricRow[];
  totals: {
    currency: string;
    currentPeriod: string | null;
    currentRevenue: number;
    last12mRevenue: number;
    totalSales: number;
  };
}

export interface SyncReport {
  periods: number;
  rowsWritten: number;
  from: string;
  to: string;
}

export interface HotmartApi {
  /** Puxa o resumo dos últimos N meses da Hotmart e persiste os agregados. */
  sync(opts?: { months?: number }): Promise<SyncReport>;
  /** Lê os agregados persistidos + totais para o painel. */
  getMetrics(): Promise<HotmartMetricsResponse>;
  /** Persiste um mês já agregado (usado por seed/testes — sem rede). */
  saveMonth(agg: MonthAggregate): Promise<void>;
  /** Apaga tudo (cleanup de teste). */
  clearAll(): Promise<void>;
}

// ------------------------------------------------------------
// Parsing puro do RESUMO da Hotmart → agregados (defensivo)
// ------------------------------------------------------------

/** Lê um número de qualquer um dos campos candidatos de um objeto solto. */
function pickNumber(obj: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    // Alguns campos vêm como objeto { value, currency_code }.
    if (v && typeof v === 'object') {
      const inner = (v as Record<string, unknown>).value;
      if (typeof inner === 'number' && Number.isFinite(inner)) return inner;
    }
  }
  return 0;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (v && typeof v === 'object') {
      const inner = (v as Record<string, unknown>).currency_code;
      if (typeof inner === 'string' && inner.trim()) return inner.trim();
    }
  }
  return null;
}

/**
 * Extrai APENAS os agregados do payload de resumo da Hotmart. Robusto a variações
 * de nome de campo. Qualquer campo de comprador que por acaso venha é IGNORADO —
 * só lemos totais numéricos e a moeda.
 */
export function parseHotmartSummary(raw: unknown, period: string): MonthAggregate {
  const root = (raw ?? {}) as Record<string, unknown>;
  const arr: unknown[] = Array.isArray(root.items)
    ? (root.items as unknown[])
    : Array.isArray(root.data)
      ? (root.data as unknown[])
      : Array.isArray(raw)
        ? (raw as unknown[])
        : [root];

  let grossRevenue = 0;
  let netRevenue = 0;
  let salesCount = 0;
  let currency: string | null = null;

  for (const it of arr) {
    if (!it || typeof it !== 'object') continue;
    const o = it as Record<string, unknown>;
    grossRevenue += pickNumber(o, ['total_value', 'total', 'gross_value', 'value', 'amount']);
    netRevenue += pickNumber(o, ['producer_value', 'net_value', 'net', 'commission_value']);
    salesCount += pickNumber(o, ['total_items', 'quantity', 'total_transactions', 'count', 'sales']);
    currency = currency ?? pickString(o, ['currency_code', 'currency']);
  }

  // Se a API não separa o líquido, usa o bruto como fallback (evita zero enganoso).
  if (netRevenue === 0 && grossRevenue > 0) netRevenue = grossRevenue;

  return {
    period,
    product: ALL_PRODUCTS,
    productId: null,
    grossRevenue,
    netRevenue,
    salesCount: Math.round(salesCount),
    currency: currency ?? 'BRL',
  };
}

// ------------------------------------------------------------
// Janela de meses (para o sync)
// ------------------------------------------------------------

/** Últimos `n` meses (do mais antigo ao mais novo) como {period, startMs, endMs}. */
function lastMonths(n: number): Array<{ period: string; startMs: number; endMs: number }> {
  const now = new Date();
  const out: Array<{ period: string; startMs: number; endMs: number }> = [];
  for (let i = n - 1; i >= 0; i--) {
    const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1, 0, 0, 0, 0));
    const nextFirst = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1, 0, 0, 0, 0));
    const period = `${first.getUTCFullYear()}-${String(first.getUTCMonth() + 1).padStart(2, '0')}`;
    out.push({ period, startMs: first.getTime(), endMs: nextFirst.getTime() - 1 });
  }
  return out;
}

/** Id determinístico (período+produto) → sync idempotente. */
function rowId(period: string, productId: string | null, product: string): string {
  const suffix = productId ?? (product === ALL_PRODUCTS ? 'all' : product.toLowerCase().replace(/\s+/g, '-'));
  return `hm_${period}_${suffix}`;
}

// ------------------------------------------------------------
// Fábrica
// ------------------------------------------------------------

export function makeHotmart(db: ServerDb, getSetting: (key: string) => Promise<string | null>): HotmartApi {
  // Cache do token SÓ em memória (por processo). Nunca vai para o banco.
  let cached: { token: string; expiresAt: number } | null = null;

  async function credentials(): Promise<{ clientId: string; clientSecret: string }> {
    const [clientId, clientSecret] = await Promise.all([
      getSetting('hotmart_client_id'),
      getSetting('hotmart_client_secret'),
    ]);
    if (!clientId || !clientSecret) {
      throw new Error('Conecte a sua conta Hotmart em Configurações (Client ID + Client Secret).');
    }
    return { clientId, clientSecret };
  }

  async function getAccessToken(): Promise<string> {
    if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;
    const { clientId, clientSecret } = await credentials();
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const url = `${HOTMART_TOKEN_URL}?grant_type=client_credentials&client_id=${encodeURIComponent(
      clientId,
    )}&client_secret=${encodeURIComponent(clientSecret)}`;

    const res = await fetch(url, { method: 'POST', headers: { Authorization: `Basic ${basic}` } });
    if (!res.ok) {
      throw new Error(`Falha ao autenticar na Hotmart (${res.status}). Confira as credenciais em Configurações.`);
    }
    const body = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!body.access_token) throw new Error('A Hotmart não devolveu um token de acesso.');
    cached = { token: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
    return cached.token;
  }

  async function fetchSummary(startMs: number, endMs: number): Promise<unknown> {
    const token = await getAccessToken();
    const url = `${HOTMART_API_BASE}/sales/summary?start_date=${startMs}&end_date=${endMs}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      throw new Error(`Falha ao buscar o resumo de vendas na Hotmart (${res.status}).`);
    }
    return res.json();
  }

  async function saveMonth(agg: MonthAggregate): Promise<void> {
    const id = rowId(agg.period, agg.productId, agg.product);
    const now = new Date();
    await db
      .insert(hotmartMetrics)
      .values({
        id,
        period: agg.period,
        product: agg.product,
        productId: agg.productId,
        grossRevenue: agg.grossRevenue,
        netRevenue: agg.netRevenue,
        salesCount: agg.salesCount,
        currency: agg.currency,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: hotmartMetrics.id,
        set: {
          grossRevenue: agg.grossRevenue,
          netRevenue: agg.netRevenue,
          salesCount: agg.salesCount,
          currency: agg.currency,
          updatedAt: now,
        },
      });
  }

  return {
    async sync(opts) {
      const months = Math.min(Math.max(opts?.months ?? 12, 1), 24);
      const windows = lastMonths(months);
      let rowsWritten = 0;
      for (const w of windows) {
        const raw = await fetchSummary(w.startMs, w.endMs);
        const agg = parseHotmartSummary(raw, w.period);
        // Só persiste meses com movimento (evita poluir com zeros).
        if (agg.grossRevenue > 0 || agg.salesCount > 0) {
          await saveMonth(agg);
          rowsWritten++;
        }
      }
      return {
        periods: windows.length,
        rowsWritten,
        from: windows[0]?.period ?? '',
        to: windows[windows.length - 1]?.period ?? '',
      };
    },

    async getMetrics() {
      const rows = await db.select().from(hotmartMetrics).orderBy(desc(hotmartMetrics.period));
      const out: HotmartMetricRow[] = rows.map((r) => ({
        period: r.period,
        product: r.product,
        grossRevenue: r.grossRevenue,
        netRevenue: r.netRevenue,
        salesCount: r.salesCount,
        currency: r.currency,
      }));
      const currency = out[0]?.currency ?? 'BRL';
      const currentPeriod = out[0]?.period ?? null;
      const currentRevenue = out[0]?.grossRevenue ?? 0;
      const last12mRevenue = out.slice(0, 12).reduce((s, r) => s + r.grossRevenue, 0);
      const totalSales = out.reduce((s, r) => s + r.salesCount, 0);
      return { rows: out, totals: { currency, currentPeriod, currentRevenue, last12mRevenue, totalSales } };
    },

    saveMonth,

    async clearAll() {
      await db.delete(hotmartMetrics);
    },
  };
}
