/**
 * apps/dobro — bloco CUSTOM: "Painel de Conteúdo" (dashboard do criador).
 *
 * Substitui o board kanban na tela /conteudo. Compõe, com a linguagem "com
 * vida" do OS:
 *   1) SEÇÃO DE MÉTRICAS (topo):
 *        · Crescimento do perfil — herói de seguidores + 5 janelas (semana,
 *          mês, 3m, 6m, 1 ano). Enquanto a conta do Instagram não estiver
 *          conectada (token de Insights), esses cards ficam em estado
 *          "conectar" — NUNCA mostramos número inventado.
 *        · Engajamento (últimos dias) — interações, média por post, melhor
 *          post e um top de posts. Alimentado com dado REAL do perfil.
 *   2) RESUMO — próximos posts do planejamento (dado REAL de v_conteudo_posts).
 *   3) PLANEJAMENTO — alterna entre AGENDA (calendário clicável: clique num dia
 *      para ver os posts) e LISTA (todos os conteúdos). O botão "Atualizar
 *      cronograma" abre um painel onde o criador cadastra/edita/remove os posts
 *      da semana (grava de verdade via as rotas autenticadas /api/conteudo).
 *
 * Herda o skin (o azul-base vira o roxo do Dobro). Campos e textos vêm de
 * `config` (manifesto); as métricas vêm de `config.metrics`.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { SectionHeader, EmptyState, SkeletonCards } from '@os/core';
import type { BlockDefinition, BlockProps } from '@os/core';

// ============================================================
// Helpers de dados (locais — o bloco não importa internals de @os/blocks)
// ============================================================

type Row = Record<string, unknown>;

function asRows(data: unknown): Row[] {
  if (Array.isArray(data)) return data.filter((r): r is Row => r != null && typeof r === 'object');
  if (data != null && typeof data === 'object') return [data as Row];
  return [];
}

function toText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

/** Fonte de display: Fraunces no skin que a define; senão herda o sans. */
const DISPLAY = { fontFamily: 'var(--font-display, inherit)' } as const;

const MESES_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
/** Abreviação por getDay() (0=domingo … 6=sábado). */
const DIA_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function parseDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → "12 mar". */
function fmtDiaMes(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${MESES_ABBR[d.getMonth()]}`;
}

/** Inteiro pt-BR (1234 → "1.234"). */
function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('pt-BR');
}

/** Número compacto (1234 → "1,2 mil"; 12000 → "12 mil"). */
function fmtCompact(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) < 1000) return fmtInt(n);
  const mil = n / 1000;
  return `${mil.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
}

/** Δ% assinado ("+12,5%" / "-3%"). */
function fmtPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

// ---- Helpers de DIA (chave 'YYYY-MM-DD', sem drift de fuso) ----

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 'YYYY-MM-DD' da data LOCAL. */
function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Extrai a chave de dia 'YYYY-MM-DD' de um valor (ISO ou Date-string) ou null. */
function toDayKey(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : localDayKey(d);
}

/** 'YYYY-MM-DD' → Date local (meio-dia, para exibição sem drift). */
function dayKeyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Segunda-feira (00:00 local) da semana que contém `d`. */
function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const off = (x.getDay() + 6) % 7; // 0 = segunda
  x.setDate(x.getDate() - off);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

// ============================================================
// Config + paletas
// ============================================================

type StatusTone = 'ready' | 'progress' | 'done' | 'neutral';

interface StatusEntry {
  label: string;
  tone: StatusTone;
}

interface GrowthDelta {
  deltaAbs: number;
  deltaPct: number;
}

interface MetricsConfig {
  /** Quando as métricas foram coletadas (ISO ou 'YYYY-MM-DD'). */
  updatedAt?: string;
  /** 'seed' = coletado à mão; 'live' = sync automático. */
  source?: 'seed' | 'live';
  followers?: { current: number | null; series?: number[] | null } | null;
  growth?: {
    week?: GrowthDelta | null;
    month?: GrowthDelta | null;
    q3?: GrowthDelta | null;
    h6?: GrowthDelta | null;
    y1?: GrowthDelta | null;
  } | null;
  engagement?: {
    windowDays?: number;
    interactions?: number;
    avgPerPost?: number;
    postsCount?: number;
    best?: { title: string; likes: number; comments: number; permalink?: string } | null;
  } | null;
  topPosts?: Array<{
    title: string;
    type?: string;
    likes: number;
    comments: number;
    date?: string;
    permalink?: string;
  }> | null;
}

interface ConteudoDashboardConfig {
  titleField?: string;
  dateField?: string;
  formatField?: string;
  statusField?: string;
  linkField?: string;
  linkLabel?: string;
  resumoLabel?: string;
  newPostLabel?: string;
  /** Rótulo do botão que abre o painel de cronograma. Default: "Atualizar cronograma". */
  updateScheduleLabel?: string;
  /** Se definido, o botão "Novo post" vira um link; senão fica "Em breve". */
  newPostHref?: string;
  /** Máximo de posts na faixa "Resumo". Default: 6. */
  limit?: number;
  statusMap?: Record<string, StatusEntry>;
  metrics?: MetricsConfig;
}

/** Classes por tom de estado (o azul-base vira roxo no skin do Dobro). */
const STATUS_TONES: Record<StatusTone, { pill: string; dot: string }> = {
  ready: { pill: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', dot: 'bg-emerald-400' },
  progress: { pill: 'border-amber-500/30 bg-amber-500/10 text-amber-300', dot: 'bg-amber-400' },
  done: { pill: 'border-blue-500/30 bg-blue-500/10 text-blue-300', dot: 'bg-blue-400' },
  neutral: { pill: 'border-gray-600/40 bg-gray-700/40 text-gray-300', dot: 'bg-gray-400' },
};

const DEFAULT_STATUS: Record<string, StatusEntry> = {
  rascunho: { label: 'Rascunho', tone: 'progress' },
  pronto: { label: 'Pronto', tone: 'ready' },
  publicado: { label: 'Publicado', tone: 'done' },
};

/** Selo colorido por formato (cor só decorativa; abreviação vem do próprio texto). */
const FORMAT_TONES: Record<string, { chip: string; text: string }> = {
  reel: { chip: 'bg-fuchsia-500/15', text: 'text-fuchsia-300' },
  reels: { chip: 'bg-fuchsia-500/15', text: 'text-fuchsia-300' },
  carrossel: { chip: 'bg-blue-500/15', text: 'text-blue-300' },
  carousel: { chip: 'bg-blue-500/15', text: 'text-blue-300' },
  story: { chip: 'bg-amber-500/15', text: 'text-amber-300' },
  stories: { chip: 'bg-amber-500/15', text: 'text-amber-300' },
  post: { chip: 'bg-emerald-500/15', text: 'text-emerald-300' },
  imagem: { chip: 'bg-emerald-500/15', text: 'text-emerald-300' },
  video: { chip: 'bg-rose-500/15', text: 'text-rose-300' },
};

const FORMAT_FALLBACK = { chip: 'bg-gray-600/20', text: 'text-gray-300' };

/** As 5 janelas de crescimento pedidas, na ordem de exibição. */
const GROWTH_PERIODS = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'q3', label: '3 meses' },
  { key: 'h6', label: '6 meses' },
  { key: 'y1', label: '1 ano' },
] as const;

/** Opções de formato/estado do editor de cronograma (bate com o backend). */
const FORMATO_OPTS: ReadonlyArray<[string, string]> = [
  ['carrossel', 'Carrossel'],
  ['reels', 'Reels'],
  ['story', 'Story'],
  ['post', 'Post'],
];
const ESTADO_OPTS: ReadonlyArray<[string, string]> = [
  ['rascunho', 'Rascunho'],
  ['pronto', 'Pronto'],
  ['publicado', 'Publicado'],
];

/** Nomes fixos das colunas extras da view (fora dos campos configuráveis). */
const CTA_KEY = 'cta_final';
const LINK_KEY = 'link_presente_notion';
/** Colunas de briefing (planejamento) — só usadas na tela de edição do cronograma. */
const BRIEFING_URL_KEY = 'briefing_url';
const BRIEFING_KEY = 'briefing';
const REFS_KEY = 'refs_links';

// ============================================================
// Cliente das rotas de escrita /api/conteudo (mesma origem, cookie de sessão)
// ============================================================

/** Payload de criação/edição de um post do cronograma. */
interface PostInput {
  titulo: string;
  formato: string;
  estado: string;
  ctaFinal: string | null;
  linkPresenteNotion: string | null;
  dataProgramada: string | null;
  briefingUrl: string | null;
  briefing: string | null;
  refsLinks: string | null;
}

/** fetch JSON com credenciais; extrai `error` do corpo em falha. */
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
      /* corpo não-JSON — mantém o fallback */
    }
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

// ============================================================
// Subcomponentes de métricas
// ============================================================

/** Rótulo de seção (uppercase discreto), com ação opcional à direita. */
function SectionLabel({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{children}</h3>
      {aside}
    </div>
  );
}

/** Gráfico de área (SVG) que herda a cor do container via `currentColor`. */
function AreaChart({ series, className }: { series: number[]; className?: string }) {
  if (series.length < 2) return null;
  const W = 100;
  const H = 40;
  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = max - min || 1;
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="cd-area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#cd-area-fill)" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Herói de seguidores. Estado "conectar" quando ainda não há dado real. */
function FollowersHero({
  current,
  series,
  week,
}: {
  current: number | null | undefined;
  series: number[] | null | undefined;
  week: GrowthDelta | null | undefined;
}) {
  const connected = current != null && Number.isFinite(current);
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 p-6 text-white shadow-xl shadow-blue-500/25 lg:col-span-2">
      <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Seguidores</div>
          {connected ? (
            <>
              <div className="mt-2 text-4xl leading-none tracking-tight" style={DISPLAY}>{fmtInt(current)}</div>
              {week && Number.isFinite(week.deltaPct) && (
                <div className="mt-2 text-xs text-white/80">
                  {fmtPct(week.deltaPct)} ({week.deltaAbs >= 0 ? '+' : ''}{fmtInt(week.deltaAbs)}) nesta semana
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mt-2 text-2xl font-semibold leading-tight" style={DISPLAY}>Conecte o Instagram</div>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-white/80">
                Assim que você conectar a conta (token de Insights), o número de seguidores e o
                crescimento em cada período aparecem aqui automaticamente.
              </p>
            </>
          )}
        </div>
        {connected && (
          <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white/90">↗ tendência</span>
        )}
      </div>
      {connected && series && series.length >= 2 && (
        <div className="relative mt-4 h-20 w-full text-white/90">
          <AreaChart series={series} className="h-full w-full" />
        </div>
      )}
    </div>
  );
}

/** Card de uma janela de crescimento. "—" quando ainda não há dado. */
function GrowthCard({ label, delta }: { label: string; delta: GrowthDelta | null | undefined }) {
  const has = delta != null && Number.isFinite(delta.deltaPct);
  const up = has && delta!.deltaPct >= 0;
  return (
    <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-4 shadow-sm">
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</div>
      {has ? (
        <>
          <div className={`mt-1.5 text-xl font-bold ${up ? 'text-emerald-300' : 'text-red-300'}`} style={DISPLAY}>
            {fmtPct(delta!.deltaPct)}
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            {delta!.deltaAbs >= 0 ? '+' : ''}{fmtInt(delta!.deltaAbs)} seguidores
          </div>
        </>
      ) : (
        <>
          <div className="mt-1.5 text-xl font-bold text-gray-600" style={DISPLAY}>—</div>
          <div className="mt-0.5 text-xs text-gray-600">aguardando conexão</div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Campos que os subcomponentes de planejamento precisam
// ============================================================

interface FieldMap {
  title: string;
  date: string;
  format: string;
  status: string;
}

/** Selo de formato (abreviação de 2 letras, cor decorativa). */
function FormatChip({ formato, size = 'md' }: { formato: string; size?: 'sm' | 'md' }) {
  const tone = FORMAT_TONES[formato.toLowerCase()] ?? FORMAT_FALLBACK;
  const abbr = (formato.slice(0, 2) || '••').toUpperCase();
  const dim = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-9 w-9 text-[11px]';
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-lg font-bold ${dim} ${tone.chip} ${tone.text}`}
      title={formato || undefined}
      aria-hidden="true"
    >
      {abbr}
    </span>
  );
}

/** Pílula de estado (Rascunho/Pronto/Publicado). */
function StatusPill({ estadoRaw, statusMap }: { estadoRaw: string; statusMap: Record<string, StatusEntry> }) {
  const estado = statusMap[estadoRaw] ?? { label: estadoRaw || '—', tone: 'neutral' as StatusTone };
  const tone = STATUS_TONES[estado.tone] ?? STATUS_TONES.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tone.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
      {estado.label}
    </span>
  );
}

/** Uma linha de post (usada no detalhe do dia e na visão Lista). */
function PostLine({
  post,
  fields,
  statusMap,
}: {
  post: Row;
  fields: FieldMap;
  statusMap: Record<string, StatusEntry>;
}) {
  const formato = toText(post[fields.format]);
  const d = parseDate(toText(post[fields.date]));
  const cta = toText(post[CTA_KEY]);
  const link = toText(post[LINK_KEY]);
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <FormatChip formato={formato} />
      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold leading-snug text-gray-100 line-clamp-2" style={DISPLAY}>
          {toText(post[fields.title]) || 'Sem título'}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
          <span>{d ? fmtDiaMes(d) : 'sem data'}</span>
          {formato ? <span>· {formato}</span> : null}
          {cta ? <span className="truncate">· {cta}</span> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <StatusPill estadoRaw={toText(post[fields.status])} statusMap={statusMap} />
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-gray-600/50 px-2.5 py-1 text-[11px] font-medium text-blue-300 transition-colors hover:bg-blue-500/10"
          >
            abrir ↗
          </a>
        ) : null}
      </div>
    </div>
  );
}

// ============================================================
// Mini-calendário CLICÁVEL (com navegação de mês)
// ============================================================

function MiniCalendar({
  monthDate,
  postsByDay,
  selectedDay,
  onSelectDay,
  onPrev,
  onNext,
}: {
  monthDate: Date;
  postsByDay: Map<string, Row[]>;
  selectedDay: string | null;
  onSelectDay: (dayKey: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayKey = localDayKey(new Date());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  let markedCount = 0;
  for (const key of postsByDay.keys()) {
    if (key.startsWith(`${year}-${pad2(month + 1)}-`)) markedCount += 1;
  }

  const navBtn =
    'grid h-7 w-7 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-gray-100';

  return (
    <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={onPrev} className={navBtn} aria-label="Mês anterior">‹</button>
        <span className="text-sm font-semibold text-gray-100" style={DISPLAY}>
          {MESES_LONGOS[month]} {year}
        </span>
        <button type="button" onClick={onNext} className={navBtn} aria-label="Próximo mês">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DIAS_SEMANA.map((d, i) => (
          <span key={`h-${i}`} className="py-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
            {d}
          </span>
        ))}
        {cells.map((cell, i) => {
          if (cell == null) return <span key={`e-${i}`} aria-hidden="true" />;
          const key = `${year}-${pad2(month + 1)}-${pad2(cell)}`;
          const count = postsByDay.get(key)?.length ?? 0;
          const hasPost = count > 0;
          const isToday = key === todayKey;
          const isSelected = key === selectedDay;

          const base = 'relative grid aspect-square place-items-center rounded-lg text-xs transition-colors';
          let cls: string;
          if (isSelected) {
            cls = 'bg-blue-500 font-semibold text-white ring-2 ring-blue-300/60';
          } else if (hasPost) {
            cls = 'bg-blue-500/20 font-semibold text-blue-200 ring-1 ring-blue-500/40 hover:bg-blue-500/30';
          } else if (isToday) {
            cls = 'font-medium text-white ring-1 ring-gray-500/70';
          } else {
            cls = 'text-gray-400';
          }

          if (!hasPost) {
            return (
              <span key={`d-${cell}`} className={`${base} ${cls}`}>
                {cell}
              </span>
            );
          }
          return (
            <button
              key={`d-${cell}`}
              type="button"
              onClick={() => onSelectDay(key)}
              className={`${base} ${cls} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80`}
              aria-label={`Dia ${cell} — ${count} post${count === 1 ? '' : 's'}`}
              aria-pressed={isSelected}
            >
              {cell}
              {count > 1 && (
                <span className="absolute bottom-0.5 text-[8px] leading-none text-blue-200/80">•{count}</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
        <span className="h-2 w-2 rounded-full bg-blue-400" aria-hidden="true" />
        dia com post — clique para ver ({markedCount} este mês)
      </div>
    </div>
  );
}

/** Painel de detalhe: os posts do dia selecionado no calendário. */
function DayDetail({
  dayKey,
  posts,
  fields,
  statusMap,
}: {
  dayKey: string | null;
  posts: Row[];
  fields: FieldMap;
  statusMap: Record<string, StatusEntry>;
}) {
  if (!dayKey) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-gray-700/60 bg-gray-800/30 p-6 text-center">
        <div>
          <div className="text-2xl" aria-hidden="true">🗓️</div>
          <p className="mt-2 text-sm text-gray-400">Clique num dia marcado no calendário</p>
          <p className="text-xs text-gray-500">para ver o que está programado.</p>
        </div>
      </div>
    );
  }
  const d = dayKeyToDate(dayKey);
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/60 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-700/50 px-4 py-3">
        <span className="text-sm font-semibold text-gray-100" style={DISPLAY}>
          {DIA_ABBR[d.getDay()]}, {fmtDiaMes(d)}
        </span>
        <span className="text-[11px] text-gray-500">
          {posts.length} post{posts.length === 1 ? '' : 's'}
        </span>
      </div>
      {posts.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-gray-500">Nada programado neste dia.</div>
      ) : (
        <ul className="divide-y divide-gray-700/50">
          {posts.map((p, i) => (
            <li key={toText(p.id) || i}>
              <PostLine post={p} fields={fields} statusMap={statusMap} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// Listagem de conteúdos (visão "Lista") — agrupada por mês
// ============================================================

interface ListGroup {
  key: string;
  label: string;
  posts: Row[];
}

/** Agrupa os posts por mês ('YYYY-MM'), ordenado; os sem data vão por último. */
function groupByMonth(posts: Row[], dateField: string): ListGroup[] {
  const groups = new Map<string, Row[]>();
  const semData: Row[] = [];
  for (const p of posts) {
    const dk = toDayKey(p[dateField]);
    if (!dk) {
      semData.push(p);
      continue;
    }
    const mk = dk.slice(0, 7); // 'YYYY-MM'
    const arr = groups.get(mk);
    if (arr) arr.push(p);
    else groups.set(mk, [p]);
  }
  const byDay = (a: Row, b: Row) =>
    (toDayKey(a[dateField]) ?? '').localeCompare(toDayKey(b[dateField]) ?? '');
  const ordered: ListGroup[] = [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mk, ps]) => {
      const [y, m] = mk.split('-').map(Number);
      return { key: mk, label: `${MESES_LONGOS[m - 1]} ${y}`, posts: [...ps].sort(byDay) };
    });
  if (semData.length) ordered.push({ key: 'sem-data', label: 'Sem data', posts: semData });
  return ordered;
}

/** Uma linha rica da listagem: bloco de data à esquerda + título grande + chips. */
function ContentRow({
  post,
  fields,
  statusMap,
}: {
  post: Row;
  fields: FieldMap;
  statusMap: Record<string, StatusEntry>;
}) {
  const dk = toDayKey(post[fields.date]);
  const d = dk ? dayKeyToDate(dk) : null;
  const formato = toText(post[fields.format]);
  const cta = toText(post[CTA_KEY]);
  const link = toText(post[LINK_KEY]);
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      {/* Bloco de data */}
      <div className="flex w-11 shrink-0 flex-col items-center leading-none">
        {d ? (
          <>
            <span className="text-lg font-bold text-gray-100" style={DISPLAY}>{d.getDate()}</span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
              {MESES_ABBR[d.getMonth()]}
            </span>
            <span className="mt-0.5 text-[10px] text-gray-600">{DIA_ABBR[d.getDay()]}</span>
          </>
        ) : (
          <span className="text-sm text-gray-600">—</span>
        )}
      </div>
      <FormatChip formato={formato} />
      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold leading-snug text-gray-100 line-clamp-2" style={DISPLAY}>
          {toText(post[fields.title]) || 'Sem título'}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
          {formato ? <span>{formato}</span> : null}
          {cta ? <span className="truncate">· {cta}</span> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusPill estadoRaw={toText(post[fields.status])} statusMap={statusMap} />
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-gray-600/50 px-2.5 py-1 text-[11px] font-medium text-blue-300 transition-colors hover:bg-blue-500/10"
          >
            abrir ↗
          </a>
        ) : null}
      </div>
    </div>
  );
}

/** Listagem completa dos conteúdos, agrupada por mês, com contador por grupo. */
function ContentList({
  posts,
  fields,
  statusMap,
}: {
  posts: Row[];
  fields: FieldMap;
  statusMap: Record<string, StatusEntry>;
}) {
  const groups = useMemo(() => groupByMonth(posts, fields.date), [posts, fields.date]);
  if (posts.length === 0) {
    return <EmptyState message="Nenhum conteúdo cadastrado ainda." />;
  }
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.key}>
          <div className="mb-2 flex items-center gap-2 px-1">
            <h4 className="text-sm font-semibold text-gray-200" style={DISPLAY}>{g.label}</h4>
            <span className="rounded-full bg-gray-700/50 px-2 py-0.5 text-[11px] font-medium text-gray-400">
              {g.posts.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/60 shadow-sm">
            <ul className="divide-y divide-gray-700/50">
              {g.posts.map((p, i) => (
                <li key={toText(p.id) || i} className="transition-colors hover:bg-gray-700/30">
                  <ContentRow post={p} fields={fields} statusMap={statusMap} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Página "Atualizar cronograma" — CRUD da semana (tela cheia)
// ============================================================

/** Linha editável do cronograma. */
interface SchedRow {
  key: string;
  id: string | null;
  titulo: string;
  formato: string;
  estado: string;
  cta: string;
  link: string;
  /** Briefing (planejamento): link do Notion da postagem. */
  briefingUrl: string;
  /** Briefing (planejamento): texto do briefing. */
  briefing: string;
  /** Briefing (planejamento): links de referência (um por linha). */
  refs: string;
  day: string | null;
  origDay: string | null;
  /** Snapshot serializado dos campos p/ detectar edição (vazio p/ novos). */
  orig: string;
  markedDelete: boolean;
}

function snapshot(
  r: Pick<SchedRow, 'titulo' | 'formato' | 'estado' | 'cta' | 'link' | 'briefingUrl' | 'briefing' | 'refs' | 'day'>,
): string {
  return JSON.stringify([
    r.titulo, r.formato, r.estado, r.cta, r.link, r.briefingUrl, r.briefing, r.refs, r.day,
  ]);
}

function buildRows(posts: Row[], fields: FieldMap): SchedRow[] {
  return posts.map((p, i) => {
    const day = toDayKey(p[fields.date]);
    const fieldsVal = {
      titulo: toText(p[fields.title]),
      formato: (toText(p[fields.format]) || 'carrossel').toLowerCase(),
      estado: (toText(p[fields.status]) || 'rascunho').toLowerCase(),
      cta: toText(p[CTA_KEY]),
      link: toText(p[LINK_KEY]),
      briefingUrl: toText(p[BRIEFING_URL_KEY]),
      briefing: toText(p[BRIEFING_KEY]),
      refs: toText(p[REFS_KEY]),
      day,
    };
    const id = toText(p.id) || null;
    return {
      key: id ?? `existing-${i}`,
      id,
      ...fieldsVal,
      origDay: day,
      orig: snapshot(fieldsVal),
      markedDelete: false,
    };
  });
}

/** Um input de texto no estilo escuro do painel (tamanho confortável de leitura). */
function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3.5 py-2.5 text-[15px] text-gray-100 placeholder-gray-500 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40 ${props.className ?? ''}`}
    />
  );
}

/** Um <select> no estilo escuro do painel. */
function Select({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<[string, string]>;
  ariaLabel: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="rounded-lg border border-gray-700 bg-gray-900/60 px-2 py-2 text-sm text-gray-100 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

/** Um textarea no estilo escuro do painel (para briefing e referências). */
function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full resize-y rounded-lg border border-gray-700 bg-gray-900/60 px-3.5 py-2.5 text-[15px] leading-relaxed text-gray-100 placeholder-gray-500 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40 ${props.className ?? ''}`}
    />
  );
}

function SchedulePage({
  posts,
  fields,
  focusDay,
  onBack,
  onSaved,
}: {
  posts: Row[];
  fields: FieldMap;
  focusDay: Date;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(focusDay));
  const [rows, setRows] = useState<SchedRow[]>(() => buildRows(posts, fields));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cards com a área de briefing/refs expandida (colapsada por padrão).
  const [openBriefing, setOpenBriefing] = useState<Set<string>>(() => new Set());
  const counter = useRef(0);

  const patchRow = useCallback((key: string, patch: Partial<SchedRow>) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }, []);

  const toggleBriefing = useCallback((key: string) => {
    setOpenBriefing((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const addRow = useCallback((day: string) => {
    counter.current += 1;
    const nova: SchedRow = {
      key: `new-${counter.current}`,
      id: null,
      titulo: '',
      formato: 'carrossel',
      estado: 'rascunho',
      cta: '',
      link: '',
      briefingUrl: '',
      briefing: '',
      refs: '',
      day,
      origDay: null,
      orig: '',
      markedDelete: false,
    };
    setRows((rs) => [...rs, nova]);
  }, []);

  const removeRow = useCallback((key: string) => {
    setRows((rs) =>
      rs.flatMap((r) => {
        if (r.key !== key) return [r];
        if (r.id) return [{ ...r, markedDelete: true }]; // existente → marca p/ deletar
        return []; // novo → some da lista
      }),
    );
  }, []);

  const isChanged = useCallback(
    (r: SchedRow) => r.orig !== snapshot(r),
    [],
  );

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = weekDays[6];
  const firstKey = localDayKey(weekStart);
  const lastKey = localDayKey(weekEnd);

  // Diffs pendentes (para o rótulo do botão e o disabled).
  const creates = rows.filter((r) => !r.id && !r.markedDelete && r.titulo.trim());
  const updates = rows.filter((r) => r.id && !r.markedDelete && isChanged(r));
  const deletes = rows.filter((r) => r.id && r.markedDelete);
  const pending = creates.length + updates.length + deletes.length;

  // Posts existentes SEM data (aparecem numa seção própria, p/ agendar).
  const semData = rows.filter((r) => !r.markedDelete && r.id && r.origDay === null);
  // Posts em OUTRAS semanas (fora da janela atual) — só um aviso/contagem.
  const foraSemana = rows.filter(
    (r) => !r.markedDelete && r.id && r.origDay && (r.origDay < firstKey || r.origDay > lastKey),
  ).length;

  async function salvar() {
    setSaving(true);
    setError(null);
    try {
      if (creates.length) {
        const payload: PostInput[] = creates.map((r) => ({
          titulo: r.titulo.trim(),
          formato: r.formato,
          estado: r.estado,
          ctaFinal: r.cta.trim() || null,
          linkPresenteNotion: r.link.trim() || null,
          dataProgramada: r.day,
          briefingUrl: r.briefingUrl.trim() || null,
          briefing: r.briefing.trim() || null,
          refsLinks: r.refs.trim() || null,
        }));
        await apiJson('/api/conteudo', 'POST', { posts: payload });
      }
      for (const r of updates) {
        const patch: PostInput = {
          titulo: r.titulo.trim(),
          formato: r.formato,
          estado: r.estado,
          ctaFinal: r.cta.trim() || null,
          linkPresenteNotion: r.link.trim() || null,
          dataProgramada: r.day,
          briefingUrl: r.briefingUrl.trim() || null,
          briefing: r.briefing.trim() || null,
          refsLinks: r.refs.trim() || null,
        };
        await apiJson(`/api/conteudo/${r.id}`, 'PATCH', patch);
      }
      for (const r of deletes) {
        await apiJson(`/api/conteudo/${r.id}`, 'DELETE');
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  const weekLabel = `${weekStart.getDate()} ${MESES_ABBR[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MESES_ABBR[weekEnd.getMonth()]}`;
  const navBtn =
    'grid h-9 w-9 place-items-center rounded-lg border border-gray-700 text-gray-300 transition-colors hover:bg-gray-700/50 hover:text-white disabled:opacity-40';
  const labelCls = 'text-[11px] font-medium uppercase tracking-wide text-gray-500';

  /**
   * Card editável de UMA postagem: título em campo grande (largura total, fácil
   * de ler) em cima; formato/estado (e data, na seção sem-data) numa linha abaixo.
   */
  function renderCard(r: SchedRow, opts: { withDate?: boolean } = {}) {
    return (
      <div key={r.key} className="rounded-xl border border-gray-700/50 bg-gray-900/40 p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <TextInput
            value={r.titulo}
            placeholder="Título da postagem"
            onChange={(e) => patchRow(r.key, { titulo: e.target.value })}
            className="flex-1 font-medium"
          />
          <button
            type="button"
            onClick={() => removeRow(r.key)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-gray-700 text-gray-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
            aria-label="Remover postagem"
            title="Remover"
          >
            🗑
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {opts.withDate && (
            <label className="flex items-center gap-1.5">
              <span className={labelCls}>Data</span>
              <input
                type="date"
                value={r.day ?? ''}
                aria-label="Data"
                onChange={(e) => patchRow(r.key, { day: e.target.value || null })}
                className="rounded-lg border border-gray-700 bg-gray-900/60 px-2 py-1.5 text-sm text-gray-100 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
              />
            </label>
          )}
          <label className="flex items-center gap-1.5">
            <span className={labelCls}>Formato</span>
            <Select
              value={r.formato}
              onChange={(v) => patchRow(r.key, { formato: v })}
              options={FORMATO_OPTS}
              ariaLabel="Formato"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span className={labelCls}>Estado</span>
            <Select
              value={r.estado}
              onChange={(v) => patchRow(r.key, { estado: v })}
              options={ESTADO_OPTS}
              ariaLabel="Estado"
            />
          </label>
        </div>

        {/* Briefing e referências (colapsado por padrão — só a Jaque usa aqui) */}
        {(() => {
          const isOpen = openBriefing.has(r.key);
          const hasBriefing = !!(r.briefingUrl.trim() || r.briefing.trim() || r.refs.trim());
          return (
            <div className="mt-3 border-t border-gray-700/40 pt-3">
              <button
                type="button"
                onClick={() => toggleBriefing(r.key)}
                className="flex w-full items-center justify-between gap-2 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                aria-expanded={isOpen}
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                  <span aria-hidden="true">📝</span> Briefing e referências
                  {hasBriefing && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-blue-400"
                      aria-hidden="true"
                      title="preenchido"
                    />
                  )}
                </span>
                <span
                  className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                >
                  ⌄
                </span>
              </button>
              {isOpen && (
                <div className="mt-3 space-y-3">
                  <label className="block">
                    <span className={labelCls}>Link do Notion</span>
                    <TextInput
                      type="url"
                      inputMode="url"
                      value={r.briefingUrl}
                      placeholder="https://notion.so/…"
                      onChange={(e) => patchRow(r.key, { briefingUrl: e.target.value })}
                      className="mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Briefing</span>
                    <TextArea
                      value={r.briefing}
                      rows={4}
                      placeholder="Cole aqui o briefing da postagem (ou use o link do Notion acima)."
                      onChange={(e) => patchRow(r.key, { briefing: e.target.value })}
                      className="mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className={labelCls}>
                      Referências <span className="normal-case text-gray-600">(um link por linha)</span>
                    </span>
                    <TextArea
                      value={r.refs}
                      rows={3}
                      placeholder={'https://instagram.com/p/…\nhttps://…'}
                      onChange={(e) => patchRow(r.key, { refs: e.target.value })}
                      className="mt-1 font-mono text-[13px]"
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  }

  const saveBtn = (
    <button
      type="button"
      onClick={salvar}
      disabled={saving || pending === 0}
      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {saving ? 'Salvando…' : `Salvar cronograma${pending ? ` (${pending})` : ''}`}
    </button>
  );
  const cancelBtn = (
    <button
      type="button"
      onClick={onBack}
      disabled={saving}
      className="rounded-xl px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700/50 disabled:opacity-50"
    >
      Cancelar
    </button>
  );

  return (
    <div>
      {/* Cabeçalho fixo da página */}
      <div className="sticky top-0 z-10 mb-5 rounded-2xl border border-gray-700/60 bg-gray-900/85 p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700/50"
          >
            <span aria-hidden="true">←</span> Voltar ao painel
          </button>
          <div className="flex items-center gap-2">
            {cancelBtn}
            {saveBtn}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-100" style={DISPLAY}>Cronograma</h2>
            <p className="text-xs text-gray-500">Adicione, edite ou remova as postagens de cada dia — depois salve.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className={navBtn} onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label="Semana anterior">‹</button>
            <div className="min-w-[10rem] text-center">
              <div className="text-sm font-semibold text-gray-100" style={DISPLAY}>{weekLabel}</div>
              {foraSemana > 0 && (
                <div className="text-[11px] text-gray-500">
                  +{foraSemana} em outras semanas
                </div>
              )}
            </div>
            <button type="button" className={navBtn} onClick={() => setWeekStart((w) => addDays(w, 7))} aria-label="Próxima semana">›</button>
          </div>
        </div>
        {error && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>

      {/* Corpo: 7 dias + sem-data */}
      <div className="mx-auto max-w-3xl space-y-4">
        {weekDays.map((day) => {
          const dayKey = localDayKey(day);
          const dayRows = rows.filter((r) => !r.markedDelete && r.day === dayKey);
          const isToday = dayKey === localDayKey(new Date());
          return (
            <section key={dayKey} className="rounded-2xl border border-gray-700/50 bg-gray-800/40 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className={`text-base font-semibold ${isToday ? 'text-blue-300' : 'text-gray-100'}`} style={DISPLAY}>
                  {DIA_ABBR[day.getDay()]} {day.getDate()}
                  {isToday && <span className="ml-1.5 text-xs font-normal text-blue-400/80">· hoje</span>}
                </h3>
                <button
                  type="button"
                  onClick={() => addRow(dayKey)}
                  className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-blue-300 transition-colors hover:bg-blue-500/10"
                >
                  + adicionar postagem
                </button>
              </div>
              {dayRows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-700/50 px-3 py-4 text-center text-sm text-gray-600">
                  Nenhuma postagem neste dia.
                </p>
              ) : (
                <div className="space-y-3">{dayRows.map((r) => renderCard(r))}</div>
              )}
            </section>
          );
        })}

        {semData.length > 0 && (
          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-amber-200" style={DISPLAY}>Sem data agendada</h3>
              <p className="text-[11px] text-amber-300/70">Defina uma data para colocar no cronograma.</p>
            </div>
            <div className="space-y-3">{semData.map((r) => renderCard(r, { withDate: true }))}</div>
          </section>
        )}

        {/* Ação inferior (repete Salvar para não precisar rolar de volta) */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-700/60 pt-4">
          <span className="text-xs text-gray-500">
            {pending === 0 ? 'Nenhuma alteração' : `${pending} alteraç${pending === 1 ? 'ão' : 'ões'} pendente${pending === 1 ? '' : 's'}`}
          </span>
          <div className="flex items-center gap-2">
            {cancelBtn}
            {saveBtn}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Bloco
// ============================================================

function ConteudoDashboardBlock({ title, subtitle, config, ctx }: BlockProps<ConteudoDashboardConfig>) {
  const { data, loading, error } = ctx;

  const titleField = config.titleField ?? 'titulo';
  const dateField = config.dateField ?? 'data_programada';
  const formatField = config.formatField ?? 'formato';
  const statusField = config.statusField ?? 'estado';
  const statusMap = config.statusMap ?? DEFAULT_STATUS;
  const resumoLabel = config.resumoLabel ?? 'Resumo';
  const scheduleLabel = config.updateScheduleLabel ?? 'Atualizar cronograma';
  const limit = config.limit ?? 6;
  const metrics = config.metrics;

  const fields: FieldMap = useMemo(
    () => ({ title: titleField, date: dateField, format: formatField, status: statusField }),
    [titleField, dateField, formatField, statusField],
  );

  const posts = useMemo(() => asRows(data), [data]);

  // Posts agrupados por dia ('YYYY-MM-DD' → posts) para o calendário/detalhe.
  const postsByDay = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const p of posts) {
      const key = toDayKey(p[dateField]);
      if (!key) continue;
      const arr = m.get(key);
      if (arr) arr.push(p);
      else m.set(key, [p]);
    }
    return m;
  }, [posts, dateField]);

  // Mês inicial do calendário = mês do 1º post futuro (ou do 1º post, ou hoje).
  const defaultMonth = useMemo(() => {
    const dates = posts
      .map((p) => parseDate(toText(p[dateField])))
      .filter((d): d is Date => d != null)
      .sort((a, b) => a.getTime() - b.getTime());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const base = dates.find((d) => d >= today) ?? dates[0] ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }, [posts, dateField]);

  const [view, setView] = useState<'agenda' | 'lista'>('agenda');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState<Date | null>(null);

  const effectiveMonth = calMonth ?? defaultMonth;

  const openDay = useCallback((dayKey: string) => {
    setView('agenda');
    setSelectedDay(dayKey);
  }, []);

  // Navega para outra rota do app (SPA, via core). Fallback full-reload se o
  // core não injetar `navigate` (defensivo).
  const navigate = ctx.actions.navigate;
  const goTo = useCallback(
    (route: string) => {
      if (navigate) navigate(route);
      else window.location.href = route;
    },
    [navigate],
  );

  // Botão principal: leva à página DEDICADA do cronograma — rota própria,
  // compartilhável por URL (/conteudo/cronograma).
  const scheduleBtn = (
    <button
      type="button"
      onClick={() => goTo('/conteudo/cronograma')}
      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
    >
      <span aria-hidden="true">🗓️</span> {scheduleLabel}
    </button>
  );

  if (loading) {
    return (
      <div>
        <SectionHeader title={title ?? 'Conteúdo'} subtitle={subtitle} icon="🗓️">
          {scheduleBtn}
        </SectionHeader>
        <SkeletonCards count={3} columns={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <SectionHeader title={title ?? 'Conteúdo'} subtitle={subtitle} icon="🗓️">
          {scheduleBtn}
        </SectionHeader>
        <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />
      </div>
    );
  }

  const resumo = posts.slice(0, limit);

  const growth = metrics?.growth ?? {};
  const followersConnected = metrics?.followers?.current != null;
  const eng = metrics?.engagement;
  const topPosts = metrics?.topPosts ?? [];
  const coletaData = metrics?.updatedAt ? parseDate(metrics.updatedAt) : null;
  const coletaLabel = coletaData ? fmtDiaMes(coletaData) : null;

  // Segmento Agenda | Lista.
  const viewToggle = (
    <div className="inline-flex rounded-xl border border-gray-700/60 bg-gray-800/60 p-0.5">
      {(['agenda', 'lista'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => setView(v)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
            view === v ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
          }`}
          aria-pressed={view === v}
        >
          {v === 'agenda' ? '🗓️ Agenda' : '☰ Lista'}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <SectionHeader title={title ?? 'Conteúdo'} subtitle={subtitle} icon="🗓️">
        {scheduleBtn}
      </SectionHeader>

      {metrics && (
        <>
          {/* ===== Crescimento do perfil ===== */}
          <SectionLabel
            aside={
              !followersConnected ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                  🔌 Conecte o Instagram para ativar
                </span>
              ) : undefined
            }
          >
            Crescimento do perfil
          </SectionLabel>

          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <FollowersHero
              current={metrics.followers?.current}
              series={metrics.followers?.series}
              week={growth.week}
            />
            {/* Curtidas + comentários agregados (dado real), à direita do herói */}
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-rose-500/10 text-lg text-rose-400" aria-hidden="true">❤️</span>
                <div className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Interações{eng?.windowDays ? ` · ${eng.windowDays} dias` : ''}
                </div>
                <div className="mt-1 text-2xl text-gray-100" style={DISPLAY}>
                  {eng?.interactions != null ? fmtCompact(eng.interactions) : '—'}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {eng?.postsCount != null ? `${eng.postsCount} posts` : ''}
                  {eng?.avgPerPost != null ? ` · ~${fmtInt(eng.avgPerPost)}/post` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* 5 janelas de crescimento pedidas */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {GROWTH_PERIODS.map((p) => (
              <GrowthCard key={p.key} label={p.label} delta={growth[p.key]} />
            ))}
          </div>

          {/* ===== Engajamento / melhores posts (dado real) ===== */}
          {(topPosts.length > 0 || eng?.best) && (
            <>
              <SectionLabel
                aside={
                  coletaLabel ? (
                    <span className="text-[11px] text-gray-500">
                      {metrics.source === 'live' ? 'ao vivo' : 'coletado'} em {coletaLabel}
                    </span>
                  ) : undefined
                }
              >
                Melhores posts
              </SectionLabel>
              <div className="mb-6 overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/60 shadow-sm">
                <ul className="divide-y divide-gray-700/50">
                  {topPosts.map((p, i) => {
                    const type = (p.type ?? '').toLowerCase();
                    const fmtTone = FORMAT_TONES[type] ?? FORMAT_FALLBACK;
                    const abbr = (p.type?.slice(0, 2) || '••').toUpperCase();
                    const total = (p.likes ?? 0) + (p.comments ?? 0);
                    const d = p.date ? parseDate(p.date) : null;
                    const inner = (
                      <>
                        <span className="grid h-9 w-9 shrink-0 place-items-center text-[11px] font-bold text-gray-500">
                          {i + 1}
                        </span>
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${fmtTone.chip} ${fmtTone.text}`}
                          title={p.type || undefined}
                          aria-hidden="true"
                        >
                          {abbr}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-gray-100">{p.title}</span>
                          <span className="mt-0.5 block text-xs text-gray-500">
                            {d ? fmtDiaMes(d) : ''}
                            {p.type ? `${d ? ' · ' : ''}${p.type}` : ''}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3 text-xs text-gray-400">
                          <span className="inline-flex items-center gap-1"><span aria-hidden="true">❤️</span>{fmtCompact(p.likes ?? 0)}</span>
                          <span className="inline-flex items-center gap-1"><span aria-hidden="true">💬</span>{fmtInt(p.comments ?? 0)}</span>
                          <span className="hidden font-semibold text-gray-200 sm:inline" style={DISPLAY}>{fmtCompact(total)}</span>
                        </span>
                      </>
                    );
                    const cls = 'flex items-center gap-3 px-3 py-3 transition-colors hover:bg-gray-700/30';
                    return (
                      <li key={p.permalink || p.title || i}>
                        {p.permalink ? (
                          <a href={p.permalink} target="_blank" rel="noreferrer" className={cls}>
                            {inner}
                          </a>
                        ) : (
                          <div className={cls}>{inner}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </>
      )}

      {/* ===== Resumo: próximos posts (planejamento) ===== */}
      <SectionLabel>{resumoLabel}</SectionLabel>
      {resumo.length === 0 ? (
        <EmptyState message="Nenhum post por aqui ainda. Clique em “Atualizar cronograma” para começar." />
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumo.map((post, i) => {
            const formato = toText(post[formatField]);
            const estadoRaw = toText(post[statusField]);
            const d = parseDate(toText(post[dateField]));
            const dayKey = toDayKey(post[dateField]);
            return (
              <article
                key={toText(post.id) || i}
                onClick={dayKey ? () => openDay(dayKey) : undefined}
                className={`group relative overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 ${
                  dayKey ? 'cursor-pointer' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <FormatChip formato={formato} size="md" />
                  <StatusPill estadoRaw={estadoRaw} statusMap={statusMap} />
                </div>
                <h4 className="mt-4 text-base font-semibold leading-snug text-gray-100 line-clamp-2" style={DISPLAY}>
                  {toText(post[titleField]) || 'Sem título'}
                </h4>
                <p className="mt-3 text-xs text-gray-400">
                  <span className="text-gray-500">Programado: </span>
                  {d ? fmtDiaMes(d) : '—'}
                </p>
              </article>
            );
          })}
        </div>
      )}

      {/* ===== Planejamento: Agenda | Lista ===== */}
      <SectionLabel aside={viewToggle}>Planejamento</SectionLabel>

      {view === 'agenda' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MiniCalendar
            monthDate={effectiveMonth}
            postsByDay={postsByDay}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onPrev={() => setCalMonth(new Date(effectiveMonth.getFullYear(), effectiveMonth.getMonth() - 1, 1))}
            onNext={() => setCalMonth(new Date(effectiveMonth.getFullYear(), effectiveMonth.getMonth() + 1, 1))}
          />
          <DayDetail
            dayKey={selectedDay}
            posts={selectedDay ? postsByDay.get(selectedDay) ?? [] : []}
            fields={fields}
            statusMap={statusMap}
          />
        </div>
      ) : (
        <ContentList posts={posts} fields={fields} statusMap={statusMap} />
      )}
    </div>
  );
}

/** Definição registrável do bloco custom "Painel de Conteúdo". */
export const conteudoDashboard: BlockDefinition = {
  type: 'custom:conteudo-dashboard',
  component: ConteudoDashboardBlock,
  defaultDataShape: 'collection',
};

// ============================================================
// Bloco da ROTA /conteudo/cronograma — a página de edição como tela própria
// ============================================================

/**
 * Bloco da rota dedicada do cronograma (URL compartilhável /conteudo/cronograma).
 * Lê os posts do mesmo dataSource do painel (v_conteudo_posts) e delega à
 * `SchedulePage`. "Voltar" e "salvar" levam de volta ao painel (/conteudo/painel),
 * que remonta com os dados frescos.
 */
function ConteudoCronogramaBlock({ config, ctx }: BlockProps<ConteudoDashboardConfig>) {
  const { data, loading, error } = ctx;
  const fields: FieldMap = {
    title: config.titleField ?? 'titulo',
    date: config.dateField ?? 'data_programada',
    format: config.formatField ?? 'formato',
    status: config.statusField ?? 'estado',
  };
  const posts = asRows(data);

  const navigate = ctx.actions.navigate;
  const goPainel = () => {
    if (navigate) navigate('/conteudo/painel');
    else window.location.href = '/conteudo/painel';
  };

  if (loading) {
    return (
      <div>
        <SectionHeader title="Cronograma" subtitle="Carregando…" icon="🗓️" />
        <SkeletonCards count={3} columns={1} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <SectionHeader title="Cronograma" icon="🗓️" />
        <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />
      </div>
    );
  }

  return (
    <SchedulePage posts={posts} fields={fields} focusDay={new Date()} onBack={goPainel} onSaved={goPainel} />
  );
}

/** Definição registrável do bloco custom "Cronograma" (rota /conteudo/cronograma). */
export const conteudoCronograma: BlockDefinition = {
  type: 'custom:conteudo-cronograma',
  component: ConteudoCronogramaBlock,
  defaultDataShape: 'collection',
};
