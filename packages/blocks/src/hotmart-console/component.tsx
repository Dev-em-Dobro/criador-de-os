/**
 * @os/blocks — componente do `hotmart-console`, carregado sob demanda.
 *
 * Mostra o FATURAMENTO da Hotmart (só agregados: nenhum dado de comprador). Com as
 * credenciais BYOK em Configurações, "Atualizar" chama /api/hotmart/sync (o backend
 * lê o RESUMO da Hotmart e guarda os totais); a tela lê /api/hotmart/metrics.
 * Renderiza com o design system (herda o skin).
 */

import { useEffect, useMemo, useState } from 'react';
import { SectionHeader } from '@os/core';
import type { BlockProps } from '@os/core';

interface MetricRow {
  period: string;
  product: string;
  grossRevenue: number;
  netRevenue: number;
  salesCount: number;
  currency: string;
}
interface Totals {
  currency: string;
  currentPeriod: string | null;
  currentRevenue: number;
  last12mRevenue: number;
  totalSales: number;
}
interface Data {
  rows: MetricRow[];
  totals: Totals;
}

const MESES_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** 'YYYY-MM' → 'jul/26'. */
function monthLabel(period: string): string {
  const m = period.match(/^(\d{4})-(\d{2})$/);
  if (!m) return period;
  const mes = MESES_ABBR[Number(m[2]) - 1] ?? m[2];
  return `${mes}/${m[1].slice(2)}`;
}

const fmtMoney = (n: number, currency: string): string =>
  `${currency === 'BRL' ? 'R$' : currency + ' '} ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function HotmartConsole({ title, subtitle }: BlockProps) {
  const [data, setData] = useState<Data | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(): Promise<void> {
    try {
      const res = await fetch('/api/hotmart/metrics');
      const d = (await res.json()) as Data & { error?: string };
      if (!res.ok) throw new Error(d.error || 'Falha ao carregar o faturamento.');
      setData(d);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function sync(): Promise<void> {
    setBusy(true);
    setErro(null);
    setStatus('Buscando o resumo de vendas na Hotmart…');
    try {
      const res = await fetch('/api/hotmart/sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ months: 12 }),
      });
      const d = (await res.json()) as Data & { error?: string };
      if (!res.ok) throw new Error(d.error || 'Falha ao atualizar o faturamento.');
      setData(d);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  const currency = data?.totals.currency ?? 'BRL';
  const rows = useMemo(() => (data?.rows ?? []).slice(0, 12), [data]);
  const maxGross = useMemo(() => Math.max(1, ...rows.map((r) => r.grossRevenue)), [rows]);
  const temDados = rows.length > 0;

  return (
    <div>
      <SectionHeader title={title ?? 'Faturamento (Hotmart)'} subtitle={subtitle} icon="💰" />

      {erro && (
        <div role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </div>
      )}

      {/* Ação de atualizar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => void sync()}
          disabled={busy}
          className={`inline-flex items-center rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
            busy ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          {busy ? 'Atualizando…' : 'Atualizar da Hotmart'}
        </button>
        <p className="flex-1 text-xs text-gray-500">
          {status ??
            'Busca o resumo dos últimos 12 meses (usa as suas credenciais em Configurações). Só o faturamento é guardado — nenhum dado dos compradores.'}
        </p>
      </div>

      {!temDados ? (
        !busy && (
          <div className="rounded-2xl border border-gray-700/50 bg-gray-800/40 p-10 text-center">
            <div className="mb-2 text-3xl">💰</div>
            <p className="text-sm font-medium text-gray-300">Nenhum faturamento ainda.</p>
            <p className="mt-1 text-xs text-gray-500">
              Conecte a sua conta Hotmart em Configurações e clique em "Atualizar da Hotmart".
            </p>
          </div>
        )
      ) : (
        <>
          {/* KPIs */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5">
              <div className="text-xs text-gray-400">
                Faturamento do mês{data!.totals.currentPeriod ? ` (${monthLabel(data!.totals.currentPeriod)})` : ''}
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-400">{fmtMoney(data!.totals.currentRevenue, currency)}</div>
            </div>
            <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5">
              <div className="text-xs text-gray-400">Faturamento (12 meses)</div>
              <div className="mt-1 text-2xl font-bold text-gray-100">{fmtMoney(data!.totals.last12mRevenue, currency)}</div>
            </div>
            <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5">
              <div className="text-xs text-gray-400">Vendas (12 meses)</div>
              <div className="mt-1 text-2xl font-bold text-gray-100">{data!.totals.totalSales.toLocaleString('pt-BR')}</div>
            </div>
          </div>

          {/* Faturamento por mês (barras) */}
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Faturamento por mês</h3>
          <div className="space-y-1 rounded-2xl border border-gray-700/50 bg-gray-800/60 p-4 backdrop-blur-sm">
            {rows.map((r) => {
              const pct = Math.round((r.grossRevenue / maxGross) * 100);
              return (
                <div key={r.period} className="rounded-lg px-2 py-2">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-gray-200">{monthLabel(r.period)}</span>
                      <span className="text-xs text-gray-500">
                        · {r.salesCount.toLocaleString('pt-BR')} {r.salesCount === 1 ? 'venda' : 'vendas'}
                      </span>
                    </span>
                    <span className="font-mono tnum text-gray-100">{fmtMoney(r.grossRevenue, currency)}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-700/50">
                    <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
