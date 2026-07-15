/**
 * @os/server — motor DETERMINÍSTICO do "Resultado & Caixa" (painel do dono).
 *
 * Cruza as duas metades do P&L que o OS já tem:
 *   - RECEITA: Faturamento (Hotmart) — média dos últimos meses (líquido).
 *   - DESPESA: Fatura do cartão (recorrente/mês) + custos fixos FORA do cartão
 *     que o dono informa (pró-labore, aluguel, etc.) + saldo inicial de caixa.
 *
 * Calcula lucro, margem, break-even, runway e a PROJEÇÃO DE CAIXA de 12 meses.
 * Tudo em CÓDIGO (auditável, sem alucinação) — o agente financeiro apenas
 * INTERPRETA estes números; nunca os calcula. `financeOverviewToContext` serializa
 * o resultado para alimentar o agente.
 *
 * Modelo (v1, honesto e simples): receita e despesa projetadas CONSTANTES (sem
 * assumir crescimento). A tendência real aparece nos números do período.
 */

import type { InvoicesResponse } from './invoices';
import type { HotmartMetricsResponse } from './hotmart';

/** Premissas informadas pelo dono (o que o cartão não enxerga). */
export interface FinancePremissas {
  /** Saldo de caixa hoje (ponto de partida da projeção). */
  saldoInicial: number;
  /** Custos fixos mensais FORA do cartão (pró-labore, aluguel, impostos, etc.). */
  custosForaCartao: number;
  /** Receita mensal informada à mão — fallback quando não há Hotmart conectada. */
  receitaManual?: number;
}

export interface ProjecaoMes {
  /** Mês à frente (1..12). */
  i: number;
  receita: number;
  despesa: number;
  resultado: number;
  /** Caixa acumulado ao fim do mês. */
  caixa: number;
}

export interface FinanceOverview {
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
  /** Meses até o caixa zerar quando o resultado é negativo; null se positivo. */
  runwayMeses: number | null;
  saldoInicial: number;
  projecao: ProjecaoMes[];
  marcos: { m3: number; m6: number; m12: number };
  /** 1º mês (1-based) em que o caixa fica negativo; null se nunca. */
  apertaNoMes: number | null;
}

/** Custo recorrente MENSAL do cartão: assinaturas deduplicadas (valor mensal 1x). */
function monthlyRecurring(inv: InvoicesResponse): number {
  const map = new Map<string, number>();
  for (const invoice of inv.invoices) {
    for (const it of invoice.items) {
      if (!it.recurring) continue;
      const key = `${it.description}|${it.establishment ?? ''}`;
      map.set(key, Math.max(map.get(key) ?? 0, it.amount));
    }
  }
  let sum = 0;
  for (const v of map.values()) sum += v;
  return sum;
}

const avg = (nums: number[]): number => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Calcula o painel do dono a partir dos dados JÁ buscados. Puro/testável.
 * `hotmart` pode ser null (não conectada) → usa a receita manual das premissas.
 */
export function computeFinanceOverview(args: {
  invoices: InvoicesResponse;
  hotmart: HotmartMetricsResponse | null;
  premissas: FinancePremissas;
}): FinanceOverview {
  const { invoices, hotmart, premissas } = args;

  const despesaRecorrenteCartao = round2(monthlyRecurring(invoices));
  const custosForaCartao = Math.max(0, premissas.custosForaCartao || 0);
  const despesaFixaMes = round2(despesaRecorrenteCartao + custosForaCartao);

  // Receita: Hotmart (média dos últimos 3 meses, líquido) → senão manual → senão nada.
  const hmRows = hotmart?.rows ?? []; // ordenado do mais recente ao mais antigo
  const last3 = hmRows.slice(0, 3).map((r) => r.netRevenue);
  let fonteReceita: FinanceOverview['fonteReceita'] = 'nenhuma';
  let receitaMes = 0;
  let receitaAtual: number | null = null;
  let receitaAnterior: number | null = null;

  if (last3.length > 0 && last3.some((v) => v > 0)) {
    fonteReceita = 'hotmart';
    receitaMes = round2(avg(last3));
    receitaAtual = hmRows[0]?.netRevenue ?? null;
    receitaAnterior = hmRows[1]?.netRevenue ?? null;
  } else if (premissas.receitaManual && premissas.receitaManual > 0) {
    fonteReceita = 'manual';
    receitaMes = premissas.receitaManual;
  }

  const crescimentoPct =
    receitaAtual != null && receitaAnterior != null && receitaAnterior > 0
      ? Math.round(((receitaAtual - receitaAnterior) / receitaAnterior) * 1000) / 10
      : null;

  const lucroMes = round2(receitaMes - despesaFixaMes);
  const margemPct = receitaMes > 0 ? Math.round((lucroMes / receitaMes) * 1000) / 10 : null;
  const breakeven = despesaFixaMes;
  const saldoInicial = premissas.saldoInicial || 0;
  const runwayMeses = lucroMes >= 0 ? null : saldoInicial > 0 ? Math.floor(saldoInicial / -lucroMes) : 0;

  const projecao: ProjecaoMes[] = [];
  let caixa = saldoInicial;
  let apertaNoMes: number | null = null;
  for (let i = 1; i <= 12; i++) {
    caixa = round2(caixa + lucroMes);
    if (apertaNoMes === null && caixa < 0) apertaNoMes = i;
    projecao.push({ i, receita: receitaMes, despesa: despesaFixaMes, resultado: lucroMes, caixa });
  }

  return {
    fonteReceita,
    receitaMes,
    receitaAtual,
    receitaAnterior,
    crescimentoPct,
    despesaRecorrenteCartao,
    custosForaCartao,
    despesaFixaMes,
    lucroMes,
    margemPct,
    breakeven,
    runwayMeses,
    saldoInicial,
    projecao,
    marcos: { m3: projecao[2].caixa, m6: projecao[5].caixa, m12: projecao[11].caixa },
    apertaNoMes,
  };
}

const brl = (n: number): string => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Serializa o painel para o CONTEXTO do agente financeiro (que interpreta, não calcula). */
export function financeOverviewToContext(o: FinanceOverview): string {
  const linhas: string[] = [];
  linhas.push('RESULTADO & CAIXA (números calculados por código — use-os, não recalcule):');
  const fonte =
    o.fonteReceita === 'hotmart'
      ? 'Hotmart (média dos últimos meses, líquido)'
      : o.fonteReceita === 'manual'
        ? 'informada à mão pelo dono'
        : 'NÃO disponível (conecte a Hotmart ou informe a receita)';
  linhas.push(`- Receita mensal: ${brl(o.receitaMes)} (fonte: ${fonte}).`);
  if (o.crescimentoPct != null) linhas.push(`- Crescimento da receita vs. mês anterior: ${o.crescimentoPct}%.`);
  linhas.push(`- Despesa fixa mensal: ${brl(o.despesaFixaMes)} (cartão recorrente ${brl(o.despesaRecorrenteCartao)} + fora do cartão ${brl(o.custosForaCartao)}).`);
  linhas.push(`- Lucro mensal estimado: ${brl(o.lucroMes)}${o.margemPct != null ? ` (margem ${o.margemPct}%)` : ''}.`);
  linhas.push(`- Ponto de equilíbrio (receita p/ empatar): ${brl(o.breakeven)}/mês.`);
  linhas.push(`- Saldo de caixa hoje: ${brl(o.saldoInicial)}.`);
  if (o.runwayMeses != null) linhas.push(`- Runway: o caixa aguenta ~${o.runwayMeses} mês(es) no ritmo atual (resultado negativo).`);
  linhas.push(`- Projeção de caixa: em 3m ${brl(o.marcos.m3)}, 6m ${brl(o.marcos.m6)}, 12m ${brl(o.marcos.m12)}.`);
  if (o.apertaNoMes != null) linhas.push(`- ATENÇÃO: pela projeção, o caixa fica NEGATIVO a partir do mês ${o.apertaNoMes}.`);
  linhas.push('OBS: a projeção assume receita e despesa constantes (sem crescimento). É uma direção, não garantia.');
  return linhas.join('\n');
}
