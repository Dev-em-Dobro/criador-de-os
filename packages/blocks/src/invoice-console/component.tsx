/**
 * @os/blocks — componente do `invoice-console`, carregado sob demanda.
 *
 * Sobe PDF(s) → a IA (backend @os/server, chave BYOK) extrai/categoriza → mostra
 * custos SOMADOS por categoria + cortes (marque assinaturas → total após cortes +
 * economia anual, em localStorage). Renderiza com o design system (herda o skin).
 *
 * Visual (2026-07-14, @ux Uma): linguagem de dashboard "com vida" — card herói
 * preenchido, KPIs com chip de ícone + anel de progresso, barras arredondadas,
 * Fraunces nos números. Tudo token-driven (classes gray/blue/emerald/amber que o
 * skin remapeia pro acento teal/petróleo), então serve creme E dusk sem hardcode.
 */

import { useEffect, useMemo, useState } from 'react';
import { SectionHeader } from '@os/core';
import type { BlockProps } from '@os/core';

interface Item {
  id: number;
  description: string;
  establishment: string | null;
  category: string;
  amount: number;
  purchaseDate: string | null;
  recurring: boolean;
}
interface Invoice {
  id: string;
  filename: string;
  reference: string | null;
  total: number;
  itemCount: number;
  items: Item[];
}
interface Data {
  invoices: Invoice[];
  totals: { grand: number; recurring: number; byCategory: Record<string, number> };
}

const CAT_ORDER = [
  'Marketing / CRM',
  'IA',
  'Infra / Dev',
  'Produtividade',
  'Tráfego pago',
  'Educação',
  'Financiamento',
  'Viagem',
  'Fiscal',
  'Telefonia',
  'Impostos (IOF)',
  'Outros',
];
const CAT_META: Record<string, { emoji: string; accent: string }> = {
  'Marketing / CRM': { emoji: '📣', accent: 'text-purple-300' },
  IA: { emoji: '🤖', accent: 'text-emerald-400' },
  'Infra / Dev': { emoji: '☁️', accent: 'text-blue-300' },
  Produtividade: { emoji: '🧩', accent: 'text-amber-400' },
  'Tráfego pago': { emoji: '🎯', accent: 'text-red-400' },
  Educação: { emoji: '🎓', accent: 'text-yellow-300' },
  Financiamento: { emoji: '💳', accent: 'text-orange-400' },
  Viagem: { emoji: '✈️', accent: 'text-blue-400' },
  Fiscal: { emoji: '🧾', accent: 'text-emerald-300' },
  Telefonia: { emoji: '☎️', accent: 'text-purple-400' },
  'Impostos (IOF)': { emoji: '🏛️', accent: 'text-red-300' },
  Outros: { emoji: '📦', accent: 'text-gray-400' },
};
const catMeta = (cat: string) => CAT_META[cat] ?? { emoji: '•', accent: 'text-gray-400' };

const STORAGE_KEY = 'os-invoice-cuts';
const fmtBRL = (n: number): string => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Fonte de display (Fraunces via token do skin) para os números grandes.
const DISPLAY = { fontFamily: 'var(--font-display, inherit)' } as const;

// Meses (seletor de ciclo). Agrupa faturas pela referência que a IA extraiu.
const MESES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
/** Chave ordenável (ano*100+mês) a partir da referência; null se não reconhecer. */
function monthKey(ref: string): number | null {
  const l = ref.toLowerCase();
  let m = l.match(/(\d{1,2})[/\-.](\d{4})/); // MM/AAAA
  if (m) return Number(m[2]) * 100 + Number(m[1]);
  m = l.match(/(\d{4})[/\-.](\d{1,2})/); // AAAA-MM
  if (m) return Number(m[1]) * 100 + Number(m[2]);
  for (let i = 0; i < 12; i++) {
    if (l.includes(MESES_PT[i].slice(0, 3))) {
      const ym = l.match(/(\d{4})/);
      return (ym ? Number(ym[1]) : 0) * 100 + (i + 1);
    }
  }
  return null;
}
/** Rótulo do ciclo de uma fatura: a referência extraída, ou o nome do arquivo. */
const invMonth = (inv: { reference: string | null; filename: string }): string => inv.reference?.trim() || inv.filename;

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
/**
 * Agrupa uma fatura por MÊS canônico: o mesmo mês com textos diferentes
 * ("Julho/2026" e "Julho/2026 (vencimento 10/07/2026)") cai no mesmo grupo.
 * Quando o mês não é reconhecível, agrupa pela referência crua (fallback).
 */
function monthGroupOf(inv: { reference: string | null; filename: string }): { key: string; label: string; sort: number } {
  const raw = invMonth(inv);
  const mk = monthKey(raw);
  if (mk !== null) {
    const ano = Math.floor(mk / 100);
    const mes = mk % 100;
    if (mes >= 1 && mes <= 12) {
      const nome = cap(MESES_PT[mes - 1]);
      return { key: `m${mk}`, label: ano > 0 ? `${nome}/${ano}` : nome, sort: mk };
    }
  }
  return { key: `r:${raw}`, label: raw, sort: -1 };
}

function loadCortes(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as number[]);
  } catch {
    /* vazio */
  }
  return new Set();
}

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result);
      resolve(s.slice(s.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

/** Anel de progresso (0..1). Cor pelo token do acento (teal/amber/verde do skin). */
function Ring({ pct, tone = 'brand' }: { pct: number; tone?: 'brand' | 'amber' | 'green' }) {
  const C = 138.2; // 2π·22
  const p = Math.max(0, Math.min(1, Number.isFinite(pct) ? pct : 0));
  const stroke =
    tone === 'amber' ? 'var(--color-amber-400)' : tone === 'green' ? 'var(--color-emerald-400)' : 'var(--color-blue-500)';
  return (
    <div className="relative" style={{ width: 52, height: 52 }}>
      <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden>
        <circle cx="26" cy="26" r="22" fill="none" stroke={stroke} strokeOpacity="0.15" strokeWidth="6" />
        <circle
          cx="26"
          cy="26"
          r="22"
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - p)}
          transform="rotate(-90 26 26)"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xs font-bold" style={{ color: stroke }}>
        {Math.round(p * 100)}%
      </span>
    </div>
  );
}

export default function InvoiceConsole({ title, subtitle }: BlockProps) {
  const [data, setData] = useState<Data | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cortes, setCortes] = useState<Set<number>>(() => loadCortes());
  const [abertas, setAbertas] = useState<Set<string>>(() => new Set());
  const [catAberta, setCatAberta] = useState<Set<string>>(() => new Set());
  const [mesSel, setMesSel] = useState<string>(''); // '' = auto (mês mais recente); 'ALL' = todas

  async function load(): Promise<void> {
    try {
      const res = await fetch('/api/invoices');
      const d = (await res.json()) as Data & { error?: string };
      if (!res.ok) throw new Error(d.error || 'Falha ao carregar as faturas.');
      setData(d);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function onFiles(files: FileList): Promise<void> {
    setBusy(true);
    setErro(null);
    const list = Array.from(files);
    try {
      for (let i = 0; i < list.length; i++) {
        const f = list[i];
        setStatus(`Lendo "${f.name}" com IA… (${i + 1}/${list.length})`);
        const pdfBase64 = await readBase64(f);
        const res = await fetch('/api/invoices/upload', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ filename: f.name, pdfBase64 }),
        });
        const d = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(d.error || `Falha ao processar "${f.name}".`);
      }
      await load();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  async function remover(id: string): Promise<void> {
    setBusy(true);
    try {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function toggleCorte(id: number): void {
    setCortes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* sem persistência */
      }
      return next;
    });
  }
  function toggleFatura(id: string): void {
    setAbertas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleCat(cat: string): void {
    setCatAberta((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  // Grupos de mês (canônicos, mais recente primeiro) para o seletor de ciclo.
  const meses = useMemo(() => {
    const map = new Map<string, { key: string; label: string; sort: number }>();
    for (const inv of data?.invoices ?? []) {
      const g = monthGroupOf(inv);
      if (!map.has(g.key)) map.set(g.key, g);
    }
    return [...map.values()].sort((a, b) => b.sort - a.sort);
  }, [data]);

  // Mês ativo (por chave): o escolhido; senão o mais recente (cai nele se sumir).
  const mesKeys = meses.map((m) => m.key);
  const mesAtivo = mesSel !== 'ALL' && !mesKeys.includes(mesSel) ? (mesKeys[0] ?? 'ALL') : mesSel;

  // Faturas do ciclo selecionado (ou todas quando 'ALL').
  const visibleInvoices = useMemo(() => {
    const all = data?.invoices ?? [];
    return mesAtivo === 'ALL' ? all : all.filter((inv) => monthGroupOf(inv).key === mesAtivo);
  }, [data, mesAtivo]);

  // Totais RECALCULADOS a partir das faturas visíveis: com 1 mês, os recorrentes
  // não são contados N vezes e a economia anual (×12) volta a fazer sentido.
  const totals = useMemo(() => {
    const byCategory: Record<string, number> = {};
    let grand = 0;
    let recurring = 0;
    for (const inv of visibleInvoices)
      for (const it of inv.items) {
        byCategory[it.category] = (byCategory[it.category] ?? 0) + it.amount;
        grand += it.amount;
        if (it.recurring) recurring += it.amount;
      }
    return { grand, recurring, byCategory };
  }, [visibleInvoices]);

  const resumo = useMemo(() => {
    const allItems = visibleInvoices.flatMap((inv) => inv.items);
    const cortados = allItems.filter((i) => cortes.has(i.id));
    const totalCortes = cortados.reduce((s, i) => s + i.amount, 0);
    const economiaAno = cortados.filter((i) => i.recurring).reduce((s, i) => s + i.amount, 0) * 12;
    return { grand: totals.grand, recorrente: totals.recurring, totalCortes, aposCortes: totals.grand - totalCortes, economiaAno };
  }, [visibleInvoices, totals, cortes]);

  const categorias = useMemo(() => {
    const by = totals.byCategory;
    // Ordena pelas categorias que MAIS gastam (maior total no topo). CAT_ORDER
    // deixa de ser a ordem primária e vira só o desempate quando dois totais empatam.
    const keys = Object.keys(by).sort((a, b) => {
      const diff = (by[b] ?? 0) - (by[a] ?? 0);
      if (diff !== 0) return diff;
      const ia = CAT_ORDER.indexOf(a);
      const ib = CAT_ORDER.indexOf(b);
      return (ia === -1 ? CAT_ORDER.length : ia) - (ib === -1 ? CAT_ORDER.length : ib);
    });
    const max = Math.max(1, ...keys.map((k) => by[k] ?? 0));
    return keys.map((cat) => ({ cat, total: by[cat] ?? 0, pct: Math.round(((by[cat] ?? 0) / max) * 100) }));
  }, [totals]);

  // Itens de cada categoria somando as faturas VISÍVEIS (para a lista expansível).
  const itemsByCat = useMemo(() => {
    const map: Record<string, Item[]> = {};
    for (const inv of visibleInvoices) {
      for (const it of inv.items) (map[it.category] ??= []).push(it);
    }
    for (const cat of Object.keys(map)) map[cat].sort((a, b) => b.amount - a.amount);
    return map;
  }, [visibleInvoices]);

  const temFaturas = (data?.invoices.length ?? 0) > 0;
  const rotuloMes = mesAtivo === 'ALL' ? 'todas as faturas' : (meses.find((m) => m.key === mesAtivo)?.label ?? 'este mês');

  // Percentuais para os anéis dos KPIs (guardam divisão por zero).
  const base = resumo.grand || 1;
  const pctRecorrente = resumo.recorrente / base;
  const pctCortes = resumo.totalCortes / base;
  const pctApos = resumo.aposCortes / base;

  return (
    <div>
      <SectionHeader title={title ?? 'Fatura do cartão'} subtitle={subtitle} icon="💳" />

      {erro && (
        <div role="alert" className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </div>
      )}

      {/* Upload */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 shadow-sm">
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-opacity hover:opacity-90 focus-within:ring-2 focus-within:ring-white/80 ${
            busy ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <span aria-hidden>＋</span>
          {busy ? 'Processando…' : 'Subir PDF(s) da fatura'}
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files && e.target.files.length) void onFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
        <p className="flex-1 text-xs text-gray-500">
          {status ?? 'Pode subir várias faturas. A IA lê o PDF, categoriza os lançamentos e soma tudo (usa a sua chave em Configurações).'}
        </p>
      </div>

      {!temFaturas ? (
        !busy && (
          <div className="rounded-2xl border border-gray-700/50 bg-gray-800/40 p-12 text-center">
            <div className="mb-2 text-4xl">🧾</div>
            <p className="text-sm font-medium text-gray-300">Nenhuma fatura ainda.</p>
            <p className="mt-1 text-xs text-gray-500">Suba o PDF da fatura do cartão para começar.</p>
          </div>
        )
      ) : (
        <>
          {/* Seletor de mês (ciclo) — segmentado; some quando há uma fatura só */}
          {meses.length > 1 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium uppercase tracking-wide text-gray-500">Mês</span>
              <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-gray-700/50 bg-gray-800/60 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setMesSel('ALL')}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    mesAtivo === 'ALL' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Todos
                </button>
                {meses.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMesSel(m.key)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      mesAtivo === m.key ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resumo (recalcula com cortes): card herói + 3 KPIs com anel */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* HERÓI — total da fatura (preenchido no acento da marca) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 p-6 text-white shadow-xl shadow-blue-500/25">
              <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
              <div className="relative text-[11px] font-semibold uppercase tracking-wider text-white/70">Total · {rotuloMes}</div>
              <div className="relative mt-2 text-3xl leading-none tracking-tight" style={DISPLAY}>
                {fmtBRL(resumo.grand)}
              </div>
              <div className="relative mt-3 text-xs text-white/75">Recorrente: {fmtBRL(resumo.recorrente)}/mês</div>
            </div>

            {/* Recorrentes */}
            <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/10 text-lg text-blue-400" aria-hidden>♻</span>
                <Ring pct={pctRecorrente} tone="brand" />
              </div>
              <div className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400">Recorrentes</div>
              <div className="mt-1 text-2xl text-gray-100" style={DISPLAY}>{fmtBRL(resumo.recorrente)}</div>
            </div>

            {/* Marcado pra cortar */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/10 text-lg text-amber-400" aria-hidden>✂</span>
                <Ring pct={pctCortes} tone="amber" />
              </div>
              <div className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400">Marcado pra cortar</div>
              <div className="mt-1 text-2xl text-amber-400" style={DISPLAY}>{fmtBRL(resumo.totalCortes)}</div>
              {resumo.economiaAno > 0 && (
                <div className="mt-1 text-[11px] text-gray-500">
                  ≈ <span className="font-semibold text-green-400">{fmtBRL(resumo.economiaAno)}</span>/ano
                </div>
              )}
            </div>

            {/* Total após cortes */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-lg text-emerald-400" aria-hidden>✓</span>
                <Ring pct={pctApos} tone="green" />
              </div>
              <div className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400">Total após cortes</div>
              <div className="mt-1 text-2xl text-emerald-400" style={DISPLAY}>{fmtBRL(resumo.aposCortes)}</div>
            </div>
          </div>

          {/* Custos por categoria (somados) — clique numa categoria para ver os itens */}
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Custos por categoria ({mesAtivo === 'ALL' ? 'todas juntas' : rotuloMes}){' '}
            <span className="font-normal normal-case text-gray-500">· clique para ver os itens</span>
          </h3>
          <div className="mb-6 space-y-1.5 rounded-2xl border border-gray-700/50 bg-gray-800/60 p-4 shadow-sm">
            {categorias.map((g) => {
              const aberta = catAberta.has(g.cat);
              const itens = itemsByCat[g.cat] ?? [];
              const cortadoCat = itens.filter((i) => cortes.has(i.id)).reduce((s, i) => s + i.amount, 0);
              return (
                <div key={g.cat} className="rounded-xl">
                  <button
                    type="button"
                    onClick={() => toggleCat(g.cat)}
                    aria-expanded={aberta}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-gray-700/20"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-900/60 text-base" aria-hidden>
                      {catMeta(g.cat).emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium text-gray-200">
                          {g.cat}
                          <span className="ml-1.5 text-xs font-normal text-gray-500">· {itens.length} {itens.length === 1 ? 'item' : 'itens'}</span>
                          {cortadoCat > 0 && (
                            <span className="ml-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-400">−{fmtBRL(cortadoCat)}</span>
                          )}
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-gray-100" style={DISPLAY}>{fmtBRL(g.total)}</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-700/40">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500" style={{ width: `${g.pct}%` }} />
                      </div>
                    </div>
                    <span className="shrink-0 text-gray-400">{aberta ? '▾' : '▸'}</span>
                  </button>

                  {aberta && (
                    <div className="mt-1 border-t border-gray-700/40 pt-1 pl-1">
                      {itens.map((item) => {
                        const cortado = cortes.has(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-700/10 ${cortado ? 'opacity-50' : ''}`}
                          >
                            <input type="checkbox" checked={cortado} onChange={() => toggleCorte(item.id)} className="h-4 w-4 shrink-0 accent-amber-500" />
                            <div className="min-w-0 flex-1">
                              <div className={`truncate text-sm font-medium text-gray-100 ${cortado ? 'line-through' : ''}`}>
                                {item.description}
                                {item.recurring && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">♻ recorrente</span>
                                )}
                              </div>
                              {item.establishment && <div className="truncate text-xs text-gray-500">{item.establishment}</div>}
                            </div>
                            <span className={`shrink-0 text-sm font-semibold ${cortado ? 'text-gray-500 line-through' : 'text-gray-100'}`} style={DISPLAY}>{fmtBRL(item.amount)}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Faturas (expansíveis) */}
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Faturas</h3>
          <div className="space-y-3">
            {visibleInvoices.map((inv) => {
              const aberta = abertas.has(inv.id);
              const cortadoNa = inv.items.filter((i) => cortes.has(i.id)).reduce((s, i) => s + i.amount, 0);
              return (
                <div key={inv.id} className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/60 shadow-sm">
                  <div className="flex items-center gap-2 px-5 py-4">
                    <button type="button" onClick={() => toggleFatura(inv.id)} className="flex flex-1 items-center gap-2.5 text-left">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-sm text-blue-400" aria-hidden>🧾</span>
                      <span className="text-sm font-semibold text-gray-100">{inv.reference || inv.filename}</span>
                      <span className="text-xs text-gray-500">· {inv.itemCount} itens</span>
                      {cortadoNa > 0 && (
                        <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-400">−{fmtBRL(cortadoNa)}</span>
                      )}
                      <span className="ml-1 text-gray-400">{aberta ? '▾' : '▸'}</span>
                    </button>
                    <span className="text-sm font-semibold text-gray-100" style={DISPLAY}>{fmtBRL(inv.total)}</span>
                    <button
                      type="button"
                      onClick={() => void remover(inv.id)}
                      disabled={busy}
                      aria-label="Remover fatura"
                      className="rounded-lg px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                    >
                      ✕
                    </button>
                  </div>

                  {aberta && (
                    <div className="border-t border-gray-700/50">
                      {inv.items.map((item) => {
                        const cortado = cortes.has(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`flex cursor-pointer items-center gap-3 border-b border-gray-700/30 px-5 py-3 last:border-0 transition-colors hover:bg-gray-700/10 ${
                              cortado ? 'opacity-50' : ''
                            }`}
                          >
                            <input type="checkbox" checked={cortado} onChange={() => toggleCorte(item.id)} className="h-4 w-4 shrink-0 accent-amber-500" />
                            <div className="min-w-0 flex-1">
                              <div className={`text-sm font-medium text-gray-100 ${cortado ? 'line-through' : ''}`}>
                                {item.description}
                                <span className={`ml-2 inline-flex items-center gap-1 rounded-full bg-gray-900/50 px-1.5 py-0.5 text-[10px] font-medium ${catMeta(item.category).accent}`}>
                                  {catMeta(item.category).emoji} {item.category}
                                </span>
                                {item.recurring && (
                                  <span className="ml-1 inline-flex items-center rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">♻ recorrente</span>
                                )}
                              </div>
                              {item.establishment && <div className="text-xs text-gray-500">{item.establishment}</div>}
                            </div>
                            <span className={`text-sm font-semibold ${cortado ? 'text-gray-500 line-through' : 'text-gray-100'}`} style={DISPLAY}>{fmtBRL(item.amount)}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
