/**
 * @os/server — ingestão + consolidação + score de leads (genérico, fábrica).
 *
 * `makeLeads(db)` devolve as operações ligadas ao banco do app. Dedup por email
 * OU telefone canônico (union-find); score config-driven (régua do manifesto).
 * As 5 fontes são o stack padrão do Dev em Dobro (um app que não usa uma fonte
 * simplesmente não sobe o CSV dela).
 */

import { eq } from 'drizzle-orm';
import { leadSourceRows, leads } from './schema';
import type { ServerDb } from './db';
import { canonicalPhone, findEmailColumn, findNameColumn, findPhoneColumn, normalizeEmail, parseCsv } from './csv';
import { computeScore, tierOf, type ScoringSpec } from './scoring';

// Cada fonte é rotulada pelo TIPO de lista (genérico); o hint cita ferramentas
// de exemplo. O `id` é interno (rótulo de origem no merge) e não muda com o label.
export const LEAD_SOURCES = [
  { id: 'activecampaign', label: 'Listas de e-mail', hint: 'leads + alunos · ex.: ActiveCampaign, Mailchimp' },
  { id: 'clint', label: 'CRM (contatos)', hint: 'email + telefone · ex.: Clint, RD, Pipedrive' },
  { id: 'pesquisa', label: 'Pesquisa de perfil', hint: 'formulário ICP · ex.: Typeform, Google Forms' },
  { id: 'hotmart', label: 'Compras', hint: 'compradores · ex.: Hotmart, Kiwify, Eduzz' },
  { id: 'manychat', label: 'Chat / social', hint: 'Instagram/WhatsApp · ex.: ManyChat' },
] as const;

export type LeadSourceId = (typeof LEAD_SOURCES)[number]['id'];

export function isKnownSource(id: string): id is LeadSourceId {
  return LEAD_SOURCES.some((s) => s.id === id);
}

const CHUNK = 200;

export interface ImportResult {
  source: LeadSourceId;
  inserted: number;
  detected: { email: string | null; phone: string | null; name: string | null };
}
export interface MergeReport {
  totalRecords: number;
  uniqueLeads: number;
  duplicatesMerged: number;
  pctComPesquisa: number;
  pctPorCanal: { email: number; phone: number };
  perSource: Record<string, number>;
}
export interface ScoreReport {
  scored: number;
  bySegment: Record<string, number>;
  byTier: Record<string, number>;
}
export interface LeadsSummary {
  sources: Array<{ id: string; label: string; hint: string; rows: number }>;
  totalRows: number;
  consolidated: number;
}
export interface LeadListItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  sources: string[];
  respondeuPesquisa: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  score: number | null;
  tier: string | null;
  segment: string | null;
}

interface SrcRow {
  source: string;
  email: string | null;
  phone: string | null;
  name: string | null;
}

/** "alto" = tier S/A; "médio" = B; "baixo" = C. 4 segmentos (estrutura do Dobro). */
function segmentOf(respondeu: boolean, tier: string): string {
  const alto = tier === 'S' || tier === 'A';
  const medio = tier === 'B';
  if (!respondeu) return 'sem-perfil';
  if (alto) return 'icp-alto';
  if (medio) return 'icp-medio';
  return 'icp-baixo';
}

export interface LeadsApi {
  importCsv(source: LeadSourceId, csvText: string): Promise<ImportResult>;
  mergeLeads(): Promise<MergeReport>;
  scoreLeads(spec: ScoringSpec): Promise<ScoreReport>;
  getLeadsSummary(): Promise<LeadsSummary>;
  listLeads(segment: string | null, limit: number): Promise<LeadListItem[]>;
}

export function makeLeads(db: ServerDb): LeadsApi {
  return {
    async importCsv(source, csvText) {
      const { headers, rows } = parseCsv(csvText);
      const ei = findEmailColumn(headers);
      const pi = findPhoneColumn(headers);
      const ni = findNameColumn(headers);

      const values = rows.map((r) => ({
        source,
        email: ei >= 0 ? normalizeEmail(r[headers[ei]]) : null,
        phone: pi >= 0 ? canonicalPhone(r[headers[pi]]) : null,
        name: ni >= 0 ? r[headers[ni]]?.trim() || null : null,
        raw: r,
      }));

      await db.delete(leadSourceRows).where(eq(leadSourceRows.source, source));
      for (let i = 0; i < values.length; i += CHUNK) {
        await db.insert(leadSourceRows).values(values.slice(i, i + CHUNK));
      }

      return {
        source,
        inserted: values.length,
        detected: {
          email: ei >= 0 ? headers[ei] : null,
          phone: pi >= 0 ? headers[pi] : null,
          name: ni >= 0 ? headers[ni] : null,
        },
      };
    },

    async mergeLeads() {
      const rows = (await db
        .select({
          source: leadSourceRows.source,
          email: leadSourceRows.email,
          phone: leadSourceRows.phone,
          name: leadSourceRows.name,
        })
        .from(leadSourceRows)) as SrcRow[];

      const parent = rows.map((_, i) => i);
      const find = (x: number): number => {
        let r = x;
        while (parent[r] !== r) r = parent[r];
        while (parent[x] !== r) {
          const next = parent[x];
          parent[x] = r;
          x = next;
        }
        return r;
      };
      const union = (a: number, b: number): void => {
        const ra = find(a);
        const rb = find(b);
        if (ra !== rb) parent[ra] = rb;
      };

      const byEmail = new Map<string, number>();
      const byPhone = new Map<string, number>();
      rows.forEach((r, i) => {
        if (r.email) {
          const seen = byEmail.get(r.email);
          if (seen !== undefined) union(i, seen);
          else byEmail.set(r.email, i);
        }
        if (r.phone) {
          const seen = byPhone.get(r.phone);
          if (seen !== undefined) union(i, seen);
          else byPhone.set(r.phone, i);
        }
      });

      const groups = new Map<number, number[]>();
      rows.forEach((_, i) => {
        const root = find(i);
        const g = groups.get(root);
        if (g) g.push(i);
        else groups.set(root, [i]);
      });

      const consolidated: Array<typeof leads.$inferInsert> = [];
      let idx = 0;
      let comPesquisa = 0;
      let comEmail = 0;
      let comPhone = 0;

      for (const members of groups.values()) {
        const src = new Set<string>();
        let email: string | null = null;
        let phone: string | null = null;
        let name: string | null = null;
        for (const i of members) {
          const r = rows[i];
          src.add(r.source);
          if (!email && r.email) email = r.email;
          if (!phone && r.phone) phone = r.phone;
          if (!name && r.name) name = r.name;
        }
        const respondeuPesquisa = src.has('pesquisa');
        const hasEmail = email !== null;
        const hasPhone = phone !== null;
        if (respondeuPesquisa) comPesquisa++;
        if (hasEmail) comEmail++;
        if (hasPhone) comPhone++;

        consolidated.push({
          id: `l_${idx++}`,
          email,
          phone,
          name,
          sources: [...src].sort(),
          respondeuPesquisa,
          hasEmail,
          hasPhone,
          recordCount: members.length,
        });
      }

      await db.delete(leads);
      for (let i = 0; i < consolidated.length; i += CHUNK) {
        await db.insert(leads).values(consolidated.slice(i, i + CHUNK));
      }

      const unique = consolidated.length;
      const perSource: Record<string, number> = {};
      for (const r of rows) perSource[r.source] = (perSource[r.source] ?? 0) + 1;
      const pct = (n: number) => (unique > 0 ? Math.round((n / unique) * 1000) / 10 : 0);
      return {
        totalRecords: rows.length,
        uniqueLeads: unique,
        duplicatesMerged: rows.length - unique,
        pctComPesquisa: pct(comPesquisa),
        pctPorCanal: { email: pct(comEmail), phone: pct(comPhone) },
        perSource,
      };
    },

    async scoreLeads(spec) {
      const leadRows = await db.select().from(leads);
      const pesquisa = (await db
        .select({ email: leadSourceRows.email, phone: leadSourceRows.phone, raw: leadSourceRows.raw })
        .from(leadSourceRows)
        .where(eq(leadSourceRows.source, 'pesquisa'))) as Array<{
        email: string | null;
        phone: string | null;
        raw: Record<string, string>;
      }>;

      const byEmail = new Map<string, Record<string, string>>();
      const byPhone = new Map<string, Record<string, string>>();
      for (const p of pesquisa) {
        if (p.email && !byEmail.has(p.email)) byEmail.set(p.email, p.raw);
        if (p.phone && !byPhone.has(p.phone)) byPhone.set(p.phone, p.raw);
      }

      const bySegment: Record<string, number> = {};
      const byTier: Record<string, number> = {};
      const updated = leadRows.map((l) => {
        const survey = (l.email ? byEmail.get(l.email) : undefined) ?? (l.phone ? byPhone.get(l.phone) : undefined) ?? null;
        const score = computeScore(survey, spec);
        const tier = tierOf(score, spec);
        const segment = segmentOf(l.respondeuPesquisa, tier);
        bySegment[segment] = (bySegment[segment] ?? 0) + 1;
        byTier[tier] = (byTier[tier] ?? 0) + 1;
        return { ...l, score, tier, segment };
      });

      await db.delete(leads);
      for (let i = 0; i < updated.length; i += CHUNK) {
        await db.insert(leads).values(updated.slice(i, i + CHUNK));
      }
      return { scored: updated.length, bySegment, byTier };
    },

    async getLeadsSummary() {
      const srcRows = (await db.select({ source: leadSourceRows.source }).from(leadSourceRows)) as Array<{ source: string }>;
      const perSource: Record<string, number> = {};
      for (const r of srcRows) perSource[r.source] = (perSource[r.source] ?? 0) + 1;
      const leadRows = await db.select({ id: leads.id }).from(leads);
      return {
        sources: LEAD_SOURCES.map((s) => ({ id: s.id, label: s.label, hint: s.hint, rows: perSource[s.id] ?? 0 })),
        totalRows: srcRows.length,
        consolidated: leadRows.length,
      };
    },

    async listLeads(segment, limit) {
      const rows = await db.select().from(leads);
      const filtered = (segment ? rows.filter((r) => r.segment === segment) : rows)
        .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
        .slice(0, Math.max(1, Math.min(limit, 500)));
      return filtered.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        sources: r.sources,
        respondeuPesquisa: r.respondeuPesquisa,
        hasEmail: r.hasEmail,
        hasPhone: r.hasPhone,
        score: r.score,
        tier: r.tier,
        segment: r.segment,
      }));
    },
  };
}
