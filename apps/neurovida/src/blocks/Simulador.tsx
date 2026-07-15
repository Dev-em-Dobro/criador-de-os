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

import { Fragment, useEffect, useMemo, useState } from 'react';
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

// Fonte de display (Fraunces via token do skin) para os números grandes.
const DISPLAY = { fontFamily: 'var(--font-display, inherit)' } as const;

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

/**
 * Herança passo 1 → passo 2: os campos da Escada que a pessoa JÁ definiu nas
 * Premissas passam a vir de lá (% à vista, desconto somado, entrada fixa e o
 * custo fixo médio dos meses). Continuam editáveis na Escada para simular.
 */
function herdarDasPremissas(s: SimState): Escada {
  const p = s.premissas;
  const descontoTotal = p.descImposto + p.descPlataforma + p.descComercial + p.descLancador;
  const custoMedio = s.custos.length
    ? Math.round(s.custos.reduce((acc, m) => acc + m.custoFixo, 0) / s.custos.length)
    : s.escada.custoFixo;
  return {
    ...s.escada,
    pctAVista: p.percentualAVista,
    descontoPct: descontoTotal,
    entradaFixa: p.entradaFixaMensal,
    custoFixo: custoMedio,
  };
}

// ============================================================
// Campos de formulário (design system)
// ============================================================

const inputCls =
  'w-full rounded-lg border border-gray-600 bg-gray-900/40 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:border-blue-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50';

/** Só dígitos (inteiros). */
const sanitizeInt = (raw: string): string => raw.replace(/\D/g, '');
/** Dígitos + um separador decimal (vírgula vira ponto). */
function sanitizeDec(raw: string): string {
  const clean = raw.replace(/[^\d.,]/g, '').replace(/,/g, '.');
  const [int, ...rest] = clean.split('.');
  return rest.length ? `${int}.${rest.join('')}` : int;
}

/**
 * Ícone "?" ao lado do rótulo que mostra um balão explicando o campo. Abre no
 * mouseover (desktop) e no foco por teclado (acessível); o clique também alterna
 * (cobre toque no mobile, onde não há hover).
 */
function HelpTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Mais informações sobre este campo"
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault(); // não deixa o clique focar o input do <label>
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-500 text-[10px] font-bold leading-none text-gray-400 transition-colors hover:border-blue-400 hover:text-blue-400"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-0 top-6 z-20 w-56 rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-[11px] font-normal leading-snug text-gray-200 shadow-xl"
        >
          {text}
        </span>
      )}
    </span>
  );
}

/**
 * Input numérico amigável: `type="text"` (evita os spinners e o scroll que muda
 * o valor sem querer do `type="number"`), mas SÓ aceita números. Mostra o valor
 * formatado quando fora de foco e os dígitos crus durante a edição.
 */
function NumericInput({
  value,
  onChange,
  placeholder,
  decimal,
  formatThousands,
  prefix,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  decimal?: boolean;
  formatThousands?: boolean;
  prefix?: string;
  suffix?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  const display = focused ? draft : formatThousands ? value.toLocaleString('pt-BR') : String(value);

  return (
    <div className="flex items-center gap-1">
      {prefix && <span className="shrink-0 text-xs text-gray-500">{prefix}</span>}
      <input
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        value={display}
        placeholder={placeholder}
        onFocus={() => {
          setDraft(value ? String(value) : '');
          setFocused(true);
        }}
        onChange={(e) => {
          const clean = decimal ? sanitizeDec(e.target.value) : sanitizeInt(e.target.value);
          setDraft(clean);
          const n = Number(clean);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        onBlur={() => setFocused(false)}
        className={inputCls}
      />
      {suffix && <span className="shrink-0 text-xs text-gray-500">{suffix}</span>}
    </div>
  );
}

/** Rótulo do campo + o "?" opcional. */
function FieldLabel({ label, help }: { label: string; help?: string }) {
  return (
    <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-400">
      {label}
      {help && <HelpTip text={help} />}
    </span>
  );
}

function MoneyField({ label, value, onChange, hint, help, placeholder }: { label: string; value: number; onChange: (v: number) => void; hint?: string; help?: string; placeholder?: string }) {
  return (
    <label className="block">
      <FieldLabel label={label} help={help} />
      <NumericInput value={value} onChange={onChange} prefix="R$" formatThousands placeholder={placeholder ?? 'ex.: 10.000'} />
      {hint && <span className="mt-1 block text-[11px] text-gray-500">{hint}</span>}
    </label>
  );
}

function PercentField({ label, value, onChange, help, placeholder }: { label: string; value: number; onChange: (v: number) => void; help?: string; placeholder?: string }) {
  return (
    <label className="block">
      <FieldLabel label={label} help={help} />
      <NumericInput value={Math.round(value * 100)} onChange={(v) => onChange(v / 100)} suffix="%" placeholder={placeholder ?? 'ex.: 70'} />
    </label>
  );
}

function NumField({ label, value, onChange, step, help, placeholder }: { label: string; value: number; onChange: (v: number) => void; step?: number; help?: string; placeholder?: string }) {
  return (
    <label className="block">
      <FieldLabel label={label} help={help} />
      <NumericInput value={value} onChange={onChange} decimal={(step ?? 1) < 1} placeholder={placeholder ?? 'ex.: 1'} />
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
          <MoneyField label="Caixa inicial" value={p.caixaInicial} onChange={(v) => setP({ caixaInicial: v })} hint="Saldo no início do 1º mês" help="Quanto você tem em caixa hoje, no começo do primeiro mês da simulação." placeholder="ex.: 80.000" />
          <MoneyField label="Entrada fixa mensal" value={p.entradaFixaMensal} onChange={(v) => setP({ entradaFixaMensal: v })} hint="Recorrência (boletos etc.)" help="Dinheiro que entra todo mês mesmo sem lançar nada: parcelas de vendas antigas, assinaturas, recorrência." placeholder="ex.: 32.000" />
          <PercentField label="% à vista" value={p.percentualAVista} onChange={(v) => setP({ percentualAVista: v })} help="De cada venda, quanto entra à vista no caixa. O resto vira boleto parcelado (não entra agora)." placeholder="ex.: 70" />
          <MoneyField label="Ticket médio" value={p.ticketMedio} onChange={(v) => setP({ ticketMedio: v })} help="Preço médio que cada cliente paga no produto." placeholder="ex.: 1.997" />
        </div>
      </Card>

      <Card title={`Descontos sobre a receita — ${fmtPct(descontoTotal)}`}>
        <div className="grid grid-cols-2 gap-3">
          <PercentField label="Imposto" value={p.descImposto} onChange={(v) => setP({ descImposto: v })} help="% da receita que vai pra impostos (Simples, ISS, etc.)." placeholder="ex.: 13" />
          <PercentField label="Taxa plataforma" value={p.descPlataforma} onChange={(v) => setP({ descPlataforma: v })} help="% que a plataforma de venda cobra por transação (ex.: Hotmart, Kiwify)." placeholder="ex.: 5" />
          <PercentField label="Comissão comercial" value={p.descComercial} onChange={(v) => setP({ descComercial: v })} help="% pago ao time de vendas / closers sobre cada venda." placeholder="ex.: 3" />
          <PercentField label="Comissão lançador" value={p.descLancador} onChange={(v) => setP({ descLancador: v })} help="% pago ao lançador ou parceiro do lançamento, se houver. Deixe 0 se não tem." placeholder="ex.: 0" />
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
            <MoneyField label="Valor" value={p.emprestimoValor} onChange={(v) => setP({ emprestimoValor: v })} help="Valor total do empréstimo que vai bancar o tráfego." placeholder="ex.: 150.000" />
            <MoneyField label="Parcela mensal" value={p.emprestimoParcela} onChange={(v) => setP({ emprestimoParcela: v })} help="Quanto você paga por mês desse empréstimo." placeholder="ex.: 9.000" />
            <MoneyField label="Juros estimado" value={p.emprestimoJuros} onChange={(v) => setP({ emprestimoJuros: v })} help="Total de juros que você vai pagar ao longo de todo o empréstimo." placeholder="ex.: 35.000" />
          </div>
        )}
        <p className="mt-3 text-[11px] text-gray-500">O fundo banca o tráfego nosso até esgotar.</p>
      </Card>

      <Card title={`Custo fixo por mês — total ${fmtBRL(custoTotal)}`}>
        <div className="grid grid-cols-2 gap-3">
          {state.custos.map((m) => (
            <MoneyField key={m.id} label={m.label} value={m.custoFixo} onChange={(v) => setMes(m.id, v)} help="Custo fixo total desse mês: salários, ferramentas, aluguel, pró-labore — tudo que sai independente de venda." placeholder="ex.: 38.000" />
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
          <MoneyField label="Alvo de crescimento/mês" value={escada.alvo} onChange={(v) => set({ alvo: v })} help="Quanto você quer que sobre no caixa por mês, DEPOIS de pagar todas as contas. É a meta de crescimento." placeholder="ex.: 30.000" />
          <MoneyField label="Custo fixo mensal" value={escada.custoFixo} onChange={(v) => set({ custoFixo: v })} help="Suas contas fixas do mês. Veio das Premissas (média dos meses) — ajuste se quiser simular outro valor." placeholder="ex.: 33.000" />
          <MoneyField label="Outras saídas" value={escada.outrasSaidas} onChange={(v) => set({ outrasSaidas: v })} help="Saídas do mês que não estão no custo fixo (imprevistos, investimentos pontuais)." placeholder="ex.: 5.000" />
          <MoneyField label="Entrada fixa mensal" value={escada.entradaFixa} onChange={(v) => set({ entradaFixa: v })} help="Entradas recorrentes do mês. Veio das Premissas — ajuste se quiser." placeholder="ex.: 32.000" />
          <NumField label="Nº de lançamentos/mês" value={escada.numLancamentos} onChange={(v) => set({ numLancamentos: Math.max(1, v) })} help="Quantos lançamentos você faz por mês." placeholder="ex.: 1" />
          <NumField label="ROAS" value={escada.roas} onChange={(v) => set({ roas: v })} step={0.1} help="Retorno do tráfego: pra cada R$ 1 de anúncio, quanto volta em venda. ROAS 3 = R$ 3 vendidos por R$ 1 investido." placeholder="ex.: 3" />
          <PercentField label="Desconto total" value={escada.descontoPct} onChange={(v) => set({ descontoPct: v })} help="Soma de todos os descontos sobre a receita (imposto + plataforma + comissões). Veio das Premissas." placeholder="ex.: 21" />
          <PercentField label="Nossa parte" value={escada.nossaPartePct} onChange={(v) => set({ nossaPartePct: v })} help="De cada venda, quanto fica com você. O resto vai pra sócios/parceiros do lançamento." placeholder="ex.: 70" />
          <PercentField label="Tráfego nosso" value={escada.trafegoNossaPct} onChange={(v) => set({ trafegoNossaPct: v })} help="Quanto do investimento em tráfego sai do SEU bolso. O resto o parceiro banca." placeholder="ex.: 70" />
          <PercentField label="% à vista" value={escada.pctAVista} onChange={(v) => set({ pctAVista: v })} help="Quanto de cada venda entra à vista no caixa. Veio das Premissas." placeholder="ex.: 70" />
          <PercentField label="Recuperação ingresso" value={escada.ingressoPct} onChange={(v) => set({ ingressoPct: v })} help="% do gasto com tráfego que você recupera vendendo ingresso/entrada paga no evento. Deixe 0 se o evento é gratuito." placeholder="ex.: 0" />
        </div>
      </Card>

      {/* Resultado principal */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`rounded-2xl border p-5 shadow-sm ${r.viavel ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
          <div className="text-xs text-gray-400">Investimento necessário (tráfego)</div>
          <div className="mt-1 text-2xl text-gray-100" style={DISPLAY}>{fmtBRL(r.investimento)}</div>
          <div className="mt-1 text-xs text-gray-500">para crescer {fmtBRL(escada.alvo)}/mês</div>
        </div>
        <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 shadow-sm">
          <div className="text-xs text-gray-400">Faturamento necessário</div>
          <div className="mt-1 text-2xl text-gray-100" style={DISPLAY}>{fmtBRL(r.faturamento)}</div>
          <div className="mt-1 text-xs text-gray-500">ROAS {escada.roas}× sobre o investimento</div>
        </div>
        <div className={`rounded-2xl border p-5 shadow-sm ${r.viavel ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
          <div className="text-xs text-gray-400">Eficiência (caixa por R$ investido)</div>
          <div className={`mt-1 text-2xl ${r.viavel ? 'text-emerald-400' : 'text-red-400'}`} style={DISPLAY}>
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
          <MoneyField label="Investimento simulado" value={escada.investimentoSimulado} onChange={(v) => set({ investimentoSimulado: v })} help="Um valor de tráfego pra ver o resultado detalhado: quanto vira faturamento, caixa imediato e o que sobra no ciclo." placeholder="ex.: 100.000" />
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

type Passo = 1 | 2;

const PASSOS: { n: Passo; label: string; emoji: string }[] = [
  { n: 1, label: 'Premissas & Custos', emoji: '⚙️' },
  { n: 2, label: 'Escada de Crescimento', emoji: '🪜' },
];

/** Indicador de progresso do passo a passo (numerado, com linha conectora). */
function Stepper({ passo, ir }: { passo: Passo; ir: (n: Passo) => void }) {
  return (
    <nav aria-label="Progresso do simulador" className="mb-6">
      <ol className="flex items-center gap-2">
        {PASSOS.map((p, i) => {
          const ativo = passo === p.n;
          const completo = passo > p.n;
          return (
            <Fragment key={p.n}>
              <li>
                <button
                  type="button"
                  onClick={() => ir(p.n)}
                  aria-current={ativo ? 'step' : undefined}
                  className="group flex items-center gap-2.5 rounded-xl py-1 text-left"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      ativo ? 'bg-blue-500 text-white' : completo ? 'bg-blue-500/20 text-blue-400' : 'border border-gray-600 text-gray-500'
                    }`}
                  >
                    {completo ? '✓' : p.n}
                  </span>
                  <span className={`hidden text-sm font-medium sm:inline ${ativo ? 'text-gray-100' : 'text-gray-400 group-hover:text-gray-200'}`}>
                    <span aria-hidden>{p.emoji}</span> {p.label}
                  </span>
                </button>
              </li>
              {i < PASSOS.length - 1 && (
                <li className="h-px flex-1 bg-gray-700/60" aria-hidden="true">
                  <div className={`h-px bg-blue-500/60 transition-all ${passo > p.n ? 'w-full' : 'w-0'}`} />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

function SimuladorBlock({ title, subtitle }: BlockProps) {
  const [state, setState] = useState<SimState>(() => loadState());
  const [passo, setPasso] = useState<Passo>(1);

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
    if (confirm('Restaurar o cenário-base? Suas alterações serão perdidas.')) {
      setState(seed());
      setPasso(1);
    }
  }

  /** Vai pra Escada herdando os valores das Premissas (o "depois" do fluxo). */
  function irParaEscada() {
    setState((s) => ({ ...s, escada: herdarDasPremissas(s) }));
    setPasso(2);
  }

  /** Navegação pelo stepper: ir pra Escada sempre re-herda o retrato atual. */
  const ir = (n: Passo) => (n === 2 ? irParaEscada() : setPasso(1));

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

      <Stepper passo={passo} ir={ir} />

      {passo === 1 ? (
        <>
          <PremissasTab state={state} set={set} />
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={irParaEscada}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              Continuar pra Escada →
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setPasso(1)}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-blue-500/40 hover:text-gray-100"
            >
              ← Voltar às Premissas
            </button>
            <p className="rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-[11px] leading-snug text-gray-300">
              💡 <span className="font-medium text-gray-200">% à vista, desconto, entrada fixa e custo fixo</span> vieram das suas Premissas — ajuste abaixo pra simular cenários.
            </p>
          </div>
          <EscadaTab escada={state.escada} set={setEscada} />
        </>
      )}
    </div>
  );
}

/** Definição registrável do bloco custom "Simulador". */
export const simulador: BlockDefinition = {
  type: 'custom:simulador',
  component: SimuladorBlock,
  defaultDataShape: 'raw',
};
