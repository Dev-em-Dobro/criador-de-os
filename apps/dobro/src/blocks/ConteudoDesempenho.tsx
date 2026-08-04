/**
 * apps/dobro — bloco CUSTOM: "Resumo de desempenho" (aba Instagram da planilha).
 *
 * Substitui a planilha "Acompanhamento de Conteúdo" DENTRO do OS. Cada linha é um
 * post publicado com seus números crus (alcance, salvamentos, compartilhamentos…).
 * O que a criadora fazia à mão na planilha — as TAXAS e a CLASSIFICAÇÃO (Forte /
 * Saudável / Abaixo) — aqui é AUTOMÁTICO: derivamos tudo destes valores + os
 * benchmarks (config do manifesto, editáveis).
 *
 * Fase 0 (esta): entrada MANUAL dos números pela tela + cálculo automático.
 * Fase 1 (quando o token de Insights liberar): um "Sincronizar" preenche os
 * mesmos campos sozinho — sem mudar esta tela nem o schema.
 *
 * Seções:
 *   1) RESUMO — contagem de Fortes/Saudáveis/Abaixo no período (aba "Resumo").
 *   2) MÉDIAS POR FORMATO — taxa média das métricas prioritárias vs benchmark.
 *   3) CONTEÚDOS — a lista de posts medidos, com a classificação de cada um.
 *   + Modal para adicionar/editar uma medição (grava via /api/conteudo/desempenho).
 */

import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { SectionHeader, EmptyState, SkeletonCards } from '@os/core';
import type { BlockDefinition, BlockProps } from '@os/core';
import { GuiaMetricas } from './ConteudoGuiaMetricas';

// ============================================================
// Helpers (locais — o bloco não importa internals de @os/blocks)
// ============================================================

type Row = Record<string, unknown>;

function asRows(data: unknown): Row[] {
  if (Array.isArray(data)) return data.filter((r): r is Row => r != null && typeof r === 'object');
  if (data != null && typeof data === 'object') return [data as Row];
  return [];
}

function str(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

/** Valor numérico ou null (aceita number ou string numérica). */
function num(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Razão a/b protegida (null se faltar dado ou b=0). */
function ratio(a: number | null, b: number | null): number | null {
  if (a == null || b == null || b === 0) return null;
  return a / b;
}

/** Fonte de display: Fraunces no skin que a define; senão herda o sans. */
const DISPLAY = { fontFamily: 'var(--font-display, inherit)' } as const;

const MESES_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Date → "12 mar 26". */
function fmtData(value: unknown): string {
  const s = str(value);
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad2(d.getDate())} ${MESES_ABBR[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

/** 'YYYY-MM-DD' de um valor ISO (para o <input type=date>). */
function toDateInput(value: unknown): string {
  const s = str(value);
  if (!s) return '';
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Inteiro pt-BR (1234 → "1.234"); "—" se null. */
function fmtInt(n: number | null): string {
  if (n == null) return '—';
  return Math.round(n).toLocaleString('pt-BR');
}

/** Taxa decimal → "1,4%" (0,014); "—" se null. */
function fmtRate(n: number | null): string {
  if (n == null) return '—';
  return `${(n * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

// ============================================================
// Config + benchmarks (a aba "Referências" da planilha)
// ============================================================

/** [limite saudável, limite forte] em decimal (0,5% = 0,005). */
type Threshold = [number, number];

interface FormatBenchmarks {
  compartilhamentos?: Threshold;
  salvamentos?: Threshold;
  /** Só Reel — retenção = tempo médio / duração. */
  retencao?: Threshold;
}

interface ConteudoDesempenhoConfig {
  /** Benchmarks por formato. Se ausente, usa o DEFAULT (heurísticas da planilha). */
  benchmarks?: Record<string, FormatBenchmarks>;
}

/**
 * Benchmarks default — exatamente as faixas de Instagram do `desempenho-guia.ts`
 * (aba "Referências" da planilha). Só as métricas que entram na CLASSIFICAÇÃO
 * automática vivem aqui (compart./salv./retenção); o guia carrega o resto pra
 * leitura humana e pra IA. Se mexer numa faixa, mexa nos dois — batem por design.
 */
const DEFAULT_BENCH: Record<string, FormatBenchmarks> = {
  reel: { compartilhamentos: [0.005, 0.015], salvamentos: [0.003, 0.01], retencao: [0.5, 0.7] },
  carrossel: { compartilhamentos: [0.003, 0.01], salvamentos: [0.005, 0.02] },
  post: { compartilhamentos: [0.002, 0.007], salvamentos: [0.002, 0.007] },
};

const FORMATO_LABEL: Record<string, string> = {
  reel: 'Reel',
  carrossel: 'Carrossel',
  post: 'Post',
  story: 'Story',
};
const FORMATO_OPTS: ReadonlyArray<[string, string]> = [
  ['reel', 'Reel'],
  ['carrossel', 'Carrossel'],
  ['post', 'Post'],
  ['story', 'Story'],
];

/** Selo colorido por formato (só decorativo). */
const FORMAT_TONES: Record<string, { chip: string; text: string }> = {
  reel: { chip: 'bg-fuchsia-500/15', text: 'text-fuchsia-300' },
  carrossel: { chip: 'bg-blue-500/15', text: 'text-blue-300' },
  post: { chip: 'bg-emerald-500/15', text: 'text-emerald-300' },
  story: { chip: 'bg-amber-500/15', text: 'text-amber-300' },
};
const FORMAT_FALLBACK = { chip: 'bg-gray-600/20', text: 'text-gray-300' };

// ============================================================
// Classificação (as fórmulas da planilha, em código)
// ============================================================

type Classe = 'forte' | 'saudavel' | 'abaixo' | 'na';

const CLASSE_TONE: Record<Classe, { label: string; pill: string; dot: string }> = {
  forte: { label: 'Forte', pill: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', dot: 'bg-emerald-400' },
  saudavel: { label: 'Saudável', pill: 'border-sky-500/30 bg-sky-500/10 text-sky-300', dot: 'bg-sky-400' },
  abaixo: { label: 'Abaixo', pill: 'border-red-500/30 bg-red-500/10 text-red-300', dot: 'bg-red-400' },
  na: { label: 'Sem referência', pill: 'border-gray-600/40 bg-gray-700/40 text-gray-400', dot: 'bg-gray-500' },
};

/** value < saudável → Abaixo; value >= forte → Forte; senão Saudável (igual à planilha). */
function classify(value: number | null, bench: Threshold | undefined): Classe {
  if (bench == null || value == null || !Number.isFinite(value)) return 'na';
  const [saud, forte] = bench;
  if (value >= forte) return 'forte';
  if (value < saud) return 'abaixo';
  return 'saudavel';
}

/** Métricas derivadas + classificação de UMA linha (post). */
interface Derived {
  taxaCurtidas: number | null;
  taxaComentarios: number | null;
  taxaCompart: number | null;
  taxaSalv: number | null;
  taxaPerfil: number | null;
  conversaoSeg: number | null;
  retencao: number | null;
  classeCompart: Classe;
  classeSalv: Classe;
  classeRetencao: Classe;
  geral: Classe;
}

function derive(row: Row, bench: Record<string, FormatBenchmarks>): Derived {
  const formato = str(row.formato).toLowerCase();
  const alcance = num(row.alcance);
  const b = bench[formato];

  const taxaCompart = ratio(num(row.compartilhamentos), alcance);
  const taxaSalv = ratio(num(row.salvamentos), alcance);
  const retencao = ratio(num(row.tempo_medio_s), num(row.duracao_s));

  const classeCompart = classify(taxaCompart, b?.compartilhamentos);
  const classeSalv = classify(taxaSalv, b?.salvamentos);
  const classeRetencao = formato === 'reel' ? classify(retencao, b?.retencao) : 'na';

  const subs = [classeCompart, classeSalv, classeRetencao];
  const fortes = subs.filter((s) => s === 'forte').length;
  const abaixos = subs.filter((s) => s === 'abaixo').length;
  const aplicaveis = subs.filter((s) => s !== 'na').length;

  let geral: Classe;
  if (aplicaveis === 0) geral = 'na';
  else if (fortes >= 2) geral = 'forte';
  else if (abaixos >= 2) geral = 'abaixo';
  else geral = 'saudavel';

  return {
    taxaCurtidas: ratio(num(row.curtidas), alcance),
    taxaComentarios: ratio(num(row.comentarios), alcance),
    taxaCompart,
    taxaSalv,
    taxaPerfil: ratio(num(row.visitas_perfil), alcance),
    conversaoSeg: ratio(num(row.seguidores), alcance),
    retencao,
    classeCompart,
    classeSalv,
    classeRetencao,
    geral,
  };
}

// ============================================================
// Cliente das rotas de escrita /api/conteudo/desempenho
// ============================================================

async function apiJson(url: string, method: string, body?: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) msg = j.error;
    } catch {
      /* corpo não-JSON */
    }
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

// ============================================================
// Subcomponentes
// ============================================================

function SectionLabel({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{children}</h3>
      {aside}
    </div>
  );
}

function FormatChip({ formato }: { formato: string }) {
  const tone = FORMAT_TONES[formato.toLowerCase()] ?? FORMAT_FALLBACK;
  const abbr = (formato.slice(0, 2) || '••').toUpperCase();
  return (
    <span
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${tone.chip} ${tone.text}`}
      title={FORMATO_LABEL[formato.toLowerCase()] ?? formato}
      aria-hidden="true"
    >
      {abbr}
    </span>
  );
}

function ClassePill({ classe }: { classe: Classe }) {
  const t = CLASSE_TONE[classe];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${t.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} aria-hidden="true" />
      {t.label}
    </span>
  );
}

/** Card grande de contagem por classificação (o "Resumo") — clicável p/ filtrar a lista. */
function ResumoCard({
  classe,
  count,
  active,
  onClick,
}: {
  classe: Classe;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const t = CLASSE_TONE[classe];
  const clickable = count > 0;
  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      aria-pressed={active}
      title={clickable ? `Filtrar por ${t.label}` : undefined}
      className={`rounded-2xl border p-5 text-left shadow-sm transition-all ${
        active
          ? 'border-blue-500/60 bg-gray-800 ring-2 ring-blue-500/30'
          : 'border-gray-700/50 bg-gray-800/60'
      } ${clickable ? 'cursor-pointer hover:border-gray-600' : 'cursor-default opacity-70'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${t.dot}`} aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t.label}</span>
        </span>
        {active && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-300">filtrando</span>
        )}
      </div>
      <div className="mt-2 text-3xl font-bold text-gray-100" style={DISPLAY}>
        {count}
      </div>
      <div className="mt-0.5 text-xs text-gray-500">conteúdo{count === 1 ? '' : 's'}</div>
    </button>
  );
}

// ============================================================
// Filtro de período (padrão: últimos 7 dias)
// ============================================================

/** Presets do filtro: [rótulo, nº de dias | null p/ "tudo"]. */
const PERIODOS: ReadonlyArray<readonly [string, number | null]> = [
  ['7 dias', 7],
  ['14 dias', 14],
  ['30 dias', 30],
  ['90 dias', 90],
  ['Tudo', null],
];

/** Período padrão da aba, em dias (null = tudo). */
const PERIODO_PADRAO = 7;

/**
 * Início do dia (00:00 local) de `dias` atrás — corte inclusivo do filtro.
 * Ex.: dias=7 hoje 29/07 → 23/07 00:00 (janela dos últimos 7 dias corridos).
 */
function cortePeriodo(dias: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (dias - 1));
  return d;
}

/** Segmented control de período. */
function PeriodPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-xl border border-gray-700/60 bg-gray-800/40 p-0.5"
      role="group"
      aria-label="Período avaliado"
    >
      {PERIODOS.map(([label, days]) => {
        const active = value === days;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(days)}
            aria-pressed={active}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              active ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/25' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Editor de medição (modal) — a entrada MANUAL dos números
// ============================================================

/** Campos do formulário (tudo string enquanto edita; convertido no envio). */
interface FormState {
  id: string | null;
  data: string;
  formato: string;
  tema: string;
  alcance: string;
  visualizacoes: string;
  curtidas: string;
  comentarios: string;
  compartilhamentos: string;
  salvamentos: string;
  visitasPerfil: string;
  seguidores: string;
  duracaoS: string;
  tempoMedioS: string;
  permalink: string;
}

function emptyForm(): FormState {
  const now = new Date();
  return {
    id: null,
    data: `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`,
    formato: 'reel',
    tema: '',
    alcance: '',
    visualizacoes: '',
    curtidas: '',
    comentarios: '',
    compartilhamentos: '',
    salvamentos: '',
    visitasPerfil: '',
    seguidores: '',
    duracaoS: '',
    tempoMedioS: '',
    permalink: '',
  };
}

function formFromRow(row: Row): FormState {
  return {
    id: str(row.id) || null,
    data: toDateInput(row.data),
    formato: (str(row.formato) || 'reel').toLowerCase(),
    tema: str(row.tema),
    alcance: str(row.alcance),
    visualizacoes: str(row.visualizacoes),
    curtidas: str(row.curtidas),
    comentarios: str(row.comentarios),
    compartilhamentos: str(row.compartilhamentos),
    salvamentos: str(row.salvamentos),
    visitasPerfil: str(row.visitas_perfil),
    seguidores: str(row.seguidores),
    duracaoS: str(row.duracao_s),
    tempoMedioS: str(row.tempo_medio_s),
    permalink: str(row.permalink),
  };
}

/** Converte o form em payload da API (strings vazias viram null). */
function formToPayload(f: FormState): Record<string, unknown> {
  const n = (s: string) => (s.trim() === '' ? null : Number(s));
  return {
    data: f.data || null,
    formato: f.formato,
    tema: f.tema.trim() || null,
    alcance: n(f.alcance),
    visualizacoes: n(f.visualizacoes),
    curtidas: n(f.curtidas),
    comentarios: n(f.comentarios),
    compartilhamentos: n(f.compartilhamentos),
    salvamentos: n(f.salvamentos),
    visitasPerfil: n(f.visitasPerfil),
    seguidores: n(f.seguidores),
    duracaoS: n(f.duracaoS),
    tempoMedioS: n(f.tempoMedioS),
    permalink: f.permalink.trim() || null,
  };
}

const labelCls = 'text-[11px] font-medium uppercase tracking-wide text-gray-500';

/** Campo numérico rotulado. */
function NumField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hint ?? '—'}
        className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-[15px] text-gray-100 placeholder-gray-600 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
      />
    </label>
  );
}

function EditorModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: FormState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const patch = (p: Partial<FormState>) => setF((prev) => ({ ...prev, ...p }));
  const editing = f.id != null;

  async function salvar() {
    setSaving(true);
    setError(null);
    try {
      const payload = formToPayload(f);
      if (editing) {
        await apiJson(`/api/conteudo/desempenho/${f.id}`, 'PATCH', payload);
      } else {
        await apiJson('/api/conteudo/desempenho', 'POST', payload);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  // Portal no <body>: o <main> do shell (animate-rise) cria um containing block
  // para `position: fixed`, o que jogaria o modal pro meio do documento (fora da
  // tela). No body, o `fixed inset-0` fica relativo à viewport — sempre centrado.
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-700/60 bg-gray-900 p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100" style={DISPLAY}>
            {editing ? 'Editar medição' : 'Nova medição'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 hover:bg-gray-700/50 hover:text-gray-100"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Identificação */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className={labelCls}>Data</span>
            <input
              type="date"
              value={f.data}
              onChange={(e) => patch({ data: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-[15px] text-gray-100 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            />
          </label>
          <label className="block">
            <span className={labelCls}>Formato</span>
            <select
              value={f.formato}
              onChange={(e) => patch({ formato: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-[15px] text-gray-100 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            >
              {FORMATO_OPTS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-1">
            <span className={labelCls}>Tema</span>
            <input
              type="text"
              value={f.tema}
              onChange={(e) => patch({ tema: e.target.value })}
              placeholder="ex.: gancho educativo"
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-[15px] text-gray-100 placeholder-gray-600 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            />
          </label>
        </div>

        {/* Números (o que a criadora copia do Instagram) */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <NumField label="Alcance" value={f.alcance} onChange={(v) => patch({ alcance: v })} />
          <NumField label="Visualizações" value={f.visualizacoes} onChange={(v) => patch({ visualizacoes: v })} />
          <NumField label="Curtidas" value={f.curtidas} onChange={(v) => patch({ curtidas: v })} />
          <NumField label="Comentários" value={f.comentarios} onChange={(v) => patch({ comentarios: v })} />
          <NumField label="Compart." value={f.compartilhamentos} onChange={(v) => patch({ compartilhamentos: v })} />
          <NumField label="Salvamentos" value={f.salvamentos} onChange={(v) => patch({ salvamentos: v })} />
          <NumField label="Visitas perfil" value={f.visitasPerfil} onChange={(v) => patch({ visitasPerfil: v })} />
          <NumField label="Seguidores" value={f.seguidores} onChange={(v) => patch({ seguidores: v })} />
          <div />
        </div>

        {/* Só Reel: duração + tempo médio alimentam a retenção */}
        {f.formato === 'reel' && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <NumField label="Duração (s)" value={f.duracaoS} onChange={(v) => patch({ duracaoS: v })} />
            <NumField label="Tempo médio (s)" value={f.tempoMedioS} onChange={(v) => patch({ tempoMedioS: v })} />
            <div className="flex items-end pb-2 text-[11px] text-gray-500">
              Retenção = tempo médio ÷ duração
            </div>
          </div>
        )}

        <label className="mt-3 block">
          <span className={labelCls}>Link do post (opcional)</span>
          <input
            type="url"
            inputMode="url"
            value={f.permalink}
            onChange={(e) => patch({ permalink: e.target.value })}
            placeholder="https://instagram.com/p/…"
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-[15px] text-gray-100 placeholder-gray-600 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
          />
        </label>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700/50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ============================================================
// Médias por formato (a aba "Resumo" → "Médias por formato")
// ============================================================

/** Média das taxas prioritárias de um formato + classificação de cada média. */
interface FormatAvg {
  formato: string;
  count: number;
  metrics: Array<{ label: string; avg: number | null; classe: Classe; bench?: Threshold }>;
}

function mean(vals: Array<number | null>): number | null {
  const ok = vals.filter((v): v is number => v != null && Number.isFinite(v));
  if (ok.length === 0) return null;
  return ok.reduce((a, b) => a + b, 0) / ok.length;
}

/** Faixa de meta [saudável, forte] → "0,3%–1%". null/ausente vira ''. */
function fmtFaixa(b: Threshold | undefined): string {
  if (!b) return '';
  return `${fmtRate(b[0])}–${fmtRate(b[1])}`;
}

function buildFormatAverages(
  rows: Row[],
  derived: Derived[],
  bench: Record<string, FormatBenchmarks>,
): FormatAvg[] {
  const order = ['reel', 'carrossel', 'post', 'story'];
  const byFormat = new Map<string, number[]>(); // formato → índices
  rows.forEach((r, i) => {
    const fmt = str(r.formato).toLowerCase();
    const arr = byFormat.get(fmt);
    if (arr) arr.push(i);
    else byFormat.set(fmt, [i]);
  });

  const out: FormatAvg[] = [];
  for (const fmt of order) {
    const idxs = byFormat.get(fmt);
    if (!idxs || idxs.length === 0) continue;
    const b = bench[fmt];
    const compart = mean(idxs.map((i) => derived[i].taxaCompart));
    const salv = mean(idxs.map((i) => derived[i].taxaSalv));
    const metrics: FormatAvg['metrics'] = [
      { label: 'Compart.', avg: compart, classe: classify(compart, b?.compartilhamentos), bench: b?.compartilhamentos },
      { label: 'Salvamentos', avg: salv, classe: classify(salv, b?.salvamentos), bench: b?.salvamentos },
    ];
    if (fmt === 'reel') {
      const ret = mean(idxs.map((i) => derived[i].retencao));
      metrics.push({ label: 'Retenção', avg: ret, classe: classify(ret, b?.retencao), bench: b?.retencao });
    }
    out.push({ formato: fmt, count: idxs.length, metrics });
  }
  return out;
}

function FormatAveragesCard({ fa }: { fa: FormatAvg }) {
  return (
    <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <FormatChip formato={fa.formato} />
        <div>
          <div className="text-sm font-semibold text-gray-100" style={DISPLAY}>
            {FORMATO_LABEL[fa.formato] ?? fa.formato}
          </div>
          <div className="text-[11px] text-gray-500">
            {fa.count} conteúdo{fa.count === 1 ? '' : 's'}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {fa.metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400">{m.label}</span>
            <span className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-100 tabular-nums">{fmtRate(m.avg)}</span>
              {m.bench && (
                <span
                  className="whitespace-nowrap text-[11px] text-gray-500 tabular-nums"
                  title={`Meta: Saudável a partir de ${fmtRate(m.bench[0])}, Forte a partir de ${fmtRate(m.bench[1])}`}
                >
                  meta {fmtFaixa(m.bench)}
                </span>
              )}
              <span
                className={`h-2 w-2 rounded-full ${CLASSE_TONE[m.classe].dot}`}
                title={CLASSE_TONE[m.classe].label}
                aria-label={CLASSE_TONE[m.classe].label}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Cartão de conteúdo (grid 2-up, expansível, com prévia do post)
// ============================================================

/** URL de embed do Instagram a partir do permalink (post/reel/tv). null se não casar. */
function instagramEmbedUrl(permalink: string): string | null {
  const m = permalink.match(/instagram\.com\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  if (!m) return null;
  const tipo = m[1].toLowerCase() === 'reels' ? 'reel' : m[1].toLowerCase();
  return `https://www.instagram.com/${tipo}/${m[2]}/embed`;
}

/** Segundos formatados ("42s") ou "—". */
function fmtSeg(value: unknown): string {
  const n = num(value);
  return n == null ? '—' : `${fmtInt(n)}s`;
}

/** Métrica inline do cartão colapsado: rótulo + valor + bolinha da classificação. */
function MetricInline({ label, value, classe }: { label: string; value: string; classe?: Classe }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {classe && classe !== 'na' && (
        <span className={`h-1.5 w-1.5 rounded-full ${CLASSE_TONE[classe].dot}`} aria-hidden="true" />
      )}
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-200 tabular-nums">{value}</span>
    </span>
  );
}

/** Célula de número no painel expandido (valor cru + taxa opcional + classe + meta). */
function Stat({
  label,
  raw,
  rate,
  classe,
  meta,
}: {
  label: string;
  raw: string;
  rate?: string;
  classe?: Classe;
  /** Faixa de meta (Saudável–Forte) já formatada, ex.: "0,5%–2%". */
  meta?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-700/40 bg-gray-900/40 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-500">
        {classe && classe !== 'na' && (
          <span className={`h-1.5 w-1.5 rounded-full ${CLASSE_TONE[classe].dot}`} aria-hidden="true" />
        )}
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-gray-100 tabular-nums">{raw}</div>
      {rate && <div className="text-[11px] text-gray-400 tabular-nums">{rate} do alcance</div>}
      {meta && <div className="text-[11px] text-gray-500 tabular-nums">meta {meta}</div>}
    </div>
  );
}

function ContentCard({
  row,
  d,
  bench,
  busy,
  onEdit,
  onDelete,
}: {
  row: Row;
  d: Derived;
  bench: Record<string, FormatBenchmarks>;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const formato = str(row.formato).toLowerCase();
  const b = bench[formato];
  const tema = str(row.tema) || 'Sem tema';
  const permalink = str(row.permalink);
  const embedUrl = permalink ? instagramEmbedUrl(permalink) : null;
  const isReel = formato === 'reel';

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-gray-800/60 shadow-sm transition-colors ${
        open ? 'border-gray-600/70' : 'border-gray-700/50'
      } ${busy ? 'opacity-50' : ''}`}
    >
      {/* Cabeçalho clicável = resumo + toggle: um clique abre detalhes + prévia. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="block w-full px-4 py-3.5 text-left transition-colors hover:bg-gray-700/20"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <FormatChip formato={formato} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-gray-500">
                <span>{fmtData(row.data)}</span>
                <span aria-hidden="true">·</span>
                <span>{FORMATO_LABEL[formato] ?? formato}</span>
                {permalink && (
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <span aria-hidden="true">·</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                    publicado
                  </span>
                )}
              </div>
              <div
                className="line-clamp-2 text-sm font-semibold text-gray-100"
                style={DISPLAY}
                title={tema}
              >
                {tema}
              </div>
            </div>
          </div>
          <ClassePill classe={d.geral} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            <MetricInline label="Alcance" value={fmtInt(num(row.alcance))} />
            <MetricInline label="Compart." value={fmtRate(d.taxaCompart)} classe={d.classeCompart} />
            <MetricInline label="Salvos" value={fmtRate(d.taxaSalv)} classe={d.classeSalv} />
            {isReel && (
              <MetricInline label="Retenção" value={fmtRate(d.retencao)} classe={d.classeRetencao} />
            )}
          </div>
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-gray-400">
            {open ? 'menos' : 'detalhes'}
            <svg
              className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>
      </button>

      {/* Painel expandido: prévia do post + todos os números + ações. */}
      {open && (
        <div className="space-y-4 border-t border-gray-700/50 px-4 py-4">
          {embedUrl && (
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Prévia do post
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-700/50 bg-black/20">
                <iframe
                  src={embedUrl}
                  title={`Prévia — ${tema}`}
                  loading="lazy"
                  scrolling="no"
                  className="h-[460px] w-full"
                />
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Todos os números
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat label="Alcance" raw={fmtInt(num(row.alcance))} />
              <Stat label="Visualizações" raw={fmtInt(num(row.visualizacoes))} />
              <Stat label="Curtidas" raw={fmtInt(num(row.curtidas))} rate={fmtRate(d.taxaCurtidas)} />
              <Stat label="Comentários" raw={fmtInt(num(row.comentarios))} rate={fmtRate(d.taxaComentarios)} />
              <Stat
                label="Compart."
                raw={fmtInt(num(row.compartilhamentos))}
                rate={fmtRate(d.taxaCompart)}
                classe={d.classeCompart}
                meta={fmtFaixa(b?.compartilhamentos) || undefined}
              />
              <Stat
                label="Salvamentos"
                raw={fmtInt(num(row.salvamentos))}
                rate={fmtRate(d.taxaSalv)}
                classe={d.classeSalv}
                meta={fmtFaixa(b?.salvamentos) || undefined}
              />
              <Stat label="Visitas perfil" raw={fmtInt(num(row.visitas_perfil))} rate={fmtRate(d.taxaPerfil)} />
              <Stat label="Seguidores" raw={fmtInt(num(row.seguidores))} rate={fmtRate(d.conversaoSeg)} />
              {isReel && (
                <>
                  <Stat label="Duração" raw={fmtSeg(row.duracao_s)} />
                  <Stat label="Tempo médio" raw={fmtSeg(row.tempo_medio_s)} />
                  <Stat
                    label="Retenção"
                    raw={fmtRate(d.retencao)}
                    classe={d.classeRetencao}
                    meta={fmtFaixa(b?.retencao) || undefined}
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {permalink && (
              <a
                href={permalink}
                target="_blank"
                rel="noreferrer"
                className="mr-auto rounded-lg border border-gray-600/50 px-3 py-1.5 text-xs font-medium text-blue-300 transition-colors hover:bg-blue-500/10"
              >
                abrir no Instagram ↗
              </a>
            )}
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700/50 hover:text-gray-100"
            >
              ✎ Editar
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
            >
              🗑 Remover
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Bloco principal
// ============================================================

function ConteudoDesempenhoBlock({ config, ctx }: BlockProps<ConteudoDesempenhoConfig>) {
  const { data, loading, error } = ctx;
  const reload = ctx.actions.reload;

  const bench = config.benchmarks ?? DEFAULT_BENCH;

  // Período avaliado (padrão: últimos 7 dias). null = tudo.
  const [periodDays, setPeriodDays] = useState<number | null>(PERIODO_PADRAO);

  // Todas as medições, mais recentes primeiro (sem data vai ao fim).
  const sortedRows = useMemo(() => {
    const list = asRows(data);
    return [...list].sort((a, b) => {
      const da = str(a.data);
      const db = str(b.data);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db.localeCompare(da);
    });
  }, [data]);

  // Recorte pelo período: só as linhas COM data dentro da janela (as sem data
  // só aparecem em "Tudo"). É o que a tela avalia — resumo, médias e lista.
  const { rows, cutoffLabel } = useMemo(() => {
    if (periodDays == null) return { rows: sortedRows, cutoffLabel: null as string | null };
    const corte = cortePeriodo(periodDays).getTime();
    const filtered = sortedRows.filter((r) => {
      const s = str(r.data);
      if (!s) return false;
      const t = new Date(s).getTime();
      return Number.isFinite(t) && t >= corte;
    });
    return { rows: filtered, cutoffLabel: fmtData(cortePeriodo(periodDays).toISOString()) };
  }, [sortedRows, periodDays]);

  const derived = useMemo(() => rows.map((r) => derive(r, bench)), [rows, bench]);

  const resumo = useMemo(() => {
    const acc = { forte: 0, saudavel: 0, abaixo: 0, na: 0 } as Record<Classe, number>;
    for (const d of derived) acc[d.geral] += 1;
    return acc;
  }, [derived]);

  const formatAverages = useMemo(
    () => buildFormatAverages(rows, derived, bench),
    [rows, derived, bench],
  );

  // Editor (modal): null = fechado; senão o form inicial.
  const [editing, setEditing] = useState<FormState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Filtro por classificação (clique nos cards do resumo). null = todas as classes.
  const [classeFiltro, setClasseFiltro] = useState<Classe | null>(null);
  const toggleClasse = useCallback((c: Classe) => {
    setClasseFiltro((prev) => (prev === c ? null : c));
  }, []);

  // Sincronização com o Instagram (puxa os números reais dos últimos posts).
  const [sincronizando, setSincronizando] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ tone: 'ok' | 'erro'; text: string } | null>(null);

  const sincronizar = useCallback(async () => {
    setSincronizando(true);
    setSyncMsg(null);
    try {
      const r = (await apiJson('/api/conteudo/desempenho/sync', 'POST', { limit: 25 })) as {
        inserted: number;
        updated: number;
        total: number;
        followers: number | null;
      };
      setSyncMsg({
        tone: 'ok',
        text:
          `Sincronizado do Instagram: ${r.total} posts (${r.inserted} novos, ${r.updated} atualizados)` +
          `${r.followers != null ? ` · ${r.followers.toLocaleString('pt-BR')} seguidores` : ''}.`,
      });
      reload?.();
    } catch (e) {
      setSyncMsg({ tone: 'erro', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setSincronizando(false);
    }
  }, [reload]);

  const onSaved = useCallback(() => {
    setEditing(null);
    if (reload) reload();
  }, [reload]);

  const onDelete = useCallback(
    async (id: string) => {
      if (!id) return;
      if (!window.confirm('Remover esta medição?')) return;
      setBusyId(id);
      try {
        await apiJson(`/api/conteudo/desempenho/${id}`, 'DELETE');
        if (reload) reload();
      } catch (e) {
        window.alert(e instanceof Error ? e.message : String(e));
      } finally {
        setBusyId(null);
      }
    },
    [reload],
  );

  const addBtn = (
    <button
      type="button"
      onClick={() => setEditing(emptyForm())}
      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition-opacity hover:opacity-90"
    >
      <span aria-hidden="true">＋</span> Adicionar medição
    </button>
  );

  if (loading) {
    return (
      <div>
        <SectionHeader title="Resumo de desempenho" subtitle="Carregando…" icon="📊" />
        <SkeletonCards count={3} columns={3} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <SectionHeader title="Resumo de desempenho" icon="📊" />
        <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />
      </div>
    );
  }

  const allTotal = sortedRows.length;
  const total = rows.length;
  const periodoLabel = PERIODOS.find(([, d]) => d === periodDays)?.[0] ?? 'Tudo';

  // Lista visível: aplica o filtro por classificação (mantém o pareamento row↔derived).
  const pares = rows.map((r, i) => ({ r, d: derived[i], id: str(r.id) || `row-${i}` }));
  const visible = classeFiltro ? pares.filter((p) => p.d.geral === classeFiltro) : pares;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          title="Resumo de desempenho"
          subtitle="Como cada conteúdo se saiu — taxas e classificação calculadas automaticamente."
          icon="📊"
        />
        <div className="flex flex-wrap items-center gap-2">
          <PeriodPicker value={periodDays} onChange={setPeriodDays} />
          <button
            type="button"
            onClick={sincronizar}
            disabled={sincronizando}
            title="Puxar alcance, salvamentos, views etc. dos últimos posts do Instagram"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 px-3.5 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true" className={sincronizando ? 'inline-block animate-spin' : ''}>↻</span>
            {sincronizando ? 'Sincronizando…' : 'Sincronizar'}
          </button>
          {addBtn}
        </div>
      </div>

      {syncMsg && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-xl border px-4 py-2.5 text-sm ${
            syncMsg.tone === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/30 bg-red-500/10 text-red-200'
          }`}
        >
          <span aria-hidden="true">{syncMsg.tone === 'ok' ? '✅' : '⚠️'}</span>
          <span>{syncMsg.text}</span>
        </div>
      )}

      {allTotal === 0 ? (
        <EmptyState
          icon="📈"
          message="Nenhuma medição ainda. Clique em “Adicionar medição” e cole os números de um post — as taxas e a classificação saem sozinhas."
        />
      ) : total === 0 ? (
        <EmptyState
          icon="🗓️"
          message={`Nenhum conteúdo nos ${periodoLabel === 'Tudo' ? 'registros' : `últimos ${periodoLabel}`}. Troque o período acima ou sincronize os posts recentes.`}
        />
      ) : (
        <>
          {/* 1) RESUMO — contagem por classificação */}
          <div>
            <SectionLabel
              aside={
                <span className="text-[11px] font-medium text-gray-500">
                  {periodDays == null
                    ? 'todos os conteúdos'
                    : `últimos ${periodoLabel}${cutoffLabel ? ` · desde ${cutoffLabel}` : ''}`}
                </span>
              }
            >
              Resumo do período
            </SectionLabel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ResumoCard
                classe="forte"
                count={resumo.forte}
                active={classeFiltro === 'forte'}
                onClick={() => toggleClasse('forte')}
              />
              <ResumoCard
                classe="saudavel"
                count={resumo.saudavel}
                active={classeFiltro === 'saudavel'}
                onClick={() => toggleClasse('saudavel')}
              />
              <ResumoCard
                classe="abaixo"
                count={resumo.abaixo}
                active={classeFiltro === 'abaixo'}
                onClick={() => toggleClasse('abaixo')}
              />
              <button
                type="button"
                onClick={() => setClasseFiltro(null)}
                aria-pressed={classeFiltro === null}
                title="Mostrar todos"
                className={`rounded-2xl border p-5 text-left shadow-sm transition-all ${
                  classeFiltro === null
                    ? 'border-blue-500/60 bg-gray-800 ring-2 ring-blue-500/30'
                    : 'cursor-pointer border-gray-700/50 bg-gray-800/60 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Total medido</span>
                  {classeFiltro !== null && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-300">ver todos</span>
                  )}
                </div>
                <div className="mt-2 text-3xl font-bold text-gray-100" style={DISPLAY}>
                  {total}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {resumo.na > 0 ? `${resumo.na} sem referência` : 'conteúdos'}
                </div>
              </button>
            </div>
          </div>

          {/* 2) MÉDIAS POR FORMATO */}
          {formatAverages.length > 0 && (
            <div>
              <SectionLabel>Médias por formato</SectionLabel>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {formatAverages.map((fa) => (
                  <FormatAveragesCard key={fa.formato} fa={fa} />
                ))}
              </div>
            </div>
          )}

          {/* 3) CONTEÚDOS — cartões 2-up, expansíveis, com prévia do post */}
          <div>
            <SectionLabel
              aside={
                classeFiltro ? (
                  <button
                    type="button"
                    onClick={() => setClasseFiltro(null)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-600/50 px-2.5 py-1 text-[11px] font-medium text-gray-300 transition-colors hover:bg-gray-700/50"
                    title="Limpar filtro"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${CLASSE_TONE[classeFiltro].dot}`} aria-hidden="true" />
                    {CLASSE_TONE[classeFiltro].label}
                    <span className="text-gray-500" aria-hidden="true">✕</span>
                  </button>
                ) : undefined
              }
            >
              Conteúdos medidos{classeFiltro ? ` · ${visible.length}` : ''}
            </SectionLabel>
            {visible.length === 0 ? (
              <EmptyState
                icon="🔍"
                message={`Nenhum conteúdo "${classeFiltro ? CLASSE_TONE[classeFiltro].label : ''}" neste período. Clique de novo no card (ou em “Total medido”) para limpar o filtro.`}
              />
            ) : (
              <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
                {visible.map(({ r, d, id }) => (
                  <ContentCard
                    key={id}
                    row={r}
                    d={d}
                    bench={bench}
                    busy={busyId === str(r.id)}
                    onEdit={() => setEditing(formFromRow(r))}
                    onDelete={() => onDelete(str(r.id))}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Referência (colapsável): como ler as métricas — pra pessoas e pra IA. */}
      <GuiaMetricas />

      {editing && (
        <EditorModal initial={editing} onClose={() => setEditing(null)} onSaved={onSaved} />
      )}
    </div>
  );
}

/** Definição registrável do bloco custom "Resumo de desempenho". */
export const conteudoDesempenho: BlockDefinition = {
  type: 'custom:conteudo-desempenho',
  component: ConteudoDesempenhoBlock,
  defaultDataShape: 'collection',
};
