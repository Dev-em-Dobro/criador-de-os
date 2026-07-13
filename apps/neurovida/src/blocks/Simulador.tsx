/**
 * apps/neurovida — bloco CUSTOM: Simulador de Lançamentos.
 *
 * Porte do "Simulador" do Dobro OS, na fatia escolhida pelo dono: DUAS abas —
 * "Premissas & Custos" e "Escada de Crescimento" (a calculadora invertida).
 * As outras 3 abas do Dobro (Resultado & Fluxo, Lucro, Lançamentos) ficam fora.
 *
 * A Escada reimplementa o motor puro do Dobro (eficiência de caixa por R$
 * investido em tráfego). Estado persiste em localStorage. Renderiza com o
 * design system do @os/core (herda o skin creme/dusk).
 */

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { SectionHeader } from '@os/core';
import type { BlockDefinition, BlockProps } from '@os/core';

// ============================================================
// Tipos + estado
// ============================================================

interface Premissas {
  caixaInicial: number;
  entradaFixaMensal: number;
  percentualAVista: number; // fração 0..1
  ticketMedio: number;
  descImposto: number;
  descPlataforma: number;
  descComercial: number;
  descLancador: number;
  emprestimoAtivo: boolean;
  emprestimoValor: number;
  emprestimoParcela: number;
  emprestimoJuros: number;
}

interface MesCusto {
  id: string;
  label: string;
  custoFixo: number;
}

interface Escada {
  alvo: number;
  custoFixo: number;
  outrasSaidas: number;
  entradaFixa: number;
  numLancamentos: number;
  roas: number;
  descontoPct: number; // fração
  nossaPartePct: number; // fração
  trafegoNossaPct: number; // fração
  pctAVista: number; // fração
  ingressoPct: number; // fração
  investimentoSimulado: number;
}

interface SimState {
  premissas: Premissas;
  custos: MesCusto[];
  escada: Escada;
}

const STORAGE_KEY = 'neurovida-simulador';

/** Cenário-base (seed), adaptado dos defaults do Dobro OS. */
function seed(): SimState {
  return {
    premissas: {
      caixaInicial: 80000,
      entradaFixaMensal: 32000,
      percentualAVista: 0.7,
      ticketMedio: 1997,
      descImposto: 0.13,
      descPlataforma: 0.05,
      descComercial: 0.03,
      descLancador: 0,
      emprestimoAtivo: false,
      emprestimoValor: 150000,
      emprestimoParcela: 9000,
      emprestimoJuros: 35000,
    },
    custos: [
      { id: '2026-07', label: 'jul/26', custoFixo: 68000 },
      { id: '2026-08', label: 'ago/26', custoFixo: 40000 },
      { id: '2026-09', label: 'set/26', custoFixo: 38000 },
      { id: '2026-10', label: 'out/26', custoFixo: 38000 },
      { id: '2026-11', label: 'nov/26', custoFixo: 38000 },
      { id: '2026-12', label: 'dez/26', custoFixo: 38000 },
    ],
    escada: {
      alvo: 30000,
      custoFixo: 33000,
      outrasSaidas: 5000,
      entradaFixa: 32000,
      numLancamentos: 1,
      roas: 3,
      descontoPct: 0.21,
      nossaPartePct: 0.7,
      trafegoNossaPct: 0.7,
      pctAVista: 0.7,
      ingressoPct: 0,
      investimentoSimulado: 100000,
    },
  };
}

function loadState(): SimState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...seed(), ...(JSON.parse(raw) as SimState) };
  } catch {
    /* usa o seed */
  }
  return seed();
}

// ============================================================
// Formatação + motor da Escada (puro)
// ============================================================

const fmtBRL = (n: number): string =>
  Number.isFinite(n) ? `R$ ${Math.round(n).toLocaleString('pt-BR')}` : '—';
const fmtPct = (f: number): string => `${Math.round(f * 100)}%`;

/**
 * Eficiência = caixa gerado por R$ 1 investido em tráfego:
 *   ROAS × nossaParte × (1−desconto) × %àvista − trafegoNosso × (1−ingresso)
 * Se > 0, o lançamento gera caixa; o investimento necessário sai por divisão.
 */
function calcEscada(e: Escada) {
  const eficiencia =
    e.roas * e.nossaPartePct * (1 - e.descontoPct) * e.pctAVista -
    e.trafegoNossaPct * (1 - e.ingressoPct);
  const sobraNecessaria = e.alvo + e.custoFixo + e.outrasSaidas - e.entradaFixa;
  const viavel = eficiencia > 0;
  const investimento = viavel ? sobraNecessaria / eficiencia : Infinity;
  const faturamento = viavel ? e.roas * investimento : Infinity;
  const receitaNossa = faturamento * e.nossaPartePct;
  const liquido = receitaNossa * (1 - e.descontoPct);
  const caixaImediato = liquido * e.pctAVista;
  const trafegoNosso = investimento * e.trafegoNossaPct;
  const ingresso = trafegoNosso * e.ingressoPct;
  const trafegoLiquido = trafegoNosso - ingresso;
  return {
    eficiencia,
    sobraNecessaria,
    viavel,
    investimento,
    faturamento,
    receitaNossa,
    liquido,
    caixaImediato,
    trafegoNosso,
    trafegoLiquido,
  };
}

/** "E se investir R$ X?" — decompõe um investimento concreto. */
function calcDireto(e: Escada, invest: number) {
  const faturamento = e.roas * invest;
  const receitaNossa = faturamento * e.nossaPartePct;
  const liquido = receitaNossa * (1 - e.descontoPct);
  const caixaImediato = liquido * e.pctAVista;
  const boleto24x = liquido - caixaImediato;
  const trafegoNosso = invest * e.trafegoNossaPct;
  const ingresso = trafegoNosso * e.ingressoPct;
  const sobra = caixaImediato - (trafegoNosso - ingresso);
  return { faturamento, liquido, caixaImediato, boleto24x, trafegoNosso, sobra };
}

// ============================================================
// Campos de formulário (design system)
// ============================================================

const inputCls =
  'w-full rounded-lg border border-gray-600 bg-gray-900/40 px-3 py-2 text-sm text-gray-100 focus:border-blue-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50';

function MoneyField({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-400">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">R$</span>
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className={inputCls} />
      </div>
      {hint && <span className="mt-1 block text-[11px] text-gray-500">{hint}</span>}
    </label>
  );
}

function PercentField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-400">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={Math.round(value * 100)}
          onChange={(e) => onChange((Number(e.target.value) || 0) / 100)}
          className={inputCls}
        />
        <span className="text-xs text-gray-500">%</span>
      </div>
    </label>
  );
}

function NumField({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-400">{label}</span>
      <input type="number" step={step ?? 1} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className={inputCls} />
    </label>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 backdrop-blur-sm">
      <h4 className="mb-4 text-sm font-semibold text-gray-200">{title}</h4>
      {children}
    </div>
  );
}

// ============================================================
// Abas
// ============================================================

function PremissasTab({
  state,
  set,
}: {
  state: SimState;
  set: (patch: Partial<SimState>) => void;
}) {
  const p = state.premissas;
  const setP = (patch: Partial<Premissas>) => set({ premissas: { ...p, ...patch } });
  const descontoTotal = p.descImposto + p.descPlataforma + p.descComercial + p.descLancador;
  const custoTotal = state.custos.reduce((s, m) => s + m.custoFixo, 0);

  function setMes(id: string, custoFixo: number) {
    set({ custos: state.custos.map((m) => (m.id === id ? { ...m, custoFixo } : m)) });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Premissas gerais">
        <div className="grid grid-cols-2 gap-3">
          <MoneyField label="Caixa inicial" value={p.caixaInicial} onChange={(v) => setP({ caixaInicial: v })} hint="Saldo no início do 1º mês" />
          <MoneyField label="Entrada fixa mensal" value={p.entradaFixaMensal} onChange={(v) => setP({ entradaFixaMensal: v })} hint="Recorrência (boletos etc.)" />
          <PercentField label="% à vista" value={p.percentualAVista} onChange={(v) => setP({ percentualAVista: v })} />
          <MoneyField label="Ticket médio" value={p.ticketMedio} onChange={(v) => setP({ ticketMedio: v })} />
        </div>
      </Card>

      <Card title={`Descontos sobre a receita — ${fmtPct(descontoTotal)}`}>
        <div className="grid grid-cols-2 gap-3">
          <PercentField label="Imposto" value={p.descImposto} onChange={(v) => setP({ descImposto: v })} />
          <PercentField label="Taxa plataforma" value={p.descPlataforma} onChange={(v) => setP({ descPlataforma: v })} />
          <PercentField label="Comissão comercial" value={p.descComercial} onChange={(v) => setP({ descComercial: v })} />
          <PercentField label="Comissão lançador" value={p.descLancador} onChange={(v) => setP({ descLancador: v })} />
        </div>
        <p className="mt-3 text-[11px] text-gray-500">Taxas padrão aplicadas a novos lançamentos.</p>
      </Card>

      <Card title="Empréstimo (fundo separado)">
        <label className="mb-3 flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={p.emprestimoAtivo} onChange={(e) => setP({ emprestimoAtivo: e.target.checked })} />
          {p.emprestimoAtivo ? 'Ativo' : 'Desativado'}
        </label>
        {p.emprestimoAtivo && (
          <div className="grid grid-cols-2 gap-3">
            <MoneyField label="Valor" value={p.emprestimoValor} onChange={(v) => setP({ emprestimoValor: v })} />
            <MoneyField label="Parcela mensal" value={p.emprestimoParcela} onChange={(v) => setP({ emprestimoParcela: v })} />
            <MoneyField label="Juros estimado" value={p.emprestimoJuros} onChange={(v) => setP({ emprestimoJuros: v })} />
          </div>
        )}
        <p className="mt-3 text-[11px] text-gray-500">O fundo banca o tráfego nosso até esgotar.</p>
      </Card>

      <Card title={`Custo fixo por mês — total ${fmtBRL(custoTotal)}`}>
        <div className="grid grid-cols-2 gap-3">
          {state.custos.map((m) => (
            <MoneyField key={m.id} label={m.label} value={m.custoFixo} onChange={(v) => setMes(m.id, v)} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function EscadaTab({ escada, set }: { escada: Escada; set: (patch: Partial<Escada>) => void }) {
  const r = useMemo(() => calcEscada(escada), [escada]);
  const direto = useMemo(() => calcDireto(escada, escada.investimentoSimulado), [escada]);

  // Cenários comparativos: variações sobre o atual.
  const cenarios = useMemo(() => {
    const base = { label: 'Atual', e: escada };
    const custoMenos = { label: 'Custo −10k', e: { ...escada, custoFixo: escada.custoFixo - 10000 } };
    const avista85 = { label: 'À vista 85%', e: { ...escada, pctAVista: 0.85 } };
    const combo = { label: 'À vista 85% + custo −10k', e: { ...escada, pctAVista: 0.85, custoFixo: escada.custoFixo - 10000 } };
    return [base, custoMenos, avista85, combo].map((c) => ({ label: c.label, r: calcEscada(c.e) }));
  }, [escada]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card title="Calculadora invertida — de quanto preciso para crescer?">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MoneyField label="Alvo de crescimento/mês" value={escada.alvo} onChange={(v) => set({ alvo: v })} />
          <MoneyField label="Custo fixo mensal" value={escada.custoFixo} onChange={(v) => set({ custoFixo: v })} />
          <MoneyField label="Outras saídas" value={escada.outrasSaidas} onChange={(v) => set({ outrasSaidas: v })} />
          <MoneyField label="Entrada fixa mensal" value={escada.entradaFixa} onChange={(v) => set({ entradaFixa: v })} />
          <NumField label="Nº de lançamentos/mês" value={escada.numLancamentos} onChange={(v) => set({ numLancamentos: Math.max(1, v) })} />
          <NumField label="ROAS" value={escada.roas} onChange={(v) => set({ roas: v })} step={0.1} />
          <PercentField label="Desconto total" value={escada.descontoPct} onChange={(v) => set({ descontoPct: v })} />
          <PercentField label="Nossa parte" value={escada.nossaPartePct} onChange={(v) => set({ nossaPartePct: v })} />
          <PercentField label="Tráfego nosso" value={escada.trafegoNossaPct} onChange={(v) => set({ trafegoNossaPct: v })} />
          <PercentField label="% à vista" value={escada.pctAVista} onChange={(v) => set({ pctAVista: v })} />
          <PercentField label="Recuperação ingresso" value={escada.ingressoPct} onChange={(v) => set({ ingressoPct: v })} />
        </div>
      </Card>

      {/* Resultado principal */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`rounded-2xl border p-5 ${r.viavel ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
          <div className="text-xs text-gray-400">Investimento necessário (tráfego)</div>
          <div className="mt-1 text-2xl font-bold text-gray-100">{fmtBRL(r.investimento)}</div>
          <div className="mt-1 text-xs text-gray-500">para crescer {fmtBRL(escada.alvo)}/mês</div>
        </div>
        <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5">
          <div className="text-xs text-gray-400">Faturamento necessário</div>
          <div className="mt-1 text-2xl font-bold text-gray-100">{fmtBRL(r.faturamento)}</div>
          <div className="mt-1 text-xs text-gray-500">ROAS {escada.roas}× sobre o investimento</div>
        </div>
        <div className={`rounded-2xl border p-5 ${r.viavel ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
          <div className="text-xs text-gray-400">Eficiência (caixa por R$ investido)</div>
          <div className={`mt-1 text-2xl font-bold ${r.viavel ? 'text-emerald-400' : 'text-red-400'}`}>
            {r.eficiencia.toFixed(2)}
          </div>
          <div className="mt-1 text-xs text-gray-500">{r.viavel ? 'viável' : 'inviável — ajuste os parâmetros'}</div>
        </div>
      </div>

      {/* Comparação de cenários */}
      <Card title="Comparação de cenários">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/60 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-3 py-2">Cenário</th>
                <th className="px-3 py-2 text-right">Investimento</th>
                <th className="px-3 py-2 text-right">Faturamento</th>
                <th className="px-3 py-2 text-right">Eficiência</th>
                <th className="px-3 py-2 text-center">Viável</th>
              </tr>
            </thead>
            <tbody>
              {cenarios.map((c) => (
                <tr key={c.label} className="border-b border-gray-800/60 last:border-0">
                  <td className="px-3 py-2 text-gray-300">{c.label}</td>
                  <td className="px-3 py-2 text-right font-mono tnum text-gray-100">{fmtBRL(c.r.investimento)}</td>
                  <td className="px-3 py-2 text-right font-mono tnum text-gray-100">{fmtBRL(c.r.faturamento)}</td>
                  <td className="px-3 py-2 text-right font-mono tnum text-gray-300">{c.r.eficiencia.toFixed(2)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={c.r.viavel ? 'text-emerald-400' : 'text-red-400'}>{c.r.viavel ? 'sim' : 'não'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Caminho direto */}
      <Card title="Caminho direto — e se investir…?">
        <div className="max-w-xs">
          <MoneyField label="Investimento simulado" value={escada.investimentoSimulado} onChange={(v) => set({ investimentoSimulado: v })} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Faturamento', v: direto.faturamento },
            { label: 'Líquido', v: direto.liquido },
            { label: 'Caixa imediato', v: direto.caixaImediato },
            { label: 'Boleto 24x', v: direto.boleto24x },
            { label: 'Tráfego nosso', v: direto.trafegoNosso },
            { label: 'Sobra no ciclo', v: direto.sobra },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-3">
              <div className="text-[11px] text-gray-500">{item.label}</div>
              <div className={`mt-0.5 text-sm font-semibold ${item.label === 'Sobra no ciclo' && item.v < 0 ? 'text-red-400' : 'text-gray-100'}`}>
                {fmtBRL(item.v)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// Bloco
// ============================================================

type Aba = 'premissas' | 'escada';

function SimuladorBlock({ title, subtitle }: BlockProps) {
  const [state, setState] = useState<SimState>(() => loadState());
  const [aba, setAba] = useState<Aba>('premissas');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* sem persistência */
    }
  }, [state]);

  const set = (patch: Partial<SimState>) => setState((s) => ({ ...s, ...patch }));
  const setEscada = (patch: Partial<Escada>) => setState((s) => ({ ...s, escada: { ...s.escada, ...patch } }));

  function restaurar() {
    if (confirm('Restaurar o cenário-base? Suas alterações serão perdidas.')) setState(seed());
  }

  const ABAS: { id: Aba; label: string }[] = [
    { id: 'premissas', label: '⚙️ Premissas & Custos' },
    { id: 'escada', label: '🪜 Escada de Crescimento' },
  ];

  return (
    <div>
      <SectionHeader title={title ?? 'Simulador de Lançamentos'} subtitle={subtitle} icon="🧪">
        <button
          type="button"
          onClick={restaurar}
          className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-blue-500/40 hover:text-gray-200"
        >
          ↺ Restaurar cenário-base
        </button>
      </SectionHeader>

      {/* Abas */}
      <div role="tablist" aria-label="Seções do simulador" className="mb-6 flex gap-1 border-b border-gray-700/60">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={aba === a.id}
            onClick={() => setAba(a.id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              aba === a.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {aba === 'premissas' ? <PremissasTab state={state} set={set} /> : <EscadaTab escada={state.escada} set={setEscada} />}
      </div>
    </div>
  );
}

/** Definição registrável do bloco custom "Simulador". */
export const simulador: BlockDefinition = {
  type: 'custom:simulador',
  component: SimuladorBlock,
  defaultDataShape: 'raw',
};
