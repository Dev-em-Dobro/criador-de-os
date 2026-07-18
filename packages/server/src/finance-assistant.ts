/**
 * @os/server — assistente de FINANÇAS pronto (consultor financeiro do negócio).
 *
 * Um `AssistantProvider` de fábrica: qualquer cliente com o módulo de faturas
 * ganha um copiloto financeiro registrando `makeFinanceAssistant(db)` em
 * `mountAssistant` (+ um `assistant` no manifesto com `contextKey: 'financas'`).
 *
 * Não é só "analista da fatura": lê faturamento (Hotmart ou informado), despesas
 * (fatura do cartão), margem/lucro e o caixa (motor "Resultado & Caixa"). A persona
 * (consultor sênior + método) e o resumo REAL das faturas (deduplicando assinaturas
 * mensais e, se o cliente informar `receitaMensal`, lendo margem) vivem aqui. O
 * formato de saída (resumo/secoes/acoes) é imposto pelo `mountAssistant`.
 */

import { makeInvoices } from './invoices';
import { makeHotmart } from './hotmart';
import type { HotmartMetricsResponse } from './hotmart';
import { computeFinanceOverview, financeOverviewToContext } from './finance-overview';
import type { ServerDb } from './db';
import type { AssistantProvider } from './assistant';
import type { InvoicesResponse } from './invoices';

/** Persona/método do consultor financeiro (instruções de domínio). */
export const FINANCE_PERSONA = [
  'Você é um consultor financeiro sênior de pequenos negócios — direto, honesto e prático.',
  'Olha o negócio como um TODO: faturamento, custos/despesas, margem, lucro e caixa —',
  'não apenas a fatura do cartão. Ajude o dono a ler a saúde financeira e a decidir com números.',
  '',
  '## De onde vêm os seus dados (e só fale do que existe)',
  '- FATURAMENTO: da Hotmart (se conectada) ou o valor informado à mão pelo dono.',
  '- DESPESAS: a fatura do cartão que o dono sobe (categorizadas e deduplicadas). É a parte',
  '  dos custos que passa NO CARTÃO — pode haver custos fora dele (pró-labore, aluguel, impostos)',
  '  que só entram se o dono informar (premissas do "Resultado & Caixa").',
  '- RESULTADO & CAIXA: o motor cruza receita × despesas e devolve lucro, margem, break-even,',
  '  runway e a projeção de caixa — números JÁ CALCULADOS por código.',
  '',
  '## Método',
  '- Comece pelo retrato de dono: faturamento, lucro e margem, e a leitura de caixa.',
  '- Nas despesas, classifique em 3 eixos: fixo×variável, essencial×discricionário, custo×investimento.',
  '- Diagnostique a estrutura: onde o dinheiro entra e sai? qual o peso fixo mensal? quanto da',
  '  receita (%) vira custo? o caixa aguenta o ritmo?',
  '- Priorize cortes por IMPACTO e RISCO: comece pelo discricionário e recorrente que rende pouco.',
  '  NUNCA sugira cortar cegamente o que GERA RECEITA (tráfego/anúncios) — meça o retorno antes.',
  '',
  '## Regras (inegociáveis)',
  '- Assinatura recorrente é MENSAL: a mesma em várias faturas = o MESMO serviço cobrado todo mês,',
  '  NUNCA duplicidade. Use a lista "ASSINATURAS RECORRENTES" (já contadas 1x).',
  '- "TOTAL DO PERÍODO" soma N meses; "CUSTO RECORRENTE MENSAL" é por mês — não confunda.',
  '- Corte = escolher da lista "ASSINATURAS RECORRENTES"; economia anual = valor mensal × 12.',
  '',
  '## Resultado & Caixa (quando o bloco aparece no contexto)',
  '- Ele traz números JÁ CALCULADOS por código: receita, lucro, margem, break-even, runway e a',
  '  projeção de caixa 3/6/12m. USE-OS como verdade — NUNCA recalcule nem invente projeção de caixa.',
  '- Se o caixa fica NEGATIVO em algum mês, esse é o alerta mais importante: destaque com a urgência',
  '  do prazo e priorize o que melhora o caixa (cortes + puxar receita).',
  '- Sem receita (nem Hotmart nem valor informado): diga que sem ela não dá pra ler lucro/caixa e',
  '  oriente a conectar a Hotmart ou informar o faturamento.',
  '',
  '## Honestidade (não invente dados)',
  '- Responda SÓ a partir do que está no contexto: faturamento (Hotmart/valor informado), despesas',
  '  do cartão e o "Resultado & Caixa". Nunca invente números, categorias ou projeções.',
  '- Quando o dado FALTAR, diga com franqueza e oriente o que fazer, em vez de chutar:',
  '  - despesas fora do cartão não informadas → o custo real pode ser maior; peça pró-labore/aluguel/',
  '    impostos nas premissas do "Resultado & Caixa".',
  '  - faturamento sem Hotmart e sem valor informado → não dá pra ler lucro/margem/caixa; oriente a',
  '    conectar a Hotmart ou informar a receita mensal.',
  '- Deixe claro o alcance: você enxerga faturamento, as despesas do CARTÃO e o resultado/caixa — não',
  '  a contabilidade completa. Fale de faturamento, despesas, margem e caixa ancorado nesses dados.',
  '',
  '## Como mapear na análise',
  '- resumo: retrato geral do negócio (faturamento, lucro/margem e a leitura de caixa, se houver receita).',
  '- secoes: "Destaques" (números que importam), "Resultado & Caixa" (lucro/margem/runway/projeção',
  '  quando houver) e "Alertas" (caixa apertando, categoria dominando, custo alto vs receita).',
  '- acoes: os cortes sugeridos (titulo = o que cortar; detalhe = "Economia ~R$X/ano — <trade-off>")',
  '  e, se o caixa aperta, as jogadas para aliviar o caixa no prazo.',
].join('\n');

/** Formata reais para o texto do resumo. */
function brl(n: number): string {
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Lê o faturamento informado (aceita "15000", "15.000", "R$ 15.000,00") → número. */
function parseReceita(s?: string): number | undefined {
  if (!s) return undefined;
  const limpo = s.trim().replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Valor BR opcional (saldo/custos) → número ≥ 0 (0 quando vazio/inválido). */
function parseAmount(s?: string): number {
  return parseReceita(s) ?? 0;
}

/**
 * Monta o resumo REAL das faturas. Deduplica assinaturas recorrentes (mostra o
 * valor MENSAL uma vez) e, com `receitaMensal`, calcula custos como % da receita.
 */
export function buildFinanceSummary(data: InvoicesResponse, receitaMensal?: number): string {
  const { invoices, totals } = data;
  const nFaturas = invoices.length;
  const categorias = Object.entries(totals.byCategory).sort((a, b) => b[1] - a[1]);
  const itens = invoices.flatMap((inv) => inv.items);
  const maiores = [...itens].sort((a, b) => b.amount - a.amount).slice(0, 40);

  const recMap = new Map<
    string,
    { description: string; establishment: string | null; category: string; monthly: number; meses: number }
  >();
  for (const it of itens) {
    if (!it.recurring) continue;
    const key = `${it.description}|${it.establishment ?? ''}`;
    const cur = recMap.get(key);
    if (cur) {
      cur.meses += 1;
      cur.monthly = Math.max(cur.monthly, it.amount);
    } else {
      recMap.set(key, {
        description: it.description,
        establishment: it.establishment,
        category: it.category,
        monthly: it.amount,
        meses: 1,
      });
    }
  }
  const recorrentes = [...recMap.values()].sort((a, b) => b.monthly - a.monthly).slice(0, 30);
  const mensalRecorrente = recorrentes.reduce((s, r) => s + r.monthly, 0);

  const referencias = invoices.map((i) => i.reference).filter(Boolean);
  const linhas: string[] = [];

  linhas.push(`PERÍODO: ${nFaturas} fatura(s)/mês(es)` + (referencias.length ? ` — ${referencias.join(', ')}` : '') + '.');
  linhas.push(`TOTAL DO PERÍODO (todas as faturas somadas): ${brl(totals.grand)}.`);
  linhas.push(`CUSTO RECORRENTE MENSAL (assinaturas contadas UMA vez): ${brl(mensalRecorrente)}/mês — repete todo mês.`);
  linhas.push(
    'NOTA IMPORTANTE: uma assinatura que aparece em várias faturas é o MESMO serviço cobrado ' +
      'mensalmente, NÃO é cobrança duplicada.',
  );

  if (receitaMensal && receitaMensal > 0) {
    const gastoMensalCartao = totals.grand / nFaturas;
    const pctRecorrente = (mensalRecorrente / receitaMensal) * 100;
    const pctCartao = (gastoMensalCartao / receitaMensal) * 100;
    linhas.push('');
    linhas.push(`RECEITA INFORMADA PELO CLIENTE: ${brl(receitaMensal)}/mês.`);
    linhas.push(`- Custo recorrente mensal (${brl(mensalRecorrente)}) = ${pctRecorrente.toFixed(0)}% da receita.`);
    linhas.push(`- Gasto médio do cartão por mês (${brl(gastoMensalCartao)}) = ${pctCartao.toFixed(0)}% da receita.`);
    linhas.push('- OBS: estes são só os custos que passam no CARTÃO; pode haver outros custos fora do cartão.');
  } else {
    linhas.push('');
    linhas.push(
      'RECEITA: não informada — a análise fica limitada aos CUSTOS do cartão (sem leitura de margem/' +
        'saúde). Convide o cliente a informar o faturamento mensal para uma análise completa.',
    );
  }

  linhas.push('');
  linhas.push('CUSTOS POR CATEGORIA (somando o período):');
  for (const [cat, val] of categorias) linhas.push(`- ${cat}: ${brl(val)}`);

  linhas.push('');
  linhas.push(`MAIORES LANÇAMENTOS INDIVIDUAIS do período (top ${maiores.length}):`);
  for (const it of maiores) {
    linhas.push(
      `- ${brl(it.amount)} · ${it.description}` +
        (it.establishment ? ` (${it.establishment})` : '') +
        ` · ${it.category}` +
        (it.recurring ? ' · assinatura mensal' : ''),
    );
  }

  if (recorrentes.length) {
    linhas.push('');
    linhas.push('ASSINATURAS RECORRENTES (candidatas a corte — VALOR MENSAL, cada uma contada 1x):');
    for (const r of recorrentes) {
      linhas.push(
        `- ${brl(r.monthly)}/mês · ${r.description}` +
          (r.establishment ? ` (${r.establishment})` : '') +
          ` · ${r.category}`,
      );
    }
  }

  return linhas.join('\n');
}

/**
 * Provedor de fábrica: lê as faturas do Neon + o RESULTADO & CAIXA (motor
 * determinístico: receita da Hotmart × despesa do cartão + premissas informadas)
 * e monta o contexto. O agente interpreta esses números — não os recalcula.
 *
 * `inputs`: `receitaMensal` (fallback se sem Hotmart), `saldoInicial`,
 * `custosForaCartao` (compartilhados com o painel "Resultado & Caixa"). Devolve
 * `null` (estado vazio) quando ainda não há faturas — sem gastar IA.
 */
export function makeFinanceAssistant(
  db: ServerDb,
  getSetting: (key: string) => Promise<string | null>,
): AssistantProvider {
  const invoices = makeInvoices(db);
  const hotmart = makeHotmart(db, getSetting);
  return {
    persona: FINANCE_PERSONA,
    async provide({ inputs }) {
      const data = await invoices.getInvoices();
      if (data.invoices.length === 0 || data.totals.grand <= 0) return null;

      let hm: HotmartMetricsResponse | null = null;
      try {
        hm = await hotmart.getMetrics();
      } catch {
        hm = null; // sem tabela/dados de Hotmart — cai na receita informada.
      }
      const overview = computeFinanceOverview({
        invoices: data,
        hotmart: hm,
        premissas: {
          saldoInicial: parseAmount(inputs.saldoInicial),
          custosForaCartao: parseAmount(inputs.custosForaCartao),
          receitaManual: parseReceita(inputs.receitaMensal),
        },
      });

      // A receita do resumo de custos = a mesma do painel (alinha os % de margem).
      const receitaSummary = overview.receitaMes > 0 ? overview.receitaMes : undefined;
      return `${buildFinanceSummary(data, receitaSummary)}\n\n${financeOverviewToContext(overview)}`;
    },
  };
}
