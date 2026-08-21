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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { SectionHeader, EmptyState, SkeletonCards } from '@os/core';
import type { BlockDefinition, BlockProps } from '@os/core';
import { montarDescricaoInsta } from './descricao-insta';

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

/** Número compacto (1234 → "1,2 mil"; 12000 → "12 mil"; 1500000 → "1,5 mi"). */
function fmtCompact(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs < 1000) return fmtInt(n);
  if (abs < 1_000_000) {
    const mil = n / 1000;
    return `${mil.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  }
  const mi = n / 1_000_000;
  return `${mi.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
}

/** Δ% assinado ("+12,5%" / "-3%"). */
function fmtPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

/** Formato ULTRACOMPACTO p/ metas em cards estreitos (150000 → "150k"; 1000000 → "1M"). */
function fmtMetaShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
  if (abs >= 1000) return `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: n % 1000 === 0 ? 0 : 1 })}k`;
  return fmtInt(n);
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
  /** Rótulo do botão que abre o gerador de IA. Default: "Gerar com IA". */
  generateLabel?: string;
  /** Rótulo do botão que abre o painel de cronograma. Default: "Atualizar cronograma". */
  updateScheduleLabel?: string;
  /** Se definido, o botão "Novo post" vira um link; senão fica "Em breve". */
  newPostHref?: string;
  /** Máximo de posts na faixa "Resumo". Default: 6. */
  limit?: number;
  statusMap?: Record<string, StatusEntry>;
  metrics?: MetricsConfig;
  /**
   * Metas SEMANAIS por indicador do "Relatório da rede". Cada card mostra a meta
   * ao lado do número, com barra de progresso e "faltam N". Como o relatório tem
   * filtro de período (7/30/90 dias), a meta é escalada proporcionalmente
   * (ex.: meta de 500/semana vira 2.000 em 30 dias). Indicadores sem meta
   * definida seguem mostrando só o número.
   *
   * Cada alvo pode ser um número (meta única) OU até três níveis
   * `{ min, media, alta }`:
   *   · `min`   — piso a bater (a barra fica azul até aqui);
   *   · `media` — alvo saudável (tique na barra);
   *   · `alta`  — meta ambiciosa (a barra completa ao bater; fica verde ao cruzar
   *     o piso).
   */
  metasSemana?: {
    novosSeguidores?: MetaAlvo;
    visualizacoes?: MetaAlvo;
    alcance?: MetaAlvo;
    interacoes?: MetaAlvo;
    posts?: MetaAlvo;
  };
}

/** Alvo de meta: um número (nível único) ou até três níveis (piso → alvo → stretch). */
type MetaAlvo = number | { min?: number; media?: number; alta?: number };

/** Meta já escalada ao período, pronta p/ render (null nos campos ausentes). */
interface MetaEscalada {
  min: number | null;
  media: number | null;
  alta: number | null;
}

/** Normaliza um alvo (número ou objeto) e escala pelos `mult` do período. */
function escalaMeta(alvo: MetaAlvo | undefined, mult: number | null): MetaEscalada | null {
  if (alvo == null || mult == null) return null;
  const esc = (v: number | undefined) =>
    v != null && Number.isFinite(v) && v > 0 ? Math.round(v * mult) : null;
  if (typeof alvo === 'number') return { min: esc(alvo), media: null, alta: null };
  const r = { min: esc(alvo.min), media: esc(alvo.media), alta: esc(alvo.alta) };
  return r.min == null && r.media == null && r.alta == null ? null : r;
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

/**
 * Cor por formato. `chip`/`text` pintam o selo de 2 letras; `card` pinta a BORDA
 * do card do cronograma, com uma faixa lateral mais forte à esquerda. A faixa é
 * o que deixa a semana escaneável de longe: dá pra ver quantos reels e quantos
 * carrosséis tem no dia sem ler nada.
 */
const FORMAT_TONES: Record<string, { chip: string; text: string; card: string; dot: string }> = {
  reel: {
    chip: 'bg-fuchsia-500/15',
    text: 'text-fuchsia-300',
    card: 'border-fuchsia-500/30 border-l-fuchsia-500/70 hover:border-fuchsia-400/50 hover:border-l-fuchsia-400',
    dot: 'bg-fuchsia-400',
  },
  reels: {
    chip: 'bg-fuchsia-500/15',
    text: 'text-fuchsia-300',
    card: 'border-fuchsia-500/30 border-l-fuchsia-500/70 hover:border-fuchsia-400/50 hover:border-l-fuchsia-400',
    dot: 'bg-fuchsia-400',
  },
  carrossel: {
    chip: 'bg-blue-500/15',
    text: 'text-blue-300',
    card: 'border-blue-500/30 border-l-blue-500/70 hover:border-blue-400/50 hover:border-l-blue-400',
    dot: 'bg-blue-400',
  },
  carousel: {
    chip: 'bg-blue-500/15',
    text: 'text-blue-300',
    card: 'border-blue-500/30 border-l-blue-500/70 hover:border-blue-400/50 hover:border-l-blue-400',
    dot: 'bg-blue-400',
  },
  story: {
    chip: 'bg-amber-500/15',
    text: 'text-amber-300',
    card: 'border-amber-500/30 border-l-amber-500/70 hover:border-amber-400/50 hover:border-l-amber-400',
    dot: 'bg-amber-400',
  },
  stories: {
    chip: 'bg-amber-500/15',
    text: 'text-amber-300',
    card: 'border-amber-500/30 border-l-amber-500/70 hover:border-amber-400/50 hover:border-l-amber-400',
    dot: 'bg-amber-400',
  },
  post: {
    chip: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    card: 'border-emerald-500/30 border-l-emerald-500/70 hover:border-emerald-400/50 hover:border-l-emerald-400',
    dot: 'bg-emerald-400',
  },
  imagem: {
    chip: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    card: 'border-emerald-500/30 border-l-emerald-500/70 hover:border-emerald-400/50 hover:border-l-emerald-400',
    dot: 'bg-emerald-400',
  },
  video: {
    chip: 'bg-rose-500/15',
    text: 'text-rose-300',
    card: 'border-rose-500/30 border-l-rose-500/70 hover:border-rose-400/50 hover:border-l-rose-400',
    dot: 'bg-rose-400',
  },
};

const FORMAT_FALLBACK = {
  chip: 'bg-gray-600/20',
  text: 'text-gray-300',
  card: 'border-gray-700 border-l-gray-600 hover:border-gray-600 hover:border-l-gray-500',
  dot: 'bg-gray-400',
};

/** Cores de um formato, com fallback pro que ainda não tem tom próprio. */
function formatTone(formato: string) {
  return FORMAT_TONES[formato.toLowerCase()] ?? FORMAT_FALLBACK;
}

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
/**
 * Objetivo do post no funil (reunião semanal de marketing). A primeira opção é
 * VAZIA de propósito: o histórico veio sem objetivo, e forçar uma escolha faria
 * o time chutar. Bate com OBJETIVOS no servidor.
 */
const OBJETIVO_OPTS: ReadonlyArray<[string, string]> = [
  ['', 'Não definido'],
  ['atracao', 'Atração'],
  ['aquecimento', 'Aquecimento'],
  ['conversao', 'Conversão'],
];
const OBJETIVO_LABEL: Record<string, string> = {
  atracao: 'Atração',
  aquecimento: 'Aquecimento',
  conversao: 'Conversão',
};
const OBJETIVO_KEY = 'objetivo';

/** Nomes fixos das colunas extras da view (fora dos campos configuráveis). */
const CTA_KEY = 'cta_final';
const LINK_KEY = 'link_presente_notion';
/** Colunas de conteúdo do post — usadas no PREVIEW (gancho, roteiro dos slides…). */
const GANCHO_KEY = 'gancho';
const LEGENDA_KEY = 'legenda';
const HASHTAGS_KEY = 'hashtags';
const ROTEIRO_KEY = 'roteiro';
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
  /** '' vira null: objetivo é opcional (ver OBJETIVOS no servidor). */
  objetivo: string | null;
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
  const tone = formatTone(formato);
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

/**
 * Legenda das cores de borda do cronograma. Sem ela a faixa colorida é só
 * enfeite; com ela a semana se lê de relance.
 */
function LegendaFormatos() {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      {FORMATO_OPTS.map(([valor, label]) => (
        <span key={valor} className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className={`h-2.5 w-1 rounded-full ${formatTone(valor).dot}`} aria-hidden="true" />
          {label}
        </span>
      ))}
    </div>
  );
}

/** Resumo "3 reels · 1 carrossel" pro cabeçalho do dia. */
function resumoFormatos(formatos: string[]): string {
  const contagem = new Map<string, number>();
  for (const f of formatos) {
    const chave = f.toLowerCase() || 'sem formato';
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  return [...contagem.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([chave, n]) => `${n} ${FORMATO_OPTS.find(([v]) => v === chave)?.[1].toLowerCase() ?? chave}`)
    .join(' · ');
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
  onOpen,
}: {
  post: Row;
  fields: FieldMap;
  statusMap: Record<string, StatusEntry>;
  onOpen?: (post: Row) => void;
}) {
  const formato = toText(post[fields.format]);
  const d = parseDate(toText(post[fields.date]));
  const cta = toText(post[CTA_KEY]);
  const link = toText(post[LINK_KEY]);
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 ${onOpen ? 'cursor-pointer transition-colors hover:bg-gray-700/30' : ''}`}
      onClick={onOpen ? () => onOpen(post) : undefined}
      role={onOpen ? 'button' : undefined}
      title={onOpen ? 'Ver pré-visualização' : undefined}
    >
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
            onClick={(e) => e.stopPropagation()}
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
  onOpen,
}: {
  dayKey: string | null;
  posts: Row[];
  fields: FieldMap;
  statusMap: Record<string, StatusEntry>;
  onOpen?: (post: Row) => void;
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
              <PostLine post={p} fields={fields} statusMap={statusMap} onOpen={onOpen} />
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
  onOpen,
}: {
  post: Row;
  fields: FieldMap;
  statusMap: Record<string, StatusEntry>;
  onOpen?: (post: Row) => void;
}) {
  const dk = toDayKey(post[fields.date]);
  const d = dk ? dayKeyToDate(dk) : null;
  const formato = toText(post[fields.format]);
  const cta = toText(post[CTA_KEY]);
  const link = toText(post[LINK_KEY]);
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3.5 ${onOpen ? 'cursor-pointer' : ''}`}
      onClick={onOpen ? () => onOpen(post) : undefined}
      role={onOpen ? 'button' : undefined}
      title={onOpen ? 'Ver pré-visualização' : undefined}
    >
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
            onClick={(e) => e.stopPropagation()}
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
  onOpen,
}: {
  posts: Row[];
  fields: FieldMap;
  statusMap: Record<string, StatusEntry>;
  onOpen?: (post: Row) => void;
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
                  <ContentRow post={p} fields={fields} statusMap={statusMap} onOpen={onOpen} />
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
  /** Objetivo no funil ('atracao' | 'aquecimento' | 'conversao'); '' = não definido. */
  objetivo: string;
  cta: string;
  /** Link do presente entregue no CTA. É o que vira o "abrir ↗" no card. */
  link: string;
  /** Briefing (planejamento): link externo do briefing. Sem input hoje, só preservado. */
  briefingUrl: string;
  /** Briefing (planejamento): texto do briefing. */
  briefing: string;
  /** Briefing (planejamento): links de referência (um por linha). */
  refs: string;
  day: string | null;
  /** Hora da postagem ('HH:MM' ou '' = sem hora). Vai junto na data_programada. */
  hora: string;
  /**
   * Legenda e hashtags do post. Só LEITURA aqui: servem pra montar a "Descrição
   * pro Insta" dentro do popup de edição (o texto que o social media copia). Ficam
   * fora do `snapshot` e do `rowToPayload` de propósito, pra não entrar no que o
   * "Salvar" grava — quem escreve legenda é o gerador ou o arquivo do carrossel.
   */
  legenda: string;
  hashtags: string;
  origDay: string | null;
  /** Snapshot serializado dos campos p/ detectar edição (vazio p/ novos). */
  orig: string;
}

function snapshot(
  r: Pick<
    SchedRow,
    'titulo' | 'formato' | 'estado' | 'objetivo' | 'cta' | 'link' | 'briefingUrl' | 'briefing' | 'refs' | 'day' | 'hora'
  >,
): string {
  return JSON.stringify([
    r.titulo, r.formato, r.estado, r.objetivo, r.cta, r.link, r.briefingUrl, r.briefing, r.refs, r.day, r.hora,
  ]);
}

/** Extrai 'HH:MM' do timestamp `data_programada` (string). '' se ausente ou 00:00 (= sem hora). */
function toTimeStr(value: unknown): string {
  if (typeof value !== 'string') return '';
  const m = value.match(/[T ](\d{2}):(\d{2})/);
  if (!m) return '';
  const hm = `${m[1]}:${m[2]}`;
  return hm === '00:00' ? '' : hm;
}

/**
 * Junta dia + hora num valor para `data_programada`. Mesma estratégia da data:
 * string em UTC (…Z) para casar com a leitura por string (toDayKey/toTimeStr) e
 * não sofrer drift de fuso. Sem hora → só o dia (meia-noite = "sem hora").
 */
function combineDataHora(day: string | null, hora: string): string | null {
  if (!day) return null;
  if (!hora) return day;
  return `${day}T${hora}:00.000Z`;
}

function buildRows(posts: Row[], fields: FieldMap): SchedRow[] {
  return posts.map((p, i) => {
    const day = toDayKey(p[fields.date]);
    const fieldsVal = {
      titulo: toText(p[fields.title]),
      formato: (toText(p[fields.format]) || 'carrossel').toLowerCase(),
      estado: (toText(p[fields.status]) || 'rascunho').toLowerCase(),
      objetivo: toText(p[OBJETIVO_KEY]).toLowerCase(),
      cta: toText(p[CTA_KEY]),
      link: toText(p[LINK_KEY]),
      briefingUrl: toText(p[BRIEFING_URL_KEY]),
      briefing: toText(p[BRIEFING_KEY]),
      refs: toText(p[REFS_KEY]),
      day,
      hora: toTimeStr(p[fields.date]),
    };
    const id = toText(p.id) || null;
    return {
      key: id ?? `existing-${i}`,
      id,
      ...fieldsVal,
      legenda: toText(p[LEGENDA_KEY]),
      hashtags: toText(p[HASHTAGS_KEY]),
      origDay: day,
      orig: snapshot(fieldsVal),
    };
  });
}

/** Um input de texto no estilo escuro do painel (tamanho confortável de leitura). */
function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-gray-600 bg-gray-900 px-3.5 py-2.5 text-[15px] text-gray-100 placeholder-gray-500 focus:border-blue-500/70 focus:outline-none focus:ring-1 focus:ring-blue-500/40 ${props.className ?? ''}`}
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
      className="rounded-lg border border-gray-600 bg-gray-900 px-2 py-2 text-sm text-gray-100 focus:border-blue-500/70 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
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
      className={`w-full resize-y rounded-lg border border-gray-600 bg-gray-900 px-3.5 py-2.5 text-[15px] leading-relaxed text-gray-100 placeholder-gray-500 focus:border-blue-500/70 focus:outline-none focus:ring-1 focus:ring-blue-500/40 ${props.className ?? ''}`}
    />
  );
}

/**
 * Popup de edição de UMA postagem. Estado LOCAL (draft): nada é salvo até clicar
 * "Salvar" — acaba com o auto-save por campo (que fazia o post sumir ao editar a
 * data). Salvar faz UM request (POST se novo, PATCH se existente).
 */
function EditarPostModal({
  inicial,
  salvando,
  onSalvar,
  onRemover,
  onFechar,
}: {
  inicial: SchedRow;
  salvando: boolean;
  onSalvar: (d: SchedRow) => void;
  onRemover: (d: SchedRow) => void;
  onFechar: () => void;
}) {
  const [d, setD] = useState<SchedRow>(inicial);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onFechar]);
  const set = <K extends keyof SchedRow>(k: K, v: SchedRow[K]) => setD((x) => ({ ...x, [k]: v }));
  const inputCls =
    'rounded-lg border border-gray-600 bg-gray-900 px-2 py-1.5 text-sm text-gray-100 focus:border-blue-500/70 focus:outline-none focus:ring-1 focus:ring-blue-500/40';
  const labelCls = 'text-[11px] font-medium uppercase tracking-wide text-gray-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
      aria-label="Editar postagem"
    >
      <div
        className="my-8 w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-gray-200">✏️ Editar postagem</span>
          <button
            type="button"
            onClick={onFechar}
            className="grid h-9 w-9 place-items-center rounded-lg border border-gray-700 text-gray-300 transition-colors hover:bg-gray-700/50 hover:text-white"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className={labelCls}>Título</span>
            <TextInput
              value={d.titulo}
              placeholder="Título da postagem"
              onChange={(e) => set('titulo', e.target.value)}
              className="mt-1"
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-1.5">
              <span className={labelCls}>Data</span>
              <input
                type="date"
                value={d.day ?? ''}
                aria-label="Data"
                onChange={(e) => set('day', e.target.value || null)}
                className={inputCls}
              />
            </label>
            <label className="flex items-center gap-1.5">
              <span className={labelCls}>Hora</span>
              <input
                type="time"
                value={d.hora}
                aria-label="Hora"
                onChange={(e) => set('hora', e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="flex items-center gap-1.5">
              <span className={labelCls}>Formato</span>
              <Select value={d.formato} onChange={(v) => set('formato', v)} options={FORMATO_OPTS} ariaLabel="Formato" />
            </label>
            <label className="flex items-center gap-1.5">
              <span className={labelCls}>Estado</span>
              <Select value={d.estado} onChange={(v) => set('estado', v)} options={ESTADO_OPTS} ariaLabel="Estado" />
            </label>
            <label className="flex items-center gap-1.5">
              <span className={labelCls}>Objetivo</span>
              <Select
                value={d.objetivo}
                onChange={(v) => set('objetivo', v)}
                options={OBJETIVO_OPTS}
                ariaLabel="Objetivo"
              />
            </label>
          </div>
          <label className="block">
            <span className={labelCls}>Link do presente</span>
            <TextInput
              type="url"
              inputMode="url"
              value={d.link}
              placeholder="https://… (o material que o CTA promete entregar)"
              onChange={(e) => set('link', e.target.value)}
              className="mt-1"
            />
          </label>
          {/* Descrição pro Insta — o texto FINAL que o social media cola no post:
              linha de follow + legenda + hashtags, montado na hora (descricao-insta.ts).
              É leitura: quem escreve a legenda é o gerador ou o arquivo do carrossel,
              e a linha de follow nunca fica gravada em post nenhum. */}
          {d.legenda.trim() && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-300/80">
                  Descrição pro Insta
                </span>
                <CopyButton
                  text={montarDescricaoInsta(d.legenda, d.hashtags)}
                  label="📋 Copiar"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600/80 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-600"
                />
              </div>
              <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-gray-200">
                {montarDescricaoInsta(d.legenda, d.hashtags)}
              </pre>
            </div>
          )}
          <label className="block">
            <span className={labelCls}>Briefing</span>
            <TextArea
              value={d.briefing}
              rows={4}
              placeholder="Cole aqui o briefing da postagem."
              onChange={(e) => set('briefing', e.target.value)}
              className="mt-1"
            />
          </label>
          <label className="block">
            <span className={labelCls}>
              Referências <span className="normal-case text-gray-600">(um link por linha)</span>
            </span>
            <TextArea
              value={d.refs}
              rows={3}
              placeholder={'https://instagram.com/p/…'}
              onChange={(e) => set('refs', e.target.value)}
              className="mt-1 font-mono text-[13px]"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onRemover(d)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
          >
            🗑 Remover
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700/50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSalvar(d)}
              disabled={salvando || !d.titulo.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SchedulePage({
  posts,
  fields,
  focusDay,
  onBack,
}: {
  posts: Row[];
  fields: FieldMap;
  focusDay: Date;
  onBack: () => void;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(focusDay));
  const [rows, setRows] = useState<SchedRow[]>(() => buildRows(posts, fields));
  // Popup de edição do post (null = fechado) + flag de salvando.
  const [editando, setEditando] = useState<SchedRow | null>(null);
  const [salvandoModal, setSalvandoModal] = useState(false);
  const counter = useRef(0);

  // Prévia estilo Instagram (post cru, com roteiro) — null = fechada.
  const [igPreview, setIgPreview] = useState<Row | null>(null);
  // Mapa id → linha crua (traz roteiro/legenda/hashtags do post salvo p/ o preview).
  const rawById = useMemo(() => {
    const m = new Map<string, Row>();
    for (const p of posts) {
      const id = toText(p.id);
      if (id) m.set(id, p);
    }
    return m;
  }, [posts]);

  const addRow = useCallback((day: string) => {
    counter.current += 1;
    const key = `new-${counter.current}`;
    const nova: SchedRow = {
      key,
      id: null,
      titulo: '',
      formato: 'carrossel',
      estado: 'rascunho',
      objetivo: '',
      cta: '',
      link: '',
      briefingUrl: '',
      briefing: '',
      refs: '',
      day,
      hora: '',
      legenda: '',
      hashtags: '',
      origDay: null,
      orig: '',
    };
    setEditando(nova); // post novo abre direto no popup; o "Salvar" cria no banco
  }, []);

  /**
   * Remove a postagem NA HORA (igual à troca de status), sem esperar o "Salvar".
   * Post novo (sem id) só some da lista. Existente é excluído no banco
   * imediatamente — como isso é irreversível (≠ status), pede confirmação antes.
   * Otimista: some da tela na hora e volta à posição original se o DELETE falhar.
   */
  const removeRow = useCallback(
    async (key: string) => {
      const idx = rows.findIndex((r) => r.key === key);
      if (idx < 0) return;
      const alvo = rows[idx];
      if (!alvo.id) {
        setRows((rs) => rs.filter((r) => r.key !== key)); // novo → some da lista
        return;
      }
      const nome = alvo.titulo.trim() || 'sem título';
      if (!window.confirm(`Excluir "${nome}"? Esta ação não pode ser desfeita.`)) return;
      setRows((rs) => rs.filter((r) => r.key !== key)); // otimista
      try {
        await apiJson(`/api/conteudo/${alvo.id}`, 'DELETE');
      } catch (e) {
        setRows((rs) => {
          const arr = [...rs];
          arr.splice(Math.min(idx, arr.length), 0, alvo); // reverte na posição original
          return arr;
        });
        window.alert(`Não consegui excluir: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    [rows],
  );

  const isChanged = useCallback(
    (r: SchedRow) => r.orig !== snapshot(r),
    [],
  );

  /** Corpo (PostInput) de UM post a partir da linha — usado no POST e no PATCH. */
  function rowToPayload(r: SchedRow): PostInput {
    return {
      titulo: r.titulo.trim(),
      formato: r.formato,
      estado: r.estado,
      objetivo: r.objetivo || null,
      dataProgramada: combineDataHora(r.day, r.hora),
      ctaFinal: r.cta.trim() || null,
      linkPresenteNotion: r.link.trim() || null,
      briefingUrl: r.briefingUrl.trim() || null,
      briefing: r.briefing.trim() || null,
      refsLinks: r.refs.trim() || null,
    };
  }

  /** Salva o post do popup: PATCH se já existe, POST se novo. Um request só. */
  async function salvarPost(d: SchedRow) {
    if (!d.titulo.trim()) {
      window.alert('O título não pode ficar vazio.');
      return;
    }
    setSalvandoModal(true);
    try {
      if (d.id) {
        await apiJson(`/api/conteudo/${d.id}`, 'PATCH', rowToPayload(d));
        setRows((rs) => rs.map((r) => (r.key === d.key ? { ...d, origDay: d.day, orig: snapshot(d) } : r)));
      } else {
        const res = (await apiJson('/api/conteudo', 'POST', rowToPayload(d))) as
          | { created?: Array<{ id?: string }> }
          | null;
        const novoId = res?.created?.[0]?.id;
        if (!novoId) throw new Error('resposta sem id');
        const salvo = { ...d, id: novoId, origDay: d.day, orig: snapshot(d) };
        setRows((rs) =>
          rs.some((r) => r.key === d.key) ? rs.map((r) => (r.key === d.key ? salvo : r)) : [...rs, salvo],
        );
      }
      // Leva a agenda pra a semana da data (se estiver fora da atual) pra o post aparecer.
      if (d.day && (d.day < firstKey || d.day > lastKey)) setWeekStart(startOfWeek(dayKeyToDate(d.day)));
      setEditando(null);
    } catch (e) {
      window.alert(`Não consegui salvar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSalvandoModal(false);
    }
  }

  /** Remover pelo popup: existente confirma + DELETE (via removeRow); novo só fecha. */
  async function removerDoModal(d: SchedRow) {
    if (d.id) await removeRow(d.key);
    setEditando(null);
  }

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = weekDays[6];
  const firstKey = localDayKey(weekStart);
  const lastKey = localDayKey(weekEnd);

  // Posts SEM data no momento (existentes ou recém-esvaziados) — seção p/ agendar.
  const semData = rows.filter((r) => r.day === null);
  // Posts em OUTRAS semanas (fora da janela atual) — só um aviso/contagem.
  const foraSemana = rows.filter(
    (r) => r.day && (r.day < firstKey || r.day > lastKey),
  ).length;

  const weekLabel = `${weekStart.getDate()} ${MESES_ABBR[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MESES_ABBR[weekEnd.getMonth()]}`;
  const navBtn =
    'grid h-9 w-9 place-items-center rounded-lg border border-gray-700 text-gray-300 transition-colors hover:bg-gray-700/50 hover:text-white disabled:opacity-40';

  /**
   * Card de UMA postagem. COLAPSADO por padrão: mostra só o resumo escaneável
   * (formato, estado/"publicado", título) — é o que deixa a semana fácil de ler.
   * Um clique EXPANDE o editor (título, data, hora, formato/estado, briefing) e o
   * card passa a ocupar a linha inteira. A DATA é editável em qualquer card →
   * mudar a data move o post para outro dia. Se o post tiver slides, o 📱 abre a
   * prévia no estilo Instagram.
   */
  function renderCard(r: SchedRow) {
    const raw = r.id ? rawById.get(r.id) : undefined;
    const temSlides = !!raw && parseRoteiro(raw[ROTEIRO_KEY]).slides.length > 0;
    const hasBriefing = !!(r.briefingUrl.trim() || r.briefing.trim() || r.refs.trim());
    const changed = r.id ? isChanged(r) : !!r.titulo.trim();
    const st = DEFAULT_STATUS[r.estado] ?? { label: r.estado || '—', tone: 'neutral' as StatusTone };
    const stTone = STATUS_TONES[st.tone] ?? STATUS_TONES.neutral;
    const formatoLabel = FORMATO_OPTS.find(([v]) => v === r.formato)?.[1] ?? r.formato;
    /* A borda (e a faixa lateral grossa) diz o FORMATO sem precisar ler:
       reels é fúcsia, carrossel é azul. Mesma cor do selo de 2 letras. */
    const tone = formatTone(r.formato);

    return (
      <div
        key={r.key}
        className={`overflow-hidden rounded-xl border border-l-4 bg-gray-800 shadow-sm transition-colors ${tone.card}`}
      >
        {/* Resumo compacto — clique abre o popup de edição. */}
        <div className="flex items-start gap-2 p-3">
          <button
            type="button"
            onClick={() => setEditando(r)}
            className="flex min-w-0 flex-1 items-start gap-2.5 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          >
            <FormatChip formato={r.formato} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${stTone.pill}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${stTone.dot}`} aria-hidden="true" />
                  {st.label}
                </span>
                {r.hora && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                    <span aria-hidden="true">🕒</span>
                    {r.hora}
                  </span>
                )}
                {changed && <span className="text-[11px] font-medium text-amber-300">• editado</span>}
              </span>
              <span className="mt-1 block line-clamp-2 text-sm font-semibold text-gray-100" style={DISPLAY}>
                {r.titulo.trim() || <span className="font-normal text-gray-500">Sem título</span>}
              </span>
              <span className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-500">
                <span>{formatoLabel}</span>
                {/* Objetivo no funil: some quando não definido, pra não poluir o
                    histórico que nunca teve o campo preenchido. */}
                {OBJETIVO_LABEL[r.objetivo] && (
                  <span className="text-violet-300/80">· 🎯 {OBJETIVO_LABEL[r.objetivo]}</span>
                )}
                {hasBriefing && <span className="text-blue-300/80">· 📝 briefing</span>}
              </span>
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-1">
            {temSlides && raw && (
              <button
                type="button"
                onClick={() => setIgPreview(raw)}
                className="grid h-8 shrink-0 place-items-center rounded-lg border border-blue-500/40 bg-blue-500/10 px-2.5 text-sm text-blue-300 transition-colors hover:bg-blue-500/20"
                title="Ver como no Instagram"
                aria-label="Ver prévia no Instagram"
              >
                📱
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditando(r)}
              aria-label="Editar postagem"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gray-700 text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-gray-100"
            >
              <span aria-hidden="true">✏️</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-100" style={DISPLAY}>Cronograma</h2>
            <p className="text-xs text-gray-500">Adicione, edite ou remova as postagens de cada dia — tudo é salvo automaticamente.</p>
            <LegendaFormatos />
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
      </div>

      {/* Corpo: 7 dias + sem-data (largura cheia, alinhado à esquerda). */}
      <div className="space-y-4">
        {weekDays.map((day) => {
          const dayKey = localDayKey(day);
          const dayRows = rows.filter((r) => r.day === dayKey);
          const isToday = dayKey === localDayKey(new Date());
          return (
            <section key={dayKey} className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className={`text-base font-semibold ${isToday ? 'text-blue-300' : 'text-gray-100'}`} style={DISPLAY}>
                  {DIA_ABBR[day.getDay()]} {day.getDate()}
                  {isToday && <span className="ml-1.5 text-xs font-normal text-blue-400/80">· hoje</span>}
                  {/* Quantos de cada formato caem no dia — a conta que importa
                      quando a meta é em reels por dia. */}
                  {dayRows.length > 0 && (
                    <span className="ml-2 text-[11px] font-normal text-gray-500">{resumoFormatos(dayRows.map((r) => r.formato))}</span>
                  )}
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
                <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
                  {dayRows.map((r) => renderCard(r))}
                </div>
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
            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
              {semData.map((r) => renderCard(r))}
            </div>
          </section>
        )}

        {/* Rodapé: sem botão Salvar — cada alteração já foi gravada na hora. */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-700/60 pt-4">
          <span className="text-xs text-gray-500">Clique num post pra editar. As mudanças são salvas ao clicar em Salvar.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700/50"
            >
              Voltar ao painel
            </button>
          </div>
        </div>
      </div>

      {igPreview && (
        <InstagramPreviewModal post={igPreview} fields={fields} onClose={() => setIgPreview(null)} />
      )}

      {editando && (
        <EditarPostModal
          key={editando.key}
          inicial={editando}
          salvando={salvandoModal}
          onSalvar={salvarPost}
          onRemover={removerDoModal}
          onFechar={() => setEditando(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// Preview do post (modal) — mostra o carrossel/reels montado
// ============================================================

interface SlideView {
  titulo: string;
  corpo: string;
  /** Se definido, o slide é uma IMAGEM própria (ex.: capa desenhada) — full-bleed. */
  img?: string;
  /** Slide já é uma arte pronta (1080×1350) — o preview mostra a `img` direto, sem re-renderizar. */
  full?: boolean;
  /**
   * Este slide é um VÍDEO (o `carrossel:render` gerou o MP4 do slide inteiro).
   * A `img` continua sendo o quadro parado, que é o que o preview mostra; o que
   * sobe no Instagram é este arquivo. Carrossel aceita misturar foto e vídeo.
   */
  mp4?: string;
}
interface CenaView {
  tempo: string;
  fala: string;
  texto_tela: string;
}

/** Extrai slides/cenas/capa do campo `roteiro` (jsonb — objeto OU string JSON). */
function parseRoteiro(value: unknown): { slides: SlideView[]; cenas: CenaView[]; capaBrief: string } {
  let obj: unknown = value;
  if (typeof value === 'string') {
    try {
      obj = JSON.parse(value);
    } catch {
      obj = null;
    }
  }
  const rec = obj != null && typeof obj === 'object' ? (obj as Record<string, unknown>) : {};
  const slides = (Array.isArray(rec.slides) ? rec.slides : []).map((s) => {
    const o = (s ?? {}) as Record<string, unknown>;
    return {
      titulo: toText(o.titulo),
      corpo: toText(o.corpo),
      img: toText(o.img) || undefined,
      full: o.full === true,
      mp4: toText(o.mp4) || undefined,
    };
  });
  const cenas = (Array.isArray(rec.cenas) ? rec.cenas : []).map((c) => {
    const o = (c ?? {}) as Record<string, unknown>;
    return { tempo: toText(o.tempo), fala: toText(o.fala), texto_tela: toText(o.texto_tela) };
  });
  return { slides, cenas, capaBrief: toText(rec.capa_brief) };
}

/** Botão "copiar para a área de transferência" com feedback de 1,6s. */
function CopyButton({
  text,
  label = 'Copiar',
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      window.setTimeout(() => setDone(false), 1600);
    } catch {
      /* clipboard indisponível (contexto inseguro) — ignora silenciosamente */
    }
  }, [text]);
  return (
    <button
      type="button"
      onClick={onCopy}
      className={
        className ??
        'inline-flex items-center gap-1.5 rounded-lg border border-gray-600/60 bg-gray-800/60 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-700/60'
      }
    >
      {done ? '✓ Copiado' : label}
    </button>
  );
}

// ---- Geração de IMAGENS dos slides (PNG 1080×1350 · pronto pro Instagram) ----

// Paleta usada pela prévia estilo Instagram (chrome do frame) — roxo da marca.
const IMG_BRAND = '#6528d3';
const IMG_BRAND_STRONG = '#5421b5';
const IMG_BRAND_DEEP = '#45199a';
const IMG_SANS = 'ui-sans-serif, system-ui, -apple-system, sans-serif';

// Estilo dos SLIDES (referência Dev em Dobro): fonte Ubuntu, preto + amarelo, CTA roxo.
const SLIDE_FONT = "'Ubuntu', ui-sans-serif, system-ui, sans-serif";
const SLIDE_BG = '#0e0e12';
const SLIDE_ACCENT = '#f5c518';
const SLIDE_BODY = '#c7c7cf';
const SLIDE_MUTED = '#8b8b95';
const SLIDE_PURPLE = 'linear-gradient(160deg, #7c3aed 0%, #5b21b6 100%)';
const SLIDE_COVER_BG =
  'radial-gradient(85% 62% at 12% 4%, rgba(124,58,237,.55) 0%, rgba(124,58,237,0) 58%), #0e0e12';

/** Renderiza um título pintando de amarelo as palavras marcadas com **assim**. */
function renderRealce(text: string): ReactNode {
  // split com grupo de captura: índices ímpares são os trechos destacados.
  return text.split(/\*\*(.+?)\*\*/g).map((parte, i) =>
    i % 2 === 1 ? (
      <span key={i} style={{ color: SLIDE_ACCENT }}>
        {parte}
      </span>
    ) : (
      parte
    ),
  );
}

/** Remove os marcadores **...** (para exibir o texto puro onde não há destaque). */
function stripMarks(s: string): string {
  return (s ?? '').replace(/\*\*(.+?)\*\*/g, '$1');
}

/** Um slide como IMAGEM no estilo Dev em Dobro (Ubuntu; preto+amarelo; CTA roxo). */
function SlideImageCard({
  slide,
  index,
  total,
}: {
  slide: SlideView;
  index: number;
  total: number;
  /** aceitos p/ compat com os call sites (o layout novo não usa marca/handle no slide). */
  marca: string;
  handle: string;
}) {
  // Slide já é uma arte pronta (padrão JARVIS): mostra a imagem direto, sem re-renderizar.
  if (slide.full && slide.img) {
    return (
      <img src={slide.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    );
  }
  const isCapa = index === 0;
  const isCTA = index === total - 1 && total > 1;

  const baseStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    padding: 30,
    boxSizing: 'border-box',
    fontFamily: SLIDE_FONT,
  };

  // Barra de progresso (amarela) + "N/total" — comum a todos os slides.
  const progresso = (
    <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          position: 'relative',
          flex: 1,
          height: 3,
          borderRadius: 999,
          background: isCTA ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.14)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${((index + 1) / total) * 100}%`,
            background: SLIDE_ACCENT,
            borderRadius: 999,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: SLIDE_FONT,
          fontSize: 11,
          fontWeight: 700,
          color: isCTA ? 'rgba(255,255,255,.9)' : SLIDE_MUTED,
        }}
      >
        {index + 1}/{total}
      </span>
    </div>
  );

  // ---- CTA (fundo roxo; título + texto no topo, imagem emoldurada, barra embaixo) ----
  if (isCTA) {
    return (
      <div style={{ ...baseStyle, background: SLIDE_PURPLE }}>
        <div>
          <h3
            style={{
              fontFamily: SLIDE_FONT,
              fontWeight: 700,
              color: '#fff',
              fontSize: 31,
              lineHeight: 1.12,
              letterSpacing: '-.02em',
              margin: 0,
            }}
          >
            {renderRealce(slide.titulo)}
          </h3>
          {slide.corpo && (
            <p style={{ marginTop: 14, fontSize: 16.5, lineHeight: 1.5, color: 'rgba(255,255,255,.94)' }}>
              {stripMarks(slide.corpo)}
            </p>
          )}
        </div>
        {slide.img ? (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              marginTop: 16,
              marginBottom: 6,
              borderRadius: 14,
              overflow: 'hidden',
              border: '3px solid rgba(255,255,255,.9)',
              boxShadow: '0 10px 26px rgba(0,0,0,.4)',
            }}
          >
            <img src={slide.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ) : (
          <div style={{ marginTop: 'auto' }} />
        )}
        {progresso}
      </div>
    );
  }

  // ---- Capa: imagem de fundo (com overlay elegante) OU glow roxo; texto por cima ----
  if (isCapa) {
    return (
      <div style={{ ...baseStyle, background: slide.img ? '#0a0713' : SLIDE_COVER_BG }}>
        {slide.img && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0 }}>
            <img src={slide.img} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
            {/* esmaecido: o fim da imagem funde no fundo escuro (sem linha dura) */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: -1,
                height: 150,
                background:
                  'linear-gradient(to bottom, rgba(10,7,19,0) 0%, rgba(10,7,19,.5) 48%, #0a0713 100%)',
              }}
            />
          </div>
        )}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 2,
            color: 'rgba(255,255,255,.6)',
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          ›
        </span>
        <div style={{ position: 'relative', zIndex: 2, marginTop: 'auto' }}>
          <h3
            style={{
              fontFamily: SLIDE_FONT,
              fontWeight: 700,
              color: '#fff',
              fontSize: 31,
              lineHeight: 1.12,
              letterSpacing: '-.02em',
              margin: 0,
              textShadow: slide.img ? '0 2px 12px rgba(0,0,0,.55)' : undefined,
            }}
          >
            {renderRealce(slide.titulo)}
          </h3>
          {slide.corpo && (
            <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.5, color: slide.img ? '#e6e6ec' : SLIDE_BODY }}>
              {stripMarks(slide.corpo)}
            </p>
          )}
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>{progresso}</div>
      </div>
    );
  }

  // ---- Slide interno (preto; título grande com destaque + corpo; ancorado acima) ----
  return (
    <div style={{ ...baseStyle, background: SLIDE_BG }}>
      <span
        aria-hidden="true"
        style={{ position: 'absolute', top: '46%', right: 14, color: 'rgba(255,255,255,.38)', fontSize: 22, fontWeight: 700 }}
      >
        ›
      </span>
      <div style={{ height: '18%' }} />
      <div>
        <h3
          style={{
            fontFamily: SLIDE_FONT,
            fontWeight: 700,
            color: '#fff',
            fontSize: 31,
            lineHeight: 1.12,
            letterSpacing: '-.02em',
            margin: 0,
          }}
        >
          {renderRealce(slide.titulo)}
        </h3>
        {slide.corpo && (
          <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.55, color: SLIDE_BODY }}>{stripMarks(slide.corpo)}</p>
        )}
      </div>
      <div style={{ marginTop: 'auto' }}>{progresso}</div>
    </div>
  );
}

/** Slug seguro para nome de arquivo, a partir do título. */
function slugify(s: string): string {
  return (
    (s || 'carrossel')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) || 'carrossel'
  );
}

/**
 * Exporta os elementos de stage (cada um 420×525) como PNG 1080×1350 e baixa
 * tudo num .zip. As libs pesadas (html-to-image + jszip) só carregam aqui.
 */
async function exportSlidesZip(els: (HTMLDivElement | null)[], titulo: string): Promise<void> {
  const [{ toPng }, JSZip] = await Promise.all([
    import('html-to-image'),
    import('jszip').then((m) => m.default),
  ]);
  // Garante a Ubuntu carregada antes do print (senão cai no fallback).
  try {
    await Promise.all([document.fonts.load('700 24px Ubuntu'), document.fonts.load('400 16px Ubuntu')]);
  } catch {
    /* fonte indisponível — segue com fallback */
  }
  await document.fonts.ready;
  const zip = new JSZip();
  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    if (!el) continue;
    const dataUrl = await toPng(el, { width: 420, height: 525, pixelRatio: 1080 / 420, cacheBust: true });
    zip.file(`slide_${String(i + 1).padStart(2, '0')}.png`, dataUrl.split(',')[1], { base64: true });
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `carrossel-${slugify(titulo)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Baixa as imagens PRONTAS (as PNGs já renderizadas em /carrosseis/…) num .zip.
 * Para carrosséis com arte pronta (slides `full`), pega os arquivos reais em vez
 * de re-renderizar — a arte no zip é idêntica à do post. Só carrega o jszip aqui.
 */
async function baixarImagensZip(urls: string[], titulo: string): Promise<void> {
  const JSZip = await import('jszip').then((m) => m.default);
  const zip = new JSZip();
  for (let i = 0; i < urls.length; i++) {
    const res = await fetch(urls[i], { cache: 'no-store' });
    if (!res.ok) throw new Error(`Falha ao baixar slide ${i + 1} (${res.status}).`);
    // A extensão vem da URL, não fixa em .png: slide de vídeo entra como .mp4 e
    // mantém a numeração, que é a ordem em que a pessoa vai tocar no app.
    const ext = urls[i].toLowerCase().endsWith('.mp4') ? 'mp4' : 'png';
    zip.file(`slide_${String(i + 1).padStart(2, '0')}.${ext}`, await res.blob());
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `carrossel-${slugify(titulo)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Botão "baixar (.zip)" — usa os arquivos prontos; mostra estado de carregamento. */
function DownloadZipButton({ urls, titulo }: { urls: string[]; titulo: string }) {
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // O rótulo conta o que tem dentro: com vídeo no meio, "8 imagens" faria a pessoa
  // achar que faltou arquivo (ou postar o quadro parado no lugar da animação).
  const videos = urls.filter((u) => u.toLowerCase().endsWith('.mp4')).length;
  const imagens = urls.length - videos;
  const rotulo = videos
    ? `${imagens} ${imagens === 1 ? 'imagem' : 'imagens'} + ${videos} ${videos === 1 ? 'vídeo' : 'vídeos'}`
    : `${imagens} ${imagens === 1 ? 'imagem' : 'imagens'}`;
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          setBusy(true);
          setErro(null);
          try {
            await baixarImagensZip(urls, titulo);
          } catch (e) {
            setErro(e instanceof Error ? e.message : 'Falha ao gerar o .zip.');
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? 'Gerando…' : `⬇ Baixar ${rotulo} (.zip)`}
      </button>
      {erro && (
        <span role="alert" className="text-xs text-red-400">
          {erro}
        </span>
      )}
    </>
  );
}

/** Strip visual dos slides + botão que exporta todos como PNG 1080×1350 num .zip. */
function CarrosselImagens({
  titulo,
  slides,
  marca,
  handle,
}: {
  titulo: string;
  slides: SlideView[];
  marca: string;
  handle: string;
}) {
  const n = slides.length;
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [exporting, setExporting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const SCALE = 0.36; // miniatura visível (420×525 → ~151×189)

  const exportar = useCallback(async () => {
    setExporting(true);
    setErro(null);
    try {
      await exportSlidesZip(exportRefs.current, titulo);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao gerar as imagens.');
    } finally {
      setExporting(false);
    }
  }, [titulo]);

  if (n === 0) return null;

  return (
    <div>
      <SectionLabel
        aside={
          <button
            type="button"
            onClick={() => void exportar()}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {exporting ? 'Gerando…' : `⬇ Baixar ${n} imagens (.zip)`}
          </button>
        }
      >
        Imagens · 1080×1350
      </SectionLabel>

      {/* Miniaturas visíveis (o que será exportado) */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {slides.map((s, i) => (
          <div
            key={i}
            className="shrink-0 overflow-hidden rounded-lg border border-gray-700/50 shadow-sm"
            style={{ width: 420 * SCALE, height: 525 * SCALE }}
          >
            <div style={{ width: 420, height: 525, transform: `scale(${SCALE})`, transformOrigin: '0 0' }}>
              <SlideImageCard slide={s} index={i} total={n} marca={marca} handle={handle} />
            </div>
          </div>
        ))}
      </div>
      {erro && (
        <p role="alert" className="mt-1 text-xs text-red-400">
          {erro}
        </p>
      )}

      {/* Stage de export (fora da tela): cada slide em 420×525 pro screenshot */}
      <div aria-hidden="true" style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }}>
        {slides.map((s, i) => (
          <div
            key={i}
            ref={(el) => {
              exportRefs.current[i] = el;
            }}
            style={{ width: 420, height: 525, overflow: 'hidden' }}
          >
            <SlideImageCard slide={s} index={i} total={n} marca={marca} handle={handle} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Prévia estilo FEED DO INSTAGRAM (frame branco + slides da marca) ----

const IG_PATHS: Record<string, string> = {
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z',
  comment: 'M21 11.5a8.4 8.4 0 0 1-8.5 8.4 8.6 8.6 0 0 1-3.9-.9L3 21l1.9-5.6a8.4 8.4 0 1 1 16.1-3.9z',
  share: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  save: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
};

function IgIcon({ name }: { name: keyof typeof IG_PATHS }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="23"
      height="23"
      fill="none"
      stroke="#1f2430"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={IG_PATHS[name]} />
    </svg>
  );
}

/** Seta de navegação sobreposta ao carrossel. */
function NavArrow({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'left' ? 'Slide anterior' : 'Próximo slide'}
      style={{
        position: 'absolute',
        top: '50%',
        left: dir === 'left' ? 8 : undefined,
        right: dir === 'right' ? 8 : undefined,
        transform: 'translateY(-50%)',
        width: 30,
        height: 30,
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(255,255,255,.92)',
        color: '#1f2430',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,.18)',
        fontSize: 17,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {dir === 'left' ? '‹' : '›'}
    </button>
  );
}

/** Post navegável no formato do feed do Instagram (frame branco; slides da marca). */
function InstagramPreview({
  titulo,
  slides,
  legenda,
  hashtags = [],
  marca = 'Dev em Dobro',
  handle = '@devemdobro',
}: {
  titulo: string;
  slides: SlideView[];
  legenda?: string;
  hashtags?: string[];
  marca?: string;
  handle?: string;
}) {
  const [idx, setIdx] = useState(0);
  const n = slides.length;
  const go = useCallback((k: number) => setIdx(Math.max(0, Math.min(n - 1, k))), [n]);

  const [dragX, setDragX] = useState<number | null>(null);
  function onPointerUp(clientX: number) {
    if (dragX === null) return;
    const dx = clientX - dragX;
    if (dx < -45) go(idx + 1);
    else if (dx > 45) go(idx - 1);
    setDragX(null);
  }

  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [exporting, setExporting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const exportar = useCallback(async () => {
    setExporting(true);
    setErro(null);
    try {
      await exportSlidesZip(exportRefs.current, titulo);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao gerar as imagens.');
    } finally {
      setExporting(false);
    }
  }, [titulo]);

  if (n === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        role="group"
        aria-roledescription="carrossel"
        aria-label={`Prévia do post: ${titulo}`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(idx + 1);
          else if (e.key === 'ArrowLeft') go(idx - 1);
        }}
        tabIndex={0}
        style={{
          width: 400,
          maxWidth: '100%',
          background: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 24px 60px -24px rgba(20,10,40,.55)',
          border: '1px solid #ececf2',
          fontFamily: IMG_SANS,
        }}
      >
        {/* Header do post */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderBottom: '1px solid #f1f1f5' }}>
          <div
            aria-hidden="true"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${IMG_BRAND}, ${IMG_BRAND_DEEP})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 17,
              flex: 'none',
            }}
          >
            {marca.charAt(0).toUpperCase()}
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2430' }}>{marca}</div>
            <div style={{ fontSize: 11, color: '#8a8f9c' }}>{handle}</div>
          </div>
          <div style={{ marginLeft: 'auto', color: '#c2c4cc', fontWeight: 700, letterSpacing: 1 }} aria-hidden="true">
            •••
          </div>
        </div>

        {/* Carrossel (4:5) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4 / 5',
            overflow: 'hidden',
            touchAction: 'pan-y',
            userSelect: 'none',
            cursor: 'grab',
          }}
          onPointerDown={(e) => setDragX(e.clientX)}
          onPointerUp={(e) => onPointerUp(e.clientX)}
        >
          <div
            style={{
              display: 'flex',
              height: '100%',
              transform: `translateX(-${idx * 100}%)`,
              transition: 'transform .38s cubic-bezier(.22,.7,.2,1)',
            }}
          >
            {slides.map((s, i) => (
              <div key={i} style={{ flex: 'none', width: '100%', height: '100%' }}>
                <SlideImageCard slide={s} index={i} total={n} marca={marca} handle={handle} />
              </div>
            ))}
          </div>

          {idx > 0 && <NavArrow dir="left" onClick={() => go(idx - 1)} />}
          {idx < n - 1 && <NavArrow dir="right" onClick={() => go(idx + 1)} />}

          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(18,10,32,.55)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 999,
            }}
          >
            {idx + 1}/{n}
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '10px 0 4px' }}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para o slide ${i + 1}`}
              onClick={() => go(i)}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                background: i === idx ? IMG_BRAND : '#d6d3e0',
                transform: i === idx ? 'scale(1.25)' : 'none',
                transition: 'all .2s',
              }}
            />
          ))}
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '8px 14px 2px' }}>
          <IgIcon name="heart" />
          <IgIcon name="comment" />
          <IgIcon name="share" />
          <span style={{ marginLeft: 'auto', display: 'inline-flex' }}>
            <IgIcon name="save" />
          </span>
        </div>

        {/* Legenda — mostra o texto COMO vai sair no post: a linha de follow no topo
            (montarDescricaoInsta) e as quebras de parágrafo preservadas por pre-wrap.
            Sem isso a prévia mentia: aqui vinha a legenda crua num bloco corrido. */}
        <div
          style={{
            padding: '6px 14px 15px',
            fontSize: 13,
            lineHeight: 1.45,
            color: '#2a2e3a',
            whiteSpace: 'pre-wrap',
          }}
        >
          <b style={{ color: '#1f2430' }}>{handle.replace('@', '')}</b>{' '}
          {montarDescricaoInsta(legenda || titulo, '')}
          {hashtags.length > 0 && (
            <div style={{ marginTop: 6, color: IMG_BRAND_STRONG }}>
              {hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}
            </div>
          )}
          <span
            style={{
              display: 'block',
              marginTop: 7,
              fontSize: 10,
              letterSpacing: '.5px',
              color: '#9a9ea9',
              textTransform: 'uppercase',
            }}
          >
            Agora
          </span>
        </div>
      </div>

      <p className="mt-2.5 text-xs text-gray-400">
        Prévia de feed · arraste, use as setas ou os pontinhos pra navegar
      </p>

      <button
        type="button"
        onClick={() => void exportar()}
        disabled={exporting}
        className="mt-3 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {exporting ? 'Gerando imagens…' : `⬇ Baixar ${n} imagens (1080×1350 · .zip)`}
      </button>
      {erro && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {erro}
        </p>
      )}

      {/* Stage de export (fora da tela): cada slide em 420×525 pro screenshot */}
      <div aria-hidden="true" style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }}>
        {slides.map((s, i) => (
          <div
            key={i}
            ref={(el) => {
              exportRefs.current[i] = el;
            }}
            style={{ width: 420, height: 525, overflow: 'hidden' }}
          >
            <SlideImageCard slide={s} index={i} total={n} marca={marca} handle={handle} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Modal que centraliza a prévia estilo Instagram de um post. */
function InstagramPreviewModal({
  post,
  fields,
  onClose,
}: {
  post: Row;
  fields: FieldMap;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const titulo = toText(post[fields.title]) || 'Sem título';
  const legenda = toText(post[LEGENDA_KEY]);
  const hashtags = toText(post[HASHTAGS_KEY])
    .split(/[\s,]+/)
    .map((h) => h.replace(/^#/, ''))
    .filter(Boolean);
  const { slides } = parseRoteiro(post[ROTEIRO_KEY]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Prévia no Instagram: ${titulo}`}
    >
      <div className="my-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-gray-200">📱 Prévia no Instagram</span>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg border border-gray-700 text-gray-300 transition-colors hover:bg-gray-700/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label="Fechar prévia"
          >
            ✕
          </button>
        </div>
        {slides.length > 0 ? (
          <InstagramPreview titulo={titulo} slides={slides} legenda={legenda} hashtags={hashtags} />
        ) : (
          <div className="rounded-2xl border border-gray-700/60 bg-gray-900 p-8 text-center text-sm text-gray-400">
            Este post ainda não tem slides pra pré-visualizar como carrossel.
          </div>
        )}
      </div>
    </div>
  );
}

/** Modal de pré-visualização: capa/gancho + slides (ou cenas) + legenda + CTA + hashtags. */
function PostPreview({
  post,
  fields,
  statusMap,
  onClose,
}: {
  post: Row;
  fields: FieldMap;
  statusMap: Record<string, StatusEntry>;
  onClose: () => void;
}) {
  // Fecha com ESC (além do clique no backdrop e no ✕).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const titulo = toText(post[fields.title]) || 'Sem título';
  const formato = toText(post[fields.format]);
  const estadoRaw = toText(post[fields.status]);
  const d = parseDate(toText(post[fields.date]));
  const gancho = toText(post[GANCHO_KEY]);
  const legenda = toText(post[LEGENDA_KEY]);
  const cta = toText(post[CTA_KEY]);
  const hashtags = toText(post[HASHTAGS_KEY])
    .split(/[\s,]+/)
    .map((h) => h.replace(/^#/, ''))
    .filter(Boolean);
  const { slides, cenas, capaBrief } = parseRoteiro(post[ROTEIRO_KEY]);
  // Onde o slide tem vídeo, o que vai pro .zip é o MP4: é ele que sobe no
  // Instagram. A `img` desse slide continua servindo de preview no board.
  const imgUrls = slides
    .filter((s) => s.full && (s.mp4 || s.img))
    .map((s) => (s.mp4 ?? s.img) as string);
  const isReels = formato.toLowerCase().includes('reel');
  const vazio = !gancho && !legenda && slides.length === 0 && cenas.length === 0;
  /** Texto final do Instagram (follow + legenda + hashtags) — é o que se copia. */
  const descricaoInsta = montarDescricaoInsta(legenda, hashtags);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Pré-visualização: ${titulo}`}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-2xl border border-gray-700/60 bg-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho fixo */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 rounded-t-2xl border-b border-gray-700/60 bg-gray-900/95 p-5 backdrop-blur">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FormatChip formato={formato} size="sm" />
              <StatusPill estadoRaw={estadoRaw} statusMap={statusMap} />
            </div>
            <h2 className="mt-2 text-lg font-semibold leading-snug text-gray-100" style={DISPLAY}>
              {titulo}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {d ? `Programado: ${fmtDiaMes(d)}` : 'Sem data'}
              {formato ? ` · ${formato}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gray-700 text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label="Fechar pré-visualização"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Ações rápidas (topo) */}
          {(legenda || imgUrls.length > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {imgUrls.length > 0 && <DownloadZipButton urls={imgUrls} titulo={titulo} />}
              {legenda && (
                <CopyButton
                  text={descricaoInsta}
                  label="📋 Copiar descrição"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-100 transition-colors hover:bg-gray-700"
                />
              )}
            </div>
          )}

          {/* Descrição pro Insta — o texto FINAL que o social media cola no post:
              linha de follow + legenda + hashtags. É montado na hora (ver
              descricao-insta.ts), então vale pra todo post sem precisar editar
              legenda nenhuma. */}
          {legenda && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/80">
                  Descrição pro Insta
                </div>
                <CopyButton
                  text={descricaoInsta}
                  label="📋 Copiar"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600/80 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-600"
                />
              </div>
              <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-gray-200">
                {descricaoInsta}
              </pre>
            </div>
          )}

          {/* Capa / gancho */}
          {gancho && (
            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/15 to-blue-700/10 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-300/80">
                Capa · gancho
              </div>
              <p className="mt-1.5 text-base font-semibold leading-snug text-gray-100" style={DISPLAY}>
                {gancho}
              </p>
              {capaBrief && (
                <p className="mt-2 text-xs text-gray-400">
                  <span className="text-gray-500">Ideia de capa: </span>
                  {capaBrief}
                </p>
              )}
            </div>
          )}

          {/* Imagens do carrossel (só carrossel com slides) */}
          {!isReels && slides.length > 0 && (
            <CarrosselImagens titulo={titulo} slides={slides} marca="Dev em Dobro" handle="@devemdobro" />
          )}

          {/* Slides (carrossel) */}
          {!isReels && slides.length > 0 && (
            <div>
              <SectionLabel>{slides.length} slides</SectionLabel>
              <ol className="space-y-3">
                {slides.map((s, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border border-gray-700/50 bg-gray-800/60 p-4">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-500/15 text-xs font-bold text-blue-300">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      {s.titulo && (
                        <div className="text-sm font-semibold text-gray-100" style={DISPLAY}>
                          {stripMarks(s.titulo)}
                        </div>
                      )}
                      {s.corpo && (
                        <div className="mt-1 text-sm leading-relaxed text-gray-300">{stripMarks(s.corpo)}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Cenas (reels) */}
          {isReels && cenas.length > 0 && (
            <div>
              <SectionLabel>{cenas.length} cenas</SectionLabel>
              <ol className="space-y-3">
                {cenas.map((c, i) => (
                  <li key={i} className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-fuchsia-300">
                      <span className="grid h-6 w-6 place-items-center rounded-lg bg-fuchsia-500/15">{i + 1}</span>
                      {c.tempo && <span>{c.tempo}</span>}
                    </div>
                    {c.texto_tela && <div className="mt-2 text-sm font-medium text-gray-100">{c.texto_tela}</div>}
                    {c.fala && (
                      <div className="mt-1 text-sm text-gray-400">
                        <span className="text-gray-500">Fala: </span>
                        {c.fala}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Legenda */}
          {legenda && (
            <div>
              <SectionLabel aside={<CopyButton text={legenda} label="Copiar" />}>Legenda</SectionLabel>
              <p className="whitespace-pre-line rounded-xl border border-gray-700/50 bg-gray-800/40 p-4 text-sm leading-relaxed text-gray-300">
                {legenda}
              </p>
            </div>
          )}

          {/* CTA */}
          {cta && (
            <div>
              <SectionLabel>CTA</SectionLabel>
              <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-200">
                {cta}
              </p>
            </div>
          )}

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div>
              <SectionLabel aside={<CopyButton text={hashtags.map((h) => `#${h}`).join(' ')} label="Copiar" />}>
                Hashtags
              </SectionLabel>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((h, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-gray-700/60 bg-gray-800/60 px-2.5 py-1 text-xs text-blue-300"
                  >
                    #{h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {vazio && (
            <EmptyState message="Este post ainda não tem roteiro/legenda para pré-visualizar." />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Modal "Gerar com IA" — cria um rascunho (carrossel/reels em AIDA)
// ============================================================

/** Resposta de /api/conteudo/gerar em caso de sucesso. */
interface GerarResult {
  id?: string;
  titulo?: string;
  formato?: string;
}

/**
 * Modal do gerador: o criador manda um TEMA livre OU um LINK de referência do
 * Instagram, escolhe o formato e a Claude devolve um rascunho no board. A chamada
 * é síncrona e pode levar até ~1 min (pensa + escreve o post inteiro).
 */
function GerarModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (r: GerarResult) => void;
}) {
  const [mode, setMode] = useState<'tema' | 'link'>('tema');
  const [tema, setTema] = useState('');
  const [url, setUrl] = useState('');
  const [nota, setNota] = useState('');
  const [formato, setFormato] = useState<'carrossel' | 'reels'>('carrossel');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fecha com ESC (mas não no meio de uma geração — evita perder o trabalho).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  const podeGerar = mode === 'tema' ? tema.trim().length > 0 : url.trim().length > 0;

  async function gerar() {
    if (!podeGerar) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload =
        mode === 'tema'
          ? { tema: tema.trim(), formato }
          : { url: url.trim(), nota: nota.trim() || undefined, formato };
      const res = (await apiJson('/api/conteudo/gerar', 'POST', payload)) as {
        id?: string;
        titulo?: string;
        formato?: string;
      } | null;
      onCreated(res ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  const tab = (v: 'tema' | 'link', label: string) => (
    <button
      type="button"
      onClick={() => setMode(v)}
      disabled={submitting}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        mode === v ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
      }`}
      aria-pressed={mode === v}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Gerar conteúdo com IA"
    >
      <div
        className="my-8 w-full max-w-lg rounded-2xl border border-gray-700/60 bg-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-700/60 p-5">
          <div>
            <h2 className="text-lg font-semibold leading-snug text-gray-100" style={DISPLAY}>
              ✨ Novo carrossel com IA
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Descreva um tema ou cole um link de referência. Vira um rascunho no board.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gray-700 text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-white disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Corpo */}
        <div className="space-y-4 p-5">
          <div className="inline-flex rounded-xl border border-gray-700/60 bg-gray-800/60 p-0.5">
            {tab('tema', 'Tema livre')}
            {tab('link', 'A partir de link')}
          </div>

          {mode === 'tema' ? (
            <label className="block">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Tema</span>
              <TextArea
                value={tema}
                rows={3}
                autoFocus
                disabled={submitting}
                placeholder="Ex.: 3 erros de quem começa a programar e trava no primeiro projeto"
                onChange={(e) => setTema(e.target.value)}
                className="mt-1"
              />
            </label>
          ) : (
            <>
              <label className="block">
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Link do Instagram
                </span>
                <TextInput
                  type="url"
                  inputMode="url"
                  value={url}
                  autoFocus
                  disabled={submitting}
                  placeholder="https://www.instagram.com/reel/…"
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Nota <span className="normal-case text-gray-600">(opcional — por que essa ref é boa)</span>
                </span>
                <TextInput
                  value={nota}
                  disabled={submitting}
                  placeholder="Ex.: esse gancho bombou nos comentários"
                  onChange={(e) => setNota(e.target.value)}
                  className="mt-1"
                />
              </label>
            </>
          )}

          <label className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Formato</span>
            <Select
              value={formato}
              onChange={(v) => setFormato(v === 'reels' ? 'reels' : 'carrossel')}
              options={[
                ['carrossel', 'Carrossel'],
                ['reels', 'Reels'],
              ]}
              ariaLabel="Formato"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          {submitting && (
            <p className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-200">
              Gerando o rascunho… isso pode levar até 1 minuto. Não feche esta janela.
            </p>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-700/60 p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700/50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void gerar()}
            disabled={submitting || !podeGerar}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Gerando…' : '✨ Gerar rascunho'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Relatório da rede — período + KPIs (deriva de v_conteudo_desempenho)
// ============================================================

/** Número (ou null) a partir de valor cru vindo da view. */
function numOf(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Presets do filtro de período: [rótulo, nº de dias | null p/ "tudo"]. */
const PERIODOS: ReadonlyArray<readonly [string, number | null]> = [
  ['7 dias', 7],
  ['30 dias', 30],
  ['90 dias', 90],
  ['Tudo', null],
];
/** Períodos da visão "Conta": a Graph API limita o range de insights a 30 dias. */
const PERIODOS_CONTA: ReadonlyArray<readonly [string, number | null]> = [
  ['7 dias', 7],
  ['30 dias', 30],
];
const PERIODO_PADRAO = 7;

/** Resposta de /api/instagram/account-insights (métricas de nível de conta). */
interface AccountInsightsResp {
  connected: boolean;
  dias?: number;
  /** Início da janela (ISO) — meia-noite no fuso da conta. */
  desde?: string;
  /** Fim da janela (ISO) — meia-noite de hoje: o dia corrente não entra. */
  ate?: string;
  reach?: number;
  views?: number;
  interactions?: number;
  /** Seguidores líquidos (ganhos − perdidos) no período. */
  followers?: number;
  followersGained?: number;
  followersLost?: number;
  error?: string;
}

/**
 * Data vinda do banco → Date. O `/api/query` devolve os `timestamp` SEM fuso
 * ("2026-08-16 20:18:39") e o valor gravado é UTC. Sem o "Z" o navegador lê a
 * string como hora LOCAL e joga tudo 3h pra frente — post publicado depois das
 * 21h caía no dia seguinte e sumia da contagem da semana.
 */
function dataDoBanco(valor: string): Date {
  const s = valor.trim();
  const semFuso = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(s);
  const d = new Date(semFuso ? `${s.replace(' ', 'T')}Z` : s);
  // Meia-noite UTC exata = data de CALENDÁRIO (data digitada sem hora), não um
  // instante: o dia é o que está escrito, sem conversão de fuso.
  if (
    !Number.isNaN(d.getTime()) &&
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  ) {
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  return d;
}

/** Início do dia (00:00 local) de `dias` atrás — corte inclusivo. */
function cortePeriodo(dias: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - dias + 1);
  return d;
}

function PeriodPicker({
  value,
  onChange,
  options = PERIODOS,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  options?: ReadonlyArray<readonly [string, number | null]>;
}) {
  return (
    <div className="inline-flex rounded-xl border border-gray-700/60 bg-gray-800/60 p-0.5">
      {options.map(([label, days]) => {
        const active = value === days;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(days)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              active ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
            aria-pressed={active}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Alterna a FONTE do relatório: atividade da conta × soma dos posts publicados. */
function SourceToggle({
  value,
  onChange,
}: {
  value: 'conta' | 'posts';
  onChange: (v: 'conta' | 'posts') => void;
}) {
  const opts: ReadonlyArray<[('conta' | 'posts'), string]> = [
    ['conta', '📊 Conta'],
    ['posts', '📝 Posts publicados'],
  ];
  return (
    <div className="inline-flex rounded-xl border border-gray-700/60 bg-gray-800/60 p-0.5">
      {opts.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === v ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
          }`}
          aria-pressed={value === v}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Setinha de variação vs. o período anterior (↑ verde cresceu · ↓ vermelho caiu). */
function DeltaBadge({ pct }: { pct: number }) {
  const flat = Math.abs(pct) < 0.05;
  const up = pct > 0;
  const tone = flat ? 'text-gray-400' : up ? 'text-emerald-400' : 'text-red-400';
  const arrow = flat ? '→' : up ? '↑' : '↓';
  const abs = Math.abs(pct);
  const txt =
    abs >= 100
      ? Math.round(abs).toLocaleString('pt-BR')
      : abs.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${tone}`}
      title="variação vs. o período anterior"
    >
      <span aria-hidden="true">{arrow}</span>
      {txt}%
    </span>
  );
}

/** Card de KPI compacto do relatório (rótulo + número + variação vs. período anterior + dica). */
function KpiMini({
  icon,
  label,
  value,
  hint,
  delta,
  current,
  goal,
  goalLabel = 'Meta da semana',
  onClick,
}: {
  icon?: string;
  label: string;
  value: string;
  hint?: string;
  /** % de variação vs. o período anterior; null/undefined = sem comparação. */
  delta?: number | null;
  /** Valor REAL do indicador (número cru) — usado p/ calcular o progresso da meta. */
  current?: number;
  /** Meta (piso/alta) a bater no período. Sem meta (null) → o bloco de meta some. */
  goal?: MetaEscalada | null;
  /** Rótulo da meta. Default: "Meta da semana" (muda p/ "Meta em 30d" etc.). */
  goalLabel?: string;
  /** Se presente, o card vira clicável (cursor + hover + teclado). */
  onClick?: () => void;
}) {
  const hasGoal =
    goal != null && current != null && (goal.min != null || goal.media != null || goal.alta != null);
  return (
    <div
      className={`rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 shadow-sm ${
        onClick ? 'cursor-pointer transition-colors hover:border-gray-600 hover:bg-gray-800' : ''
      }`}
      {...(onClick
        ? {
            role: 'button' as const,
            tabIndex: 0,
            onClick,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            },
          }
        : {})}
    >
      {icon && (
        <span className="text-lg" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className={`text-xs font-medium uppercase tracking-wide text-gray-400 ${icon ? 'mt-3' : ''}`}>
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl text-gray-100" style={DISPLAY}>
          {value}
        </span>
        {delta != null && <DeltaBadge pct={delta} />}
      </div>
      {hint && <div className="mt-0.5 text-xs text-gray-500">{hint}</div>}
      {hasGoal && <GoalBar current={current} goal={goal} label={goalLabel} />}
    </div>
  );
}

/**
 * Barra de meta com 1 a 3 níveis (mínima → média → alta). O "teto" da barra é o
 * maior nível; os intermediários viram tiques. O texto abaixo aponta a PRÓXIMA
 * meta a bater e quanto falta. Com nível único, usa o rótulo passado (`label`).
 */
function GoalBar({ current, goal, label }: { current: number; goal: MetaEscalada; label: string }) {
  const niveis: Array<{ v: number; nome: string }> = [];
  if (goal.min != null) niveis.push({ v: goal.min, nome: 'mínima' });
  if (goal.media != null) niveis.push({ v: goal.media, nome: 'média' });
  if (goal.alta != null) niveis.push({ v: goal.alta, nome: 'alta' });
  if (niveis.length === 0) return null;
  niveis.sort((a, b) => a.v - b.v);
  const multi = niveis.length > 1;

  const piso = niveis[0].v;
  const teto = niveis[niveis.length - 1].v;
  const pctFill = teto > 0 ? Math.min(100, Math.max(0, (current / teto) * 100)) : 0;
  // Cor: verde ao cruzar o piso (ou sem piso definido); azul enquanto persegue.
  const fillTone = current >= teto ? 'bg-emerald-500' : current >= piso ? 'bg-emerald-400' : 'bg-blue-500';

  // Próximo nível ainda não batido (undefined = bateu todos).
  const prox = niveis.find((n) => current < n.v);
  const restante = prox ? Math.max(0, Math.round(prox.v - current)) : 0;

  // Resumo compacto: "150k · 250k · 400k" (multi) ou "Meta da semana: 500" (único).
  const resumo = multi
    ? niveis.map((n) => fmtMetaShort(n.v)).join(' · ')
    : `${label}: ${fmtMetaShort(teto)}`;

  return (
    <div className="mt-3">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-700/60">
        <div className={`h-full rounded-full transition-all ${fillTone}`} style={{ width: `${pctFill}%` }} />
        {multi &&
          niveis.slice(0, -1).map((n, i) => (
            <span
              key={i}
              className="absolute top-0 h-full w-px bg-gray-900/70"
              style={{ left: `${(n.v / teto) * 100}%` }}
              aria-hidden="true"
            />
          ))}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[11px]">
        <span className="text-gray-500">{resumo}</span>
        {prox ? (
          <span className="text-amber-300">
            faltam <span className="font-semibold">{fmtMetaShort(restante)}</span>
            {multi ? ` p/ ${prox.nome}` : ''}
          </span>
        ) : (
          <span className="font-semibold text-emerald-300">{multi ? 'meta alta batida ✓' : 'meta batida ✓'}</span>
        )}
      </div>
    </div>
  );
}


/** Modal que lista os posts publicados no período (o card "Posts no período" clicado). */
function PostsPeriodoModal({
  posts,
  cronograma,
  periodoLabel,
  onClose,
}: {
  posts: Row[];
  cronograma: Row[];
  periodoLabel: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Casa desempenho ↔ cronograma por dia+formato, SÓ quando é inequívoco (1↔1):
  // o sync não preenche post_id, então nunca arriscamos mostrar título errado.
  const chaveDF = (data: string, fmt: string) => `${(data || '').slice(0, 10)}|${(fmt || '').toLowerCase()}`;
  const nDesempPorChave = new Map<string, number>();
  posts.forEach((d) => {
    const k = chaveDF(toText(d.data), toText(d.formato));
    nDesempPorChave.set(k, (nDesempPorChave.get(k) ?? 0) + 1);
  });
  const cronoPorChave = new Map<string, Row[]>();
  cronograma.forEach((p) => {
    const k = chaveDF(toText(p.data_programada), toText(p.formato));
    const arr = cronoPorChave.get(k);
    if (arr) arr.push(p);
    else cronoPorChave.set(k, [p]);
  });
  const tituloCrono = (d: Row): string | null => {
    const k = chaveDF(toText(d.data), toText(d.formato));
    const cronos = cronoPorChave.get(k) ?? [];
    if (cronos.length === 1 && (nDesempPorChave.get(k) ?? 0) === 1) return toText(cronos[0].titulo) || null;
    return null;
  };

  const FMT: Record<string, string> = { reel: 'Reel', reels: 'Reel', carrossel: 'Carrossel', post: 'Post', story: 'Story' };
  const dataDe = (r: Row): string => {
    const s = toText(r.data);
    if (!s) return 'sem data';
    const d = dataDoBanco(s);
    return Number.isFinite(d.getTime())
      ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      : 'sem data';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Posts do período"
    >
      <div className="my-8 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-gray-200">
            📝 {posts.length} post{posts.length === 1 ? '' : 's'} · {periodoLabel}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg border border-gray-700 text-gray-300 transition-colors hover:bg-gray-700/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-gray-700/60 bg-gray-900 p-8 text-center text-sm text-gray-400">
            Nenhum post publicado neste período.
          </div>
        ) : (
          <ul className="space-y-2">
            {posts.map((p, i) => {
              const permalink = toText(p.permalink);
              const fmt = toText(p.formato).toLowerCase();
              const titulo = tituloCrono(p);
              return (
                <li key={toText(p.id) || i} className="rounded-2xl border border-gray-700/60 bg-gray-800/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="rounded-full border border-gray-600/70 px-1.5 py-0.5 text-gray-300">
                        {FMT[fmt] ?? (fmt || 'post')}
                      </span>
                      {dataDe(p)}
                      {titulo && (
                        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300/90">
                          do cronograma
                        </span>
                      )}
                    </span>
                    {permalink && (
                      <a
                        href={permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-medium text-blue-400 hover:text-blue-300"
                      >
                        ver post ↗
                      </a>
                    )}
                  </div>
                  <p className="mt-1 truncate text-[13px] text-gray-100">{titulo || toText(p.tema) || 'Sem descrição'}</p>
                  {titulo && <p className="mt-0.5 truncate text-[11px] text-gray-500">{toText(p.tema)}</p>}
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500" style={DISPLAY}>
                    <span>🎯 {fmtInt(numOf(p.alcance) ?? 0)}</span>
                    <span>💬 {fmtInt(numOf(p.comentarios) ?? 0)}</span>
                    <span>🔖 {fmtInt(numOf(p.salvamentos) ?? 0)}</span>
                    <span>📈 {fmtInt(numOf(p.seguidores) ?? 0)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
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
  const generateLabel = config.generateLabel ?? 'Gerar com IA';
  const scheduleLabel = config.updateScheduleLabel ?? 'Atualizar cronograma';
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
  // Post aberto no modal de pré-visualização (null = fechado).
  const [preview, setPreview] = useState<Row | null>(null);
  // Gerador de IA: modal aberto? + mensagem de sucesso transiente.
  const [gerarOpen, setGerarOpen] = useState(false);
  const [gerarMsg, setGerarMsg] = useState<string | null>(null);
  // Modal "Posts no período": lista os posts publicados que compõem o card.
  const [verPostsPeriodo, setVerPostsPeriodo] = useState(false);

  // Seguidores AO VIVO do Instagram — sobrepõe o seed quando o token está
  // configurado no servidor. Silencioso: sem token/erro, o card cai pro estado
  // "Conecte o Instagram" do seed (nunca quebra a tela).
  const [igFollowers, setIgFollowers] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/instagram/profile', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j && j.connected && typeof j.followersCount === 'number') {
          setIgFollowers(j.followersCount);
        }
      })
      .catch(() => {
        /* silencioso */
      });
    return () => {
      alive = false;
    };
  }, []);

  // Relatório da rede: métricas reais dos posts sincronizados (v_conteudo_desempenho),
  // agregadas pelo período escolhido — mesma fonte da tela de Desempenho.
  const [periodDays, setPeriodDays] = useState<number | null>(PERIODO_PADRAO);
  // Fonte do relatório: 'conta' = atividade da conta no período (igual ao app do
  // Instagram); 'posts' = soma dos posts publicados no período. Default 'conta'.
  const [fonte, setFonte] = useState<'conta' | 'posts'>('conta');
  const [contaData, setContaData] = useState<AccountInsightsResp | null>(null);
  const [contaLoading, setContaLoading] = useState(false);

  // Troca de fonte: ao ir p/ "Conta", normaliza o período (a API só vai até 30d).
  const trocarFonte = useCallback(
    (f: 'conta' | 'posts') => {
      setFonte(f);
      if (f === 'conta' && periodDays !== 7 && periodDays !== 30) setPeriodDays(30);
    },
    [periodDays],
  );

  // Busca as métricas de CONTA quando a visão "Conta" está ativa (7 ou 30 dias).
  useEffect(() => {
    if (fonte !== 'conta') return;
    const dias = periodDays === 7 ? 7 : 30;
    let alive = true;
    setContaLoading(true);
    fetch(`/api/instagram/account-insights?dias=${dias}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: AccountInsightsResp | null) => {
        if (alive) setContaData(j);
      })
      .catch(() => {
        if (alive) setContaData(null);
      })
      .finally(() => {
        if (alive) setContaLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [fonte, periodDays]);

  // Rótulo da janela usada pela visão "Conta" (ex.: "10 a 16 de ago"). O `ate`
  // que a API devolve é a meia-noite de HOJE, ou seja, o último dia contado é o
  // anterior — por isso o -1 dia antes de formatar.
  const janelaConta = useMemo(() => {
    if (!contaData?.desde || !contaData.ate) return null;
    const ini = new Date(contaData.desde);
    const fim = new Date(new Date(contaData.ate).getTime() - 24 * 3600 * 1000);
    if (Number.isNaN(ini.getTime()) || Number.isNaN(fim.getTime())) return null;
    const dia = (d: Date) => String(d.getUTCDate());
    const mes = (d: Date) =>
      ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][
        d.getUTCMonth()
      ];
    return mes(ini) === mes(fim)
      ? `${dia(ini)} a ${dia(fim)} de ${mes(fim)}`
      : `${dia(ini)} de ${mes(ini)} a ${dia(fim)} de ${mes(fim)}`;
  }, [contaData]);

  const [desempRows, setDesempRows] = useState<Row[]>([]);
  useEffect(() => {
    let alive = true;
    apiJson('/api/query', 'POST', {
      view: 'v_conteudo_desempenho',
      select: [
        'id',
        'data',
        'formato',
        'tema',
        'alcance',
        'visualizacoes',
        'curtidas',
        'comentarios',
        'compartilhamentos',
        'salvamentos',
        'seguidores',
        'permalink',
      ],
      orderBy: [{ field: 'data', dir: 'desc' }],
      limit: 300,
    })
      .then((res) => {
        const rows = asRows((res as { data?: unknown } | null)?.data);
        if (alive) setDesempRows(rows);
      })
      .catch(() => {
        /* silencioso — o relatório mostra estado vazio */
      });
    return () => {
      alive = false;
    };
  }, []);

  const report = useMemo(() => {
    const interDe = (r: Row) =>
      (numOf(r.curtidas) ?? 0) +
      (numOf(r.comentarios) ?? 0) +
      (numOf(r.compartilhamentos) ?? 0) +
      (numOf(r.salvamentos) ?? 0);
    const agg = (rows: Row[]) => ({
      count: rows.length,
      views: rows.reduce((a, r) => a + (numOf(r.visualizacoes) ?? 0), 0),
      reach: rows.reduce((a, r) => a + (numOf(r.alcance) ?? 0), 0),
      interacoes: rows.reduce((a, r) => a + interDe(r), 0),
      novosSeg: rows.reduce((a, r) => a + (numOf(r.seguidores) ?? 0), 0),
    });
    const tsOf = (r: Row) => {
      const s = toText(r.data);
      if (!s) return null;
      const t = dataDoBanco(s).getTime();
      return Number.isFinite(t) ? t : null;
    };

    // "Tudo" → não há janela anterior equivalente p/ comparar.
    if (periodDays == null) {
      return {
        ...agg(desempRows),
        posts: desempRows,
        delta: { views: null, reach: null, interacoes: null, novosSeg: null, count: null },
      };
    }

    // Janela atual [curStart, curEnd) vs. anterior [prevStart, curStart).
    // Na visão "Conta" o corte é o MESMO que a API usou (dias fechados até a
    // meia-noite de hoje, no fuso da conta) — senão o card de posts fala de uma
    // semana e os outros quatro falam de outra (o rolling local inclui hoje e
    // perde o dia mais antigo).
    const jc =
      fonte === 'conta' && contaData?.desde && contaData.ate
        ? { ini: new Date(contaData.desde).getTime(), fim: new Date(contaData.ate).getTime() }
        : null;
    const curStart = jc ? jc.ini : cortePeriodo(periodDays).getTime();
    const curEnd = jc ? jc.fim : Number.POSITIVE_INFINITY;
    const prevStart = jc
      ? jc.ini - periodDays * 24 * 3600 * 1000
      : cortePeriodo(periodDays * 2).getTime();
    const curRows: Row[] = [];
    const prevRows: Row[] = [];
    for (const r of desempRows) {
      const t = tsOf(r);
      if (t == null) continue;
      if (t >= curStart && t < curEnd) curRows.push(r);
      else if (t >= prevStart && t < curStart) prevRows.push(r);
    }
    const cur = agg(curRows);
    const prev = agg(prevRows);
    // Sem base (período anterior = 0) → null (não mostra setinha).
    const pct = (c: number, p: number) => (p === 0 ? null : ((c - p) / p) * 100);
    return {
      ...cur,
      posts: curRows,
      delta: {
        views: pct(cur.views, prev.views),
        reach: pct(cur.reach, prev.reach),
        interacoes: pct(cur.interacoes, prev.interacoes),
        novosSeg: pct(cur.novosSeg, prev.novosSeg),
        count: pct(cur.count, prev.count),
      },
    };
  }, [desempRows, periodDays, fonte, contaData]);

  // Metas SEMANAIS (config) escaladas ao período do relatório. "Tudo" (período
  // aberto) não tem janela definida → sem meta. 7d = "Meta da semana"; demais
  // períodos escalam a meta e ajustam o rótulo ("Meta em 30d").
  const metas = config.metasSemana;
  const metaMult = periodDays == null ? null : periodDays / 7;
  const metaLabel = periodDays === 7 ? 'Meta da semana' : periodDays != null ? `Meta em ${periodDays}d` : 'Meta';
  const metaDe = (alvo?: MetaAlvo): MetaEscalada | null => escalaMeta(alvo, metaMult);

  // Valores dos KPIs conforme a FONTE. "Conta" usa as métricas de nível de conta
  // (deduplicadas, incluem posts antigos/reels/stories); "Posts" soma os posts
  // publicados no período. `count` (posts publicados) é o mesmo nas duas visões.
  const kpi =
    fonte === 'conta'
      ? {
          novosSeg: contaData?.followers ?? null,
          views: contaData?.views ?? null,
          reach: contaData?.reach ?? null,
          interacoes: contaData?.interactions ?? null,
          count: report.count,
        }
      : {
          novosSeg: report.novosSeg,
          views: report.views,
          reach: report.reach,
          interacoes: report.interacoes,
          count: report.count,
        };
  // Na visão "Conta" não há delta (não buscamos a janela anterior); na de "Posts"
  // usamos o comparativo já calculado no `report`.
  const kpiDelta =
    fonte === 'conta'
      ? { views: null, reach: null, interacoes: null, novosSeg: null, count: null }
      : report.delta;
  // Texto/valor de um KPI de conta: "…" enquanto carrega, "—" se veio vazio.
  const kpiValue = (v: number | null, fmt: (n: number) => string) =>
    fonte === 'conta' && contaLoading && v == null ? '…' : v == null ? '—' : fmt(v);
  // Hint do card "Novos seguidores": na visão Conta é o LÍQUIDO, com o detalhe
  // ganhos/perdidos quando disponível; na de Posts, vindo dos posts.
  const segHint =
    fonte === 'conta'
      ? contaData?.followersGained != null
        ? `líquido: +${fmtInt(contaData.followersGained)} −${fmtInt(contaData.followersLost ?? 0)}`
        : 'líquido no período (ganhos − perdidos)'
      : 'vindos dos posts do período';

  const reload = ctx.actions.reload;
  const onGerado = useCallback(
    (r: GerarResult) => {
      setGerarOpen(false);
      const nome = r.titulo ? `“${r.titulo}”` : 'o novo rascunho';
      setGerarMsg(`Pronto! ${nome} entrou no board como Rascunho.`);
      reload?.();
      window.setTimeout(() => setGerarMsg(null), 8000);
    },
    [reload],
  );

  const effectiveMonth = calMonth ?? defaultMonth;

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

  // Abre o gerador de IA (cria um rascunho a partir de tema/link).
  const gerarBtn = (
    <button
      type="button"
      onClick={() => setGerarOpen(true)}
      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
    >
      <span aria-hidden="true">✨</span> {generateLabel}
    </button>
  );

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      {gerarBtn}
      {scheduleBtn}
    </div>
  );

  if (loading) {
    return (
      <div>
        <SectionHeader title={title ?? 'Conteúdo'} subtitle={subtitle} icon="🗓️">
          {headerActions}
        </SectionHeader>
        <SkeletonCards count={3} columns={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <SectionHeader title={title ?? 'Conteúdo'} subtitle={subtitle} icon="🗓️">
          {headerActions}
        </SectionHeader>
        <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />
      </div>
    );
  }

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
        {headerActions}
      </SectionHeader>

      {gerarMsg && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200"
        >
          <span aria-hidden="true">✅</span>
          {gerarMsg}
        </div>
      )}

      {/* ===== Relatório da rede (fonte + período) ===== */}
      <SectionLabel
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <SourceToggle value={fonte} onChange={trocarFonte} />
            <PeriodPicker
              value={periodDays}
              onChange={setPeriodDays}
              options={fonte === 'conta' ? PERIODOS_CONTA : PERIODOS}
            />
          </div>
        }
      >
        Relatório da rede
      </SectionLabel>

      <p className="-mt-1 mb-3 text-xs leading-relaxed text-gray-500">
        {fonte === 'conta'
          ? `Atividade da conta no período — inclui posts antigos, reels e stories, e o alcance é de contas únicas (igual ao app do Instagram).${janelaConta ? ` Janela: ${janelaConta} (o dia de hoje ainda não entra, como no app).` : ''}`
          : 'Soma dos posts publicados no período — bom para avaliar o desempenho do conteúdo novo (cada post conta separado).'}
      </p>

      {fonte === 'conta' && contaData && contaData.connected === false && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
          Não consegui ler as métricas da conta{contaData.error ? `: ${contaData.error}` : ''}. Mostrando o
          que der; troque para “Posts publicados” para a visão por post.
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FollowersHero current={igFollowers ?? metrics?.followers?.current} series={null} week={null} />
        <KpiMini
          icon="📈"
          label="Novos seguidores"
          value={kpiValue(kpi.novosSeg, fmtCompact)}
          current={kpi.novosSeg ?? undefined}
          goal={metaDe(metas?.novosSeguidores)}
          goalLabel={metaLabel}
          hint={segHint}
          delta={kpiDelta.novosSeg}
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiMini
          icon="👁️"
          label="Visualizações"
          value={kpiValue(kpi.views, fmtCompact)}
          current={kpi.views ?? undefined}
          goal={metaDe(metas?.visualizacoes)}
          goalLabel={metaLabel}
          hint={fonte === 'conta' ? 'todo o conteúdo' : undefined}
          delta={kpiDelta.views}
        />
        <KpiMini
          icon="🎯"
          label={fonte === 'conta' ? 'Contas alcançadas' : 'Alcance'}
          value={kpiValue(kpi.reach, fmtCompact)}
          current={kpi.reach ?? undefined}
          goal={metaDe(metas?.alcance)}
          goalLabel={metaLabel}
          hint={fonte === 'conta' ? 'contas únicas' : undefined}
          delta={kpiDelta.reach}
        />
        <KpiMini
          icon="❤️"
          label="Interações"
          value={kpiValue(kpi.interacoes, fmtCompact)}
          current={kpi.interacoes ?? undefined}
          goal={metaDe(metas?.interacoes)}
          goalLabel={metaLabel}
          delta={kpiDelta.interacoes}
        />
        <KpiMini
          icon="📝"
          label="Posts no período"
          value={fmtInt(kpi.count)}
          current={kpi.count}
          goal={metaDe(metas?.posts)}
          goalLabel={metaLabel}
          hint={report.posts.length > 0 ? 'toque para ver a lista' : 'posts publicados'}
          delta={kpiDelta.count}
          onClick={report.posts.length > 0 ? () => setVerPostsPeriodo(true) : undefined}
        />
      </div>

      {verPostsPeriodo && (
        <PostsPeriodoModal
          posts={report.posts}
          cronograma={posts}
          periodoLabel={periodDays == null ? 'todo o período' : `últimos ${periodDays} dias`}
          onClose={() => setVerPostsPeriodo(false)}
        />
      )}

      {report.count === 0 ? (
        <EmptyState
          icon="📡"
          message='Sem dados sincronizados neste período. Use "Sincronizar" na aba Desempenho para puxar os posts do Instagram.'
        />
      ) : (
        // Os campeões por categoria (comentários, curtidas, compartilhamento,
        // seguidores) MUDARAM para o menu Relatório em 10/08/2026: é lá que a
        // reunião semanal acontece, e ter os mesmos cards em dois lugares só
        // criava duas versões da mesma leitura. O painel fica com o pulso do
        // período (metas) e com o planejamento.
        <div className="rounded-2xl border border-gray-700/60 bg-gray-900/60 px-4 py-3 text-[13px] text-gray-400">
          Os melhores posts por categoria estão em <span className="font-semibold text-gray-200">Relatório</span>, junto
          da pauta da reunião semanal.
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
            onOpen={setPreview}
          />
        </div>
      ) : (
        <ContentList posts={posts} fields={fields} statusMap={statusMap} onOpen={setPreview} />
      )}

      {preview && (
        <PostPreview
          post={preview}
          fields={fields}
          statusMap={statusMap}
          onClose={() => setPreview(null)}
        />
      )}

      {gerarOpen && <GerarModal onClose={() => setGerarOpen(false)} onCreated={onGerado} />}
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
    <SchedulePage posts={posts} fields={fields} focusDay={new Date()} onBack={goPainel} />
  );
}

/** Definição registrável do bloco custom "Cronograma" (rota /conteudo/cronograma). */
export const conteudoCronograma: BlockDefinition = {
  type: 'custom:conteudo-cronograma',
  component: ConteudoCronogramaBlock,
  defaultDataShape: 'collection',
};
