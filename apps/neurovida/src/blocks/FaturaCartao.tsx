/**
 * apps/neurovida — bloco CUSTOM: Fatura do cartão (dados REAIS, PDF por IA).
 *
 * Fluxo: o cliente SOBE o(s) PDF(s) da fatura → a IA (chave BYOK) extrai os
 * itens, categoriza e detecta recorrentes → o Neon guarda → esta tela mostra os
 * custos SOMADOS (todas as faturas juntas), por categoria, e o controle de
 * cortes (marque itens pra cortar e veja quanto a conta fica DEPOIS + economia
 * anual das assinaturas cortadas). Cortes persistem em localStorage.
 */

import { useEffect, useMemo, useState } from 'react';
import { SectionHeader } from '@os/core';
import type { BlockDefinition, BlockProps } from '@os/core';

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

const CAT_ORDER = ['Ferramentas', 'Tráfego', 'Fornecedores', 'Logística', 'Serviços', 'Impostos', 'Outros'];
const CAT_ACCENT: Record<string, string> = {
  Ferramentas: 'text-amber-400',
  Tráfego: 'text-blue-300',
  Fornecedores: 'text-emerald-400',
  Logística: 'text-purple-300',
  Serviços: 'text-gray-300',
  Impostos: 'text-red-400',
  Outros: 'text-gray-400',
};

const STORAGE_KEY = 'neurovida-fatura-cortes';
const fmtBRL = (n: number): string => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

function FaturaCartaoBlock({ title, subtitle }: BlockProps) {
  const [data, setData] = useState<Data | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cortes, setCortes] = useState<Set<number>>(() => loadCortes());
  const [abertas, setAbertas] = useState<Set<string>>(() => new Set());

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

  const resumo = useMemo(() => {
    const allItems = (data?.invoices ?? []).flatMap((inv) => inv.items);
    const grand = data?.totals.grand ?? 0;
    const cortados = allItems.filter((i) => cortes.has(i.id));
    const totalCortes = cortados.reduce((s, i) => s + i.amount, 0);
    const economiaAno = cortados.filter((i) => i.recurring).reduce((s, i) => s + i.amount, 0) * 12;
    return { grand, recorrente: data?.totals.recurring ?? 0, totalCortes, aposCortes: grand - totalCortes, economiaAno };
  }, [data, cortes]);

  const categorias = useMemo(() => {
    const by = data?.totals.byCategory ?? {};
    const keys = [...CAT_ORDER.filter((c) => by[c]), ...Object.keys(by).filter((c) => !CAT_ORDER.includes(c))];
    const max = Math.max(1, ...keys.map((k) => by[k] ?? 0));
    return keys.map((cat) => ({ cat, total: by[cat] ?? 0, pct: Math.round(((by[cat] ?? 0) / max) * 100) }));
  }, [data]);

  const temFaturas = (data?.invoices.length ?? 0) > 0;

  return (
    <div>
      <SectionHeader title={title ?? 'Fatura do cartão'} subtitle={subtitle} icon="💳" />

      {erro && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>
      )}

      {/* Upload */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 backdrop-blur-sm">
        <label
          className={`inline-flex cursor-pointer items-center rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${
            busy ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          {busy ? 'Processando…' : 'Subir PDF(s) da fatura'}
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
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
          <div className="rounded-2xl border border-gray-700/50 bg-gray-800/40 p-10 text-center">
            <div className="mb-2 text-3xl">🧾</div>
            <p className="text-sm font-medium text-gray-300">Nenhuma fatura ainda.</p>
            <p className="mt-1 text-xs text-gray-500">Suba o PDF da fatura do cartão para começar.</p>
          </div>
        )
      ) : (
        <>
          {/* Resumo (recalcula com cortes) */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5">
              <div className="text-xs text-gray-400">Total (todas as faturas)</div>
              <div className="mt-1 text-2xl font-bold text-gray-100">{fmtBRL(resumo.grand)}</div>
            </div>
            <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5">
              <div className="text-xs text-gray-400">Recorrentes (assinaturas)</div>
              <div className="mt-1 text-2xl font-bold text-amber-400">{fmtBRL(resumo.recorrente)}</div>
            </div>
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5">
              <div className="text-xs text-gray-400">Marcado pra cortar</div>
              <div className="mt-1 text-2xl font-bold text-amber-400">{fmtBRL(resumo.totalCortes)}</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-5">
              <div className="text-xs text-gray-400">Total após cortes</div>
              <div className="mt-1 text-2xl font-bold text-emerald-400">{fmtBRL(resumo.aposCortes)}</div>
              {resumo.economiaAno > 0 && (
                <div className="mt-1 text-[11px] text-gray-500">≈ {fmtBRL(resumo.economiaAno)}/ano economizados</div>
              )}
            </div>
          </div>

          {/* Custos por categoria (somados) */}
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Custos por categoria (todas juntas)</h3>
          <div className="mb-6 space-y-2 rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 backdrop-blur-sm">
            {categorias.map((g) => (
              <div key={g.cat}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className={`font-medium ${CAT_ACCENT[g.cat] ?? 'text-gray-300'}`}>{g.cat}</span>
                  <span className="font-mono tnum text-gray-200">{fmtBRL(g.total)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-700/50">
                  <div className="h-full rounded-full bg-blue-500/70" style={{ width: `${g.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Faturas (expansíveis) */}
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Faturas</h3>
          <div className="space-y-3">
            {data!.invoices.map((inv) => {
              const aberta = abertas.has(inv.id);
              const cortadoNa = inv.items.filter((i) => cortes.has(i.id)).reduce((s, i) => s + i.amount, 0);
              return (
                <div key={inv.id} className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/60 backdrop-blur-sm">
                  <div className="flex items-center gap-2 px-5 py-3.5">
                    <button type="button" onClick={() => toggleFatura(inv.id)} className="flex flex-1 items-center gap-2 text-left">
                      <span className="text-gray-500">{aberta ? '▾' : '▸'}</span>
                      <span className="text-sm font-semibold text-gray-100">{inv.reference || inv.filename}</span>
                      <span className="text-xs text-gray-500">· {inv.itemCount} itens</span>
                      {cortadoNa > 0 && (
                        <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-400">−{fmtBRL(cortadoNa)}</span>
                      )}
                    </button>
                    <span className="font-mono tnum text-sm font-semibold text-gray-100">{fmtBRL(inv.total)}</span>
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
                            className={`flex cursor-pointer items-center gap-3 border-b border-gray-800/60 px-5 py-3 last:border-0 transition-colors hover:bg-gray-700/10 ${
                              cortado ? 'opacity-50' : ''
                            }`}
                          >
                            <input type="checkbox" checked={cortado} onChange={() => toggleCorte(item.id)} className="h-4 w-4 shrink-0 accent-red-500" />
                            <div className="min-w-0 flex-1">
                              <div className={`text-sm font-medium text-gray-100 ${cortado ? 'line-through' : ''}`}>
                                {item.description}
                                <span className={`ml-2 inline-flex items-center rounded-full border border-gray-600/50 bg-gray-700/40 px-1.5 py-0.5 text-[10px] font-normal ${CAT_ACCENT[item.category] ?? 'text-gray-400'}`}>
                                  {item.category}
                                </span>
                                {item.recurring && (
                                  <span className="ml-1 inline-flex items-center rounded-full border border-gray-600/50 bg-gray-700/40 px-1.5 py-0.5 text-[10px] font-normal text-gray-400">recorrente</span>
                                )}
                              </div>
                              {item.establishment && <div className="text-xs text-gray-500">{item.establishment}</div>}
                            </div>
                            <span className={`font-mono tnum text-sm font-semibold ${cortado ? 'text-gray-500 line-through' : 'text-gray-100'}`}>{fmtBRL(item.amount)}</span>
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

/** Definição registrável do bloco custom "Fatura do cartão". */
export const faturaCartao: BlockDefinition = {
  type: 'custom:fatura-cartao',
  component: FaturaCartaoBlock,
  defaultDataShape: 'raw',
};
