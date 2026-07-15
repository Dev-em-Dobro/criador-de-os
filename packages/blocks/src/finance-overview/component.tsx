/**
 * @os/blocks — componente do `finance-overview` (Resultado & Caixa).
 *
 * Painel do dono: premissas (saldo inicial + custos fora do cartão) → cruza com
 * receita (Hotmart) e despesa (cartão) via `/api/finance/overview` → mostra lucro,
 * margem, break-even, runway e a curva de caixa de 12 meses. Só desenha; a conta é
 * do motor determinístico. Token-driven (serve creme E dusk). Fraunces nos números.
 */

import { useEffect, useState } from 'react';
import { SectionHeader, EmptyState } from '@os/core';
import type { BlockProps } from '@os/core';

const DISPLAY = { fontFamily: 'var(--font-display, inherit)' } as const;
const fmtBRL = (n: number): string => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtBRL2 = (n: number): string => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Compartilha as premissas com o agente financeiro (mesmas chaves): informar aqui
// reflete no balão/hub e vice-versa.
const K_SALDO = 'os-assistant-financas-saldoInicial';
const K_CUSTO = 'os-assistant-financas-custosForaCartao';
const K_RECEITA = 'os-assistant-financas-receitaMensal';

interface ProjecaoMes {
  i: number;
  receita: number;
  despesa: number;
  resultado: number;
  caixa: number;
}
interface Overview {
  fonteReceita: 'hotmart' | 'manual' | 'nenhuma';
  receitaMes: number;
  receitaAtual: number | null;
  receitaAnterior: number | null;
  crescimentoPct: number | null;
  despesaRecorrenteCartao: number;
  custosForaCartao: number;
  despesaFixaMes: number;
  lucroMes: number;
  margemPct: number | null;
  breakeven: number;
  runwayMeses: number | null;
  saldoInicial: number;
  projecao: ProjecaoMes[];
  marcos: { m3: number; m6: number; m12: number };
  apertaNoMes: number | null;
}

/** Lê um número BR de um campo ("15.000", "R$ 15.000,00") → número (0 se vazio). */
function parseNum(s: string): number {
  const t = s.trim();
  if (!t) return 0;
  const limpo = t.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Curva de caixa (SVG): saldo inicial + 12 meses. Linha teal + área + linha do zero. */
function CashChart({ overview }: { overview: Overview }) {
  const W = 640;
  const H = 180;
  const pad = 8;
  const pts = [overview.saldoInicial, ...overview.projecao.map((p) => p.caixa)]; // 13 pontos (mês 0..12)
  const max = Math.max(0, ...pts);
  const min = Math.min(0, ...pts);
  const range = max - min || 1;
  const x = (i: number) => pad + (i / (pts.length - 1)) * (W - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / range) * (H - pad * 2);
  const line = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L ${x(pts.length - 1).toFixed(1)} ${H - pad} L ${x(0).toFixed(1)} ${H - pad} Z`;
  const zeroY = y(0);
  const marcoIdx = [3, 6, 12];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label="Projeção de caixa">
      <defs>
        <linearGradient id="cashfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-blue-500)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--color-blue-500)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* linha do zero (só se a faixa cruza zero) */}
      {min < 0 && (
        <line x1={pad} y1={zeroY} x2={W - pad} y2={zeroY} stroke="var(--color-red-400)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
      )}
      <path d={area} fill="url(#cashfill)" />
      <path d={line} fill="none" stroke="var(--color-blue-500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* marcos 3/6/12 */}
      {marcoIdx.map((m) => (
        <circle key={m} cx={x(m)} cy={y(pts[m])} r="4" fill="var(--color-blue-500)" stroke="#fff" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

export default function FinanceOverview({ title, subtitle }: BlockProps) {
  const [saldo, setSaldo] = useState(() => localStorage.getItem(K_SALDO) ?? '');
  const [custo, setCusto] = useState(() => localStorage.getItem(K_CUSTO) ?? '');
  const [receita, setReceita] = useState(() => localStorage.getItem(K_RECEITA) ?? '');
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar(): Promise<void> {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch('/api/finance/overview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          premissas: {
            saldoInicial: parseNum(saldo),
            custosForaCartao: parseNum(custo),
            receitaManual: parseNum(receita),
          },
        }),
      });
      const d = (await res.json()) as Overview & { error?: string };
      if (!res.ok) throw new Error(d.error || 'Falha ao calcular o resultado.');
      setData(d);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    void carregar();
  }, []);

  function aplicar(): void {
    localStorage.setItem(K_SALDO, saldo);
    localStorage.setItem(K_CUSTO, custo);
    localStorage.setItem(K_RECEITA, receita);
    void carregar();
  }

  const semReceita = data?.fonteReceita === 'nenhuma';
  const lucroNeg = (data?.lucroMes ?? 0) < 0;

  return (
    <div>
      <SectionHeader title={title ?? 'Resultado & Caixa'} subtitle={subtitle} icon="📈" />

      {/* Premissas do dono */}
      <div className="mb-6 rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Suas premissas</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PremissaInput label="Saldo de caixa hoje" hint="quanto você tem em conta" value={saldo} onChange={setSaldo} onEnter={aplicar} />
          <PremissaInput label="Custos fixos fora do cartão" hint="/mês — pró-labore, aluguel…" value={custo} onChange={setCusto} onEnter={aplicar} />
          <PremissaInput
            label="Receita mensal"
            hint={data?.fonteReceita === 'hotmart' ? 'vem da Hotmart (ignorado)' : 'se não usa Hotmart'}
            value={receita}
            onChange={setReceita}
            onEnter={aplicar}
            disabled={data?.fonteReceita === 'hotmart'}
          />
        </div>
        <button
          type="button"
          onClick={aplicar}
          disabled={loading}
          className="mt-4 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? 'Calculando…' : 'Atualizar resultado'}
        </button>
      </div>

      {erro && !loading && <EmptyState icon="⚠️" message={erro} hint="Confira se já há faturas e (opcional) a Hotmart conectada." />}

      {data && !loading && (
        <>
          {semReceita && (
            <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
              Sem receita ainda: conecte a Hotmart em <b>Faturamento</b> ou informe sua receita mensal acima para ver lucro e projeção.
            </div>
          )}

          {/* KPIs */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Herói: lucro do mês */}
            <div
              className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${
                lucroNeg ? 'bg-gradient-to-br from-red-400 to-red-600 shadow-red-500/25' : 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 shadow-blue-500/25'
              }`}
            >
              <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
              <div className="relative text-[11px] font-semibold uppercase tracking-wider text-white/70">Lucro estimado / mês</div>
              <div className="relative mt-2 text-3xl leading-none tracking-tight" style={DISPLAY}>{fmtBRL(data.lucroMes)}</div>
              <div className="relative mt-3 text-xs text-white/75">
                {data.margemPct != null ? `Margem ${data.margemPct}%` : 'Informe a receita p/ ver a margem'}
              </div>
            </div>

            <Kpi label="Receita / mês" value={fmtBRL(data.receitaMes)} sub={fonteLabel(data)} icon="💰" />
            <Kpi
              label="Despesa fixa / mês"
              value={fmtBRL(data.despesaFixaMes)}
              sub={`Cartão ${fmtBRL(data.despesaRecorrenteCartao)} + fora ${fmtBRL(data.custosForaCartao)}`}
              icon="🔁"
            />
            <Kpi
              label={lucroNeg ? 'Runway do caixa' : 'Ponto de equilíbrio'}
              value={lucroNeg ? (data.runwayMeses != null ? `${data.runwayMeses} mês(es)` : '—') : `${fmtBRL(data.breakeven)}`}
              sub={lucroNeg ? 'até o caixa zerar no ritmo atual' : 'receita p/ empatar as contas'}
              icon={lucroNeg ? '⏳' : '⚖️'}
              tone={lucroNeg ? 'amber' : 'brand'}
            />
          </div>

          {/* Projeção de caixa */}
          <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Projeção de caixa · 12 meses</h3>
                <p className="mt-1 text-xs text-gray-500">A partir do saldo de hoje, mantendo receita e despesa constantes.</p>
              </div>
              <div className="flex gap-5">
                <Marco label="em 3 meses" v={data.marcos.m3} />
                <Marco label="em 6 meses" v={data.marcos.m6} />
                <Marco label="em 12 meses" v={data.marcos.m12} />
              </div>
            </div>

            <CashChart overview={data} />

            {data.apertaNoMes != null ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-300">
                ⚠️ Pelo ritmo atual, o caixa fica <b>negativo a partir do mês {data.apertaNoMes}</b>. Vale cortar custos ou puxar receita.
              </div>
            ) : (
              !lucroNeg &&
              data.receitaMes > 0 && (
                <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-2.5 text-sm text-emerald-400">
                  ✓ No ritmo atual, seu caixa <b>cresce</b> — sobra pra investir em crescimento.
                </div>
              )
            )}
          </div>

          <p className="mt-4 text-[11px] text-gray-500">
            Projeção simples (assume receita e despesa constantes) — é uma direção, não garantia. Para uma leitura com contexto, chame o
            {' '}<b>Analista Financeiro</b> no balão ou em Agentes.
          </p>
        </>
      )}
    </div>
  );
}

function fonteLabel(o: Overview): string {
  if (o.fonteReceita === 'hotmart') {
    return o.crescimentoPct != null ? `Hotmart · ${o.crescimentoPct >= 0 ? '▲' : '▼'} ${Math.abs(o.crescimentoPct)}% vs mês ant.` : 'média Hotmart';
  }
  if (o.fonteReceita === 'manual') return 'informada à mão';
  return 'sem fonte';
}

function PremissaInput({
  label,
  hint,
  value,
  onChange,
  onEnter,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] text-gray-400">
        {label} {hint && <span className="text-gray-500">({hint})</span>}
      </label>
      <div className="flex items-center rounded-lg border border-gray-600 bg-gray-900/40 focus-within:border-blue-500/60">
        <span className="pl-3 text-xs text-gray-500">R$</span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEnter();
          }}
          placeholder="0"
          className="w-full bg-transparent px-2 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none disabled:opacity-40"
        />
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon,
  tone = 'brand',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  tone?: 'brand' | 'amber';
}) {
  const chip = tone === 'amber' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400';
  return (
    <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 shadow-sm">
      <span className={`grid h-11 w-11 place-items-center rounded-xl text-lg ${chip}`} aria-hidden>{icon}</span>
      <div className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-1 text-2xl text-gray-100" style={DISPLAY}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-gray-500">{sub}</div>}
    </div>
  );
}

function Marco({ label, v }: { label: string; v: number }) {
  const neg = v < 0;
  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`text-sm font-semibold ${neg ? 'text-red-400' : 'text-gray-100'}`} style={DISPLAY}>{fmtBRL2(v)}</div>
    </div>
  );
}
