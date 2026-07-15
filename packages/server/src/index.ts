/**
 * @os/server — barrel público das capacidades de backend da fábrica.
 *
 * O app monta as rotas com `mountApi(app, { auth, db, ... })` e re-exporta o
 * schema compartilhado no seu `db/schema.ts`. A lógica (settings/leads/faturas)
 * vive AQUI, uma vez — os apps só ligam os fios ao seu Neon.
 */

export { mountApi } from './mount';
export type { ServerDeps, AuthLike, MountedApi } from './mount';
export type { ServerDb } from './db';

export { SHARED_TABLES } from './schema';

/* Configurações (BYOK) */
export { makeSettings, KNOWN_SETTINGS } from './settings';
export type { SettingsApi, SettingSpec, SettingStatus } from './settings';

/* Leads */
export { makeLeads, LEAD_SOURCES, isKnownSource } from './leads';
export type { LeadsApi, LeadSourceId, MergeReport, ScoreReport, LeadsSummary, LeadListItem } from './leads';

/* Faturas */
export { makeInvoices } from './invoices';
export type { InvoicesApi, InvoicesResponse, InvoiceOut, InvoiceItemOut, SavedInvoice } from './invoices';
export { extractInvoice, INVOICE_CATEGORIES } from './invoice-extract';
export type { ExtractedInvoice, ExtractedItem } from './invoice-extract';

/* Score (config-driven) */
export { computeScore, tierOf, isScoringSpec } from './scoring';
export type { ScoringSpec, ScoreRule, ScoreMatch, TierCut } from './scoring';

/* Faturamento (Hotmart) — só agregados */
export { makeHotmart, parseHotmartSummary, HOTMART_SETTING_KEYS } from './hotmart';
export type { HotmartApi, HotmartMetricsResponse, HotmartMetricRow, MonthAggregate, SyncReport } from './hotmart';
