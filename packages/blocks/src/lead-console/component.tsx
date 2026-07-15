/**
 * @os/blocks — componente do `lead-console`, carregado sob demanda.
 *
 * Fluxo: subir CSV por fonte → Consolidar (merge/dedup) → Pontuar (régua de ICP
 * do manifesto, `config.scoring`) → segmentos + tabela. Fala com /api/leads/*
 * (@os/server). A máquina é genérica; a pontuação é do negócio (config).
 */

import { useEffect, useMemo, useState } from 'react';
import { SectionHeader, EmptyState } from '@os/core';
import type { BlockProps } from '@os/core';

interface SourceSummary {
  id: string;
  label: string;
  hint: string;
  rows: number;
}
interface Summary {
  sources: SourceSummary[];
  totalRows: number;
  consolidated: number;
}
interface MergeReport {
  totalRecords: number;
  uniqueLeads: number;
  duplicatesMerged: number;
  pctComPesquisa: number;
  pctPorCanal: { email: number; phone: number };
}
interface ScoreReport {
  scored: number;
  bySegment: Record<string, number>;
  byTier: Record<string, number>;
}
interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  sources: string[];
  score: number | null;
  tier: string | null;
  segment: string | null;
}

const SEGMENTS = [
  { id: 'icp-alto', label: 'ICP Alto', desc: 'Não-cliente — oferta direta', accent: 'text-emerald-400' },
  { id: 'icp-medio', label: 'ICP Médio', desc: 'Não-cliente — aquecimento', accent: 'text-blue-300' },
  { id: 'icp-baixo', label: 'ICP Baixo', desc: 'Não-cliente — nutrição', accent: 'text-gray-300' },
  { id: 'sem-perfil', label: 'Sem Perfil', desc: 'Sem pesquisa respondida', accent: 'text-yellow-300' },
];

const TIER_BADGE: Record<string, string> = {
  S: 'bg-red-500/20 text-red-400 border-red-500/30',
  A: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  B: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  C: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

// Modelo da pesquisa de perfil (config-driven, do manifesto). O bloco gera um CSV
// para o cliente baixar, preencher e subir de volta na fonte de pesquisa.
interface SurveyQuestion {
  column: string;
  options: string[];
}
interface SurveyTemplate {
  sourceId?: string;
  filename?: string;
  identity: string[];
  questions: SurveyQuestion[];
  samples?: string[][];
}

function csvCell(v: string): string {
  return /[",;\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
function buildSurveyCsv(t: SurveyTemplate): string {
  const header = [...t.identity, ...t.questions.map((q) => q.column)];
  const rows = [header, ...(t.samples ?? [])];
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}
function downloadCsv(filename: string, csv: string): void {
  // BOM (﻿) para o Excel abrir os acentos em UTF-8 corretamente.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || 'Falha na operação.');
  return data;
}

export default function LeadConsole({ title, subtitle, config }: BlockProps) {
  const scoring = (config as { scoring?: unknown }).scoring;
  const survey = (config as { surveyTemplate?: SurveyTemplate }).surveyTemplate;

  const [summary, setSummary] = useState<Summary | null>(null);
  const [merge, setMerge] = useState<MergeReport | null>(null);
  const [score, setScore] = useState<ScoreReport | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [segment, setSegment] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [modeloAberto, setModeloAberto] = useState(false);

  async function loadSummary(): Promise<void> {
    try {
      setSummary(await api<Summary>('GET', '/api/leads/summary'));
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }

  // Se já existem leads PONTUADOS no banco, mostra a visão completa (tiers,
  // segmentos, tabela) logo no load — sem exigir novo clique em Consolidar/Pontuar.
  // Deriva os totais dos próprios leads (mesma contagem que a Pontuação produz).
  async function loadExisting(): Promise<void> {
    try {
      const { leads: rows } = await api<{ leads: Lead[] }>('GET', '/api/leads/list');
      if (rows.length > 0 && rows.some((r) => r.tier || r.segment)) {
        const byTier: Record<string, number> = {};
        const bySegment: Record<string, number> = {};
        for (const r of rows) {
          if (r.tier) byTier[r.tier] = (byTier[r.tier] ?? 0) + 1;
          if (r.segment) bySegment[r.segment] = (bySegment[r.segment] ?? 0) + 1;
        }
        setScore({ scored: rows.length, byTier, bySegment });
        setLeads(rows);
      }
    } catch {
      /* silencioso — a tela continua funcionando pelo fluxo manual */
    }
  }

  useEffect(() => {
    void loadSummary();
    void loadExisting();
  }, []);

  async function upload(source: string, file: File): Promise<void> {
    setBusy(`up:${source}`);
    setErro(null);
    try {
      const csv = await file.text();
      await api('POST', `/api/leads/import/${source}`, { csv });
      await loadSummary();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function consolidar(): Promise<void> {
    setBusy('merge');
    setErro(null);
    setScore(null);
    setLeads([]);
    setSegment(null);
    try {
      setMerge(await api<MergeReport>('POST', '/api/leads/merge'));
      await loadSummary();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function pontuar(): Promise<void> {
    setBusy('score');
    setErro(null);
    try {
      const rep = await api<ScoreReport>('POST', '/api/leads/score', { scoring });
      setScore(rep);
      await loadLeads(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function loadLeads(seg: string | null): Promise<void> {
    setSegment(seg);
    try {
      const q = seg ? `?segment=${encodeURIComponent(seg)}` : '';
      const { leads: rows } = await api<{ leads: Lead[] }>('GET', `/api/leads/list${q}`);
      setLeads(rows);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }

  const tierTotals = useMemo(() => {
    const t = score?.byTier ?? {};
    const quente = (t.S ?? 0) + (t.A ?? 0);
    const morno = t.B ?? 0;
    const frio = t.C ?? 0;
    return { quente, morno, frio, total: quente + morno + frio };
  }, [score]);

  return (
    <div>
      <SectionHeader title={title ?? 'Análise de Leads quentes'} subtitle={subtitle} icon="🔥" />

      {erro && (
        <div role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </div>
      )}

      {/* 1) Fontes — upload de CSV */}
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Fontes de dados (subir CSV)</h3>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(summary?.sources ?? []).map((s) => (
          <div key={s.id} className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-4 backdrop-blur-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-gray-100">{s.label}</span>
              <span className="text-xs text-gray-500">{s.rows} linha(s)</span>
            </div>
            <p className="mt-0.5 mb-3 text-xs text-gray-500">{s.hint}</p>
            <label
              className={`inline-flex cursor-pointer items-center rounded-lg border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-blue-500/40 hover:text-gray-100 focus-within:ring-2 focus-within:ring-blue-500/50 ${
                busy === `up:${s.id}` ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              {busy === `up:${s.id}` ? 'Enviando…' : s.rows > 0 ? 'Substituir CSV' : 'Subir CSV'}
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload(s.id, f);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        ))}
      </div>

      {/* Modelo de pesquisa de perfil (ICP) — baixar CSV, coletar, subir de volta */}
      {survey && (
        <div className="mb-6 rounded-2xl border border-gray-700/50 bg-gray-800/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl">
              <h3 className="text-sm font-semibold text-gray-100">📋 Modelo de pesquisa de perfil (ICP)</h3>
              <p className="mt-1 text-xs text-gray-400">
                Baixe o modelo, colete as respostas dos seus leads (ex.: monte um formulário com estas mesmas
                perguntas) e suba o CSV preenchido na fonte{' '}
                <span className="text-gray-200">"Pesquisa de perfil"</span> acima — fica guardado no sistema e
                alimenta a Pontuação. As respostas definem o ICP de cada lead.
              </p>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <button
                type="button"
                onClick={() => downloadCsv(survey.filename ?? 'pesquisa-perfil.csv', buildSurveyCsv(survey))}
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                ⬇ Baixar modelo (CSV)
              </button>
              <button
                type="button"
                onClick={() => setModeloAberto((v) => !v)}
                className="rounded-xl border border-gray-600 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-blue-500/40"
              >
                {modeloAberto ? 'Ocultar perguntas' : 'Ver perguntas'}
              </button>
            </div>
          </div>
          {modeloAberto && (
            <ol className="mt-4 space-y-3 border-t border-gray-700/50 pt-4">
              {survey.questions.map((q, i) => (
                <li key={q.column} className="text-sm">
                  <div className="font-medium text-gray-200">
                    {i + 1}. {q.column}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {q.options.map((opt) => (
                      <span
                        key={opt}
                        className="inline-flex items-center rounded-full border border-gray-600/50 bg-gray-700/40 px-2 py-0.5 text-[11px] text-gray-400"
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
              <li className="pt-1 text-xs text-gray-500">
                + colunas de identificação: {survey.identity.join(' · ')} — usadas para deduplicar por e-mail/telefone.
              </li>
            </ol>
          )}
        </div>
      )}

      {/* 2/3) Ações: consolidar + pontuar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-700/50 bg-gray-800/40 p-4">
        <div className="flex-1 text-sm text-gray-400">
          {summary ? (
            <>
              <span className="font-semibold text-gray-200">{summary.totalRows}</span> registros ·{' '}
              <span className="font-semibold text-gray-200">{summary.consolidated}</span> leads consolidados
            </>
          ) : (
            'Carregando…'
          )}
        </div>
        <button
          type="button"
          onClick={() => void consolidar()}
          disabled={busy !== null || !summary || summary.totalRows === 0}
          className="rounded-xl border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-blue-500/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === 'merge' ? 'Consolidando…' : '1. Consolidar'}
        </button>
        <button
          type="button"
          onClick={() => void pontuar()}
          disabled={busy !== null || !summary || summary.consolidated === 0}
          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === 'score' ? 'Pontuando…' : '2. Pontuar'}
        </button>
      </div>

      {merge && (
        <p className="mb-6 text-xs text-gray-500">
          Merge: {merge.totalRecords} registros → <span className="text-gray-300">{merge.uniqueLeads} leads</span> (
          {merge.duplicatesMerged} duplicados fundidos) · {merge.pctComPesquisa}% com pesquisa · alcance por email{' '}
          {merge.pctPorCanal.email}% / telefone {merge.pctPorCanal.phone}%
        </p>
      )}

      {score && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(
            [
              { key: 'quente', label: 'Quente (S/A)', n: tierTotals.quente, barra: 'bg-red-500', texto: 'text-red-400' },
              { key: 'morno', label: 'Morno (B)', n: tierTotals.morno, barra: 'bg-amber-500', texto: 'text-amber-400' },
              { key: 'frio', label: 'Frio (C)', n: tierTotals.frio, barra: 'bg-blue-500', texto: 'text-blue-400' },
            ] as const
          ).map((t) => {
            const pct = tierTotals.total > 0 ? Math.round((t.n / tierTotals.total) * 100) : 0;
            return (
              <div key={t.key} className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 backdrop-blur-sm">
                <div className="flex items-baseline justify-between">
                  <span className={`text-sm font-semibold ${t.texto}`}>{t.label}</span>
                  <span className="text-xs text-gray-500">{pct}%</span>
                </div>
                <div className="mt-1 text-2xl font-bold text-gray-100">{t.n}</div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-700/50">
                  <div className={`h-full rounded-full ${t.barra}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {score && (
        <>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Segmentos de ação</h3>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SEGMENTS.map((s) => {
              const ativo = segment === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => void loadLeads(ativo ? null : s.id)}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    ativo ? 'border-blue-500/50 bg-blue-500/10' : 'border-gray-700/50 bg-gray-800/60 hover:border-blue-500/25'
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className={`text-sm font-semibold ${s.accent}`}>{s.label}</span>
                    <span className="text-lg font-bold text-gray-100">{score.bySegment[s.id] ?? 0}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{s.desc}</p>
                </button>
              );
            })}
          </div>
        </>
      )}

      {score && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              {segment ? `Leads · ${SEGMENTS.find((s) => s.id === segment)?.label}` : 'Todos os leads'}
            </h3>
            {segment && (
              <button type="button" onClick={() => void loadLeads(null)} className="text-xs text-blue-400 hover:text-blue-300">
                Limpar filtro
              </button>
            )}
          </div>

          {leads.length === 0 ? (
            <EmptyState message="Nenhum lead neste segmento." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/60 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700/60 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      <th className="px-4 py-3">Lead</th>
                      <th className="px-4 py-3">Fontes</th>
                      <th className="px-4 py-3 text-right">Score</th>
                      <th className="px-4 py-3">Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.id} className="border-b border-gray-800/60 last:border-0 transition-colors hover:bg-gray-700/20">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-100">
                            {l.name || l.email || l.phone || '(sem nome)'}
                          </div>
                          <div className="text-xs text-gray-500">{[l.email, l.phone].filter(Boolean).join(' · ') || '—'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {l.sources.map((c) => (
                              <span key={c} className="inline-flex items-center rounded-full border border-gray-600/50 bg-gray-700/40 px-2 py-0.5 text-[11px] text-gray-400">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono tnum font-semibold text-gray-100">{l.score ?? '—'}</td>
                        <td className="px-4 py-3">
                          {l.tier && (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TIER_BADGE[l.tier] ?? 'border-gray-600/50 text-gray-400'}`}>
                              Tier {l.tier}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!score && summary && summary.consolidated === 0 && (
        <EmptyState icon="📥" message="Suba os CSVs das fontes acima e clique em Consolidar." hint="Depois, Pontuar aplica a régua de ICP e mostra os segmentos." />
      )}
    </div>
  );
}
