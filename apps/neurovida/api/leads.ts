/**
 * apps/neurovida — ingestão + consolidação de leads (Fatia 1).
 *
 * Portado da máquina do Dobro OS (LeadScoreSection + merge): importa CSV das 6
 * fontes, normaliza contato e DEDUPLICA por email OU telefone canônico (union-find
 * — dois registros de fontes diferentes que compartilham email/telefone viram o
 * MESMO lead). O merge é lossless: guarda todas as fontes de origem + flags.
 *
 * Score/tier/segmento são Fatia 2 (config-driven pelo manifesto). Aqui só a
 * ingestão e a consolidação. As tabelas de negócio são R/W pelo role app_auth
 * (autenticado); a leitura via view/allowlist (app_query) entra ao endurecer.
 */

import { eq } from 'drizzle-orm';
import { dbAuth, schema } from '../db/client';
import { canonicalPhone, findEmailColumn, findNameColumn, findPhoneColumn, normalizeEmail, parseCsv } from './csv';
import { computeScore, tierOf, type ScoringSpec } from './scoring';

/** As 6 fontes suportadas (mesma lista do Dobro OS). Registro FECHADO. */
export const LEAD_SOURCES = [
  { id: 'activecampaign', label: 'ActiveCampaign', hint: 'Listas de email (leads + alunos)' },
  { id: 'clint', label: 'Clint', hint: 'Contatos do CRM (email + telefone)' },
  { id: 'pesquisa', label: 'Pesquisa', hint: 'Formulários de pesquisa (perfil ICP)' },
  { id: 'curseduca', label: 'Curseduca', hint: 'Lista de alunos (flag is_aluno)' },
  { id: 'manychat', label: 'ManyChat', hint: 'Contatos Instagram/WhatsApp' },
  { id: 'unnichat', label: 'Unnichat', hint: 'Contatos WhatsApp' },
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

/**
 * Importa um CSV para uma fonte. Detecta as colunas de email/telefone/nome,
 * normaliza as chaves e persiste as linhas (substituindo as da mesma fonte).
 */
export async function importCsv(source: LeadSourceId, csvText: string): Promise<ImportResult> {
  const { headers, rows } = parseCsv(csvText);
  const ei = findEmailColumn(headers);
  const pi = findPhoneColumn(headers);
  const ni = findNameColumn(headers);

  const values = rows.map((r) => {
    const email = ei >= 0 ? normalizeEmail(r[headers[ei]]) : null;
    const phone = pi >= 0 ? canonicalPhone(r[headers[pi]]) : null;
    const name = ni >= 0 ? r[headers[ni]]?.trim() || null : null;
    return { source, email, phone, name, raw: r };
  });

  // Reimportar uma fonte substitui as linhas dela (delete+insert).
  await dbAuth.delete(schema.leadSourceRows).where(eq(schema.leadSourceRows.source, source));
  for (let i = 0; i < values.length; i += CHUNK) {
    await dbAuth.insert(schema.leadSourceRows).values(values.slice(i, i + CHUNK));
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
}

export interface MergeReport {
  totalRecords: number;
  uniqueLeads: number;
  duplicatesMerged: number;
  pctComPesquisa: number;
  pctPorCanal: { email: number; phone: number };
  perSource: Record<string, number>;
}

interface SrcRow {
  source: string;
  email: string | null;
  phone: string | null;
  name: string | null;
}

/**
 * Recomputa a consolidação por inteiro (delete+insert em `leads`). Une registros
 * que compartilham email OU telefone canônico (union-find) e agrega fontes/flags.
 */
export async function mergeLeads(): Promise<MergeReport> {
  const rows = (await dbAuth
    .select({
      source: schema.leadSourceRows.source,
      email: schema.leadSourceRows.email,
      phone: schema.leadSourceRows.phone,
      name: schema.leadSourceRows.name,
    })
    .from(schema.leadSourceRows)) as SrcRow[];

  // union-find sobre os índices de linha
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

  // agrupa por componente
  const groups = new Map<number, number[]>();
  rows.forEach((_, i) => {
    const root = find(i);
    const g = groups.get(root);
    if (g) g.push(i);
    else groups.set(root, [i]);
  });

  const consolidated: Array<typeof schema.leads.$inferInsert> = [];
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
    const isAluno = src.has('curseduca');
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
      isAluno,
      respondeuPesquisa,
      hasEmail,
      hasPhone,
      recordCount: members.length,
    });
  }

  await dbAuth.delete(schema.leads);
  for (let i = 0; i < consolidated.length; i += CHUNK) {
    await dbAuth.insert(schema.leads).values(consolidated.slice(i, i + CHUNK));
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
}

export interface LeadsSummary {
  sources: Array<{ id: string; label: string; hint: string; rows: number }>;
  totalRows: number;
  consolidated: number;
}

/** Estado atual: linhas por fonte + total consolidado (para o painel). */
export async function getLeadsSummary(): Promise<LeadsSummary> {
  const srcRows = (await dbAuth
    .select({ source: schema.leadSourceRows.source })
    .from(schema.leadSourceRows)) as Array<{ source: string }>;
  const perSource: Record<string, number> = {};
  for (const r of srcRows) perSource[r.source] = (perSource[r.source] ?? 0) + 1;

  const leadRows = await dbAuth.select({ id: schema.leads.id }).from(schema.leads);

  return {
    sources: LEAD_SOURCES.map((s) => ({ id: s.id, label: s.label, hint: s.hint, rows: perSource[s.id] ?? 0 })),
    totalRows: srcRows.length,
    consolidated: leadRows.length,
  };
}

// ============================================================
// Pontuação (config-driven) + segmentação + listagem
// ============================================================

/**
 * Deriva o segmento de ação a partir de aluno/pesquisa/tier (mesma estrutura de
 * 6 segmentos do Dobro OS). "alto" = tier S/A; "médio" = B; "baixo" = C.
 */
function segmentOf(isAluno: boolean, respondeu: boolean, tier: string): string {
  const alto = tier === 'S' || tier === 'A';
  const medio = tier === 'B';
  if (isAluno) return respondeu ? 'cliente-upsell' : 'cliente-sem-perfil';
  if (!respondeu) return 'sem-perfil';
  if (alto) return 'icp-alto';
  if (medio) return 'icp-medio';
  return 'icp-baixo';
}

export interface ScoreReport {
  scored: number;
  bySegment: Record<string, number>;
  byTier: Record<string, number>;
}

/**
 * Pontua todos os leads consolidados aplicando a régua `spec` (do manifesto) às
 * respostas da pesquisa (casadas por email/telefone). Recomputa por inteiro
 * (delete+insert) gravando score/tier/segment. Retorna a distribuição.
 */
export async function scoreLeads(spec: ScoringSpec): Promise<ScoreReport> {
  const leadRows = await dbAuth.select().from(schema.leads);
  const pesquisa = (await dbAuth
    .select({
      email: schema.leadSourceRows.email,
      phone: schema.leadSourceRows.phone,
      raw: schema.leadSourceRows.raw,
    })
    .from(schema.leadSourceRows)
    .where(eq(schema.leadSourceRows.source, 'pesquisa'))) as Array<{
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
    const segment = segmentOf(l.isAluno, l.respondeuPesquisa, tier);
    bySegment[segment] = (bySegment[segment] ?? 0) + 1;
    byTier[tier] = (byTier[tier] ?? 0) + 1;
    return { ...l, score, tier, segment };
  });

  await dbAuth.delete(schema.leads);
  for (let i = 0; i < updated.length; i += CHUNK) {
    await dbAuth.insert(schema.leads).values(updated.slice(i, i + CHUNK));
  }

  return { scored: updated.length, bySegment, byTier };
}

export interface LeadListItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  sources: string[];
  isAluno: boolean;
  respondeuPesquisa: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  score: number | null;
  tier: string | null;
  segment: string | null;
}

/** Lista leads (opcionalmente filtrados por segmento), ordenados por score desc. */
export async function listLeads(segment: string | null, limit: number): Promise<LeadListItem[]> {
  const rows = await dbAuth.select().from(schema.leads);
  const filtered = (segment ? rows.filter((r) => r.segment === segment) : rows)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
    .slice(0, Math.max(1, Math.min(limit, 500)));
  return filtered.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    sources: r.sources,
    isAluno: r.isAluno,
    respondeuPesquisa: r.respondeuPesquisa,
    hasEmail: r.hasEmail,
    hasPhone: r.hasPhone,
    score: r.score,
    tier: r.tier,
    segment: r.segment,
  }));
}
