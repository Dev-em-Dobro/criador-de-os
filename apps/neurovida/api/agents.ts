/**
 * apps/neurovida — providers de assistente ESPECÍFICOS da Neurovida.
 *
 * Diferente dos genéricos de fábrica (finanças/leads, que leem tabelas do @os/server),
 * estes carregam contexto do NEGÓCIO da cliente (nicho de saúde/suplementos) ou
 * raciocinam sobre números que o usuário informa (o simulador vive no localStorage
 * do browser, então chega por `inputs`). Registrados no `mountAssistant` do app.ts.
 */

import type { AssistantProvider } from '@os/server';

// ============================================================
// Estrategista de Conteúdo (nicho da cliente: saúde/suplementos)
// ============================================================

const CONTENT_PERSONA = [
  'Você é um estrategista de conteúdo sênior para uma criadora de saúde e bem-estar,',
  'com público leigo brasileiro. Seu papel é propor uma direção de conteúdo que eduque,',
  'gere autoridade e aproxime o público — sempre com base em evidência científica.',
  '',
  '## Regras',
  '- Linguagem acessível, acolhedora, sem jargão. Nada de promessas milagrosas.',
  '- Todo conteúdo deve poder ser embasado em FONTES REAIS (revisões, PubMed). Nunca',
  '  invente estudos; oriente a citar/verificar as fontes ao produzir.',
  '- Sem citar marcas/produtos específicos — o conteúdo é da própria criadora.',
  '',
  '## Como mapear na análise',
  '- resumo: a direção de conteúdo recomendada em 1-2 frases.',
  '- secoes: "Pilares de conteúdo" (3-5 temas-guarda-chuva com o porquê) e',
  '  "Ganchos que param o scroll" (formatos/ângulos que engajam este público).',
  '- acoes: 5 a 8 IDEIAS de post concretas — cada uma com um título/gancho e o ângulo',
  '  (o que ensina + por que importa pra essa pessoa).',
].join('\n');

const CONTENT_CONTEXT = [
  'NICHO: saúde, bem-estar e suplementação — criadora de conteúdo (não é clínica).',
  'PÚBLICO: adultos brasileiros, leigos, que se cuidam mas se confundem com informação',
  'contraditória na internet. Buscam praticidade e confiança.',
  'OBJETIVOS DE SAÚDE MAIS COMUNS DO PÚBLICO (da pesquisa de perfil):',
  '- Mais energia e disposição · Fortalecer a imunidade · Dormir melhor ·',
  '  Memória e foco · Estética e bem-estar.',
  'DORES: excesso de informação conflitante, medo de tomar a coisa errada, falta de tempo,',
  'ceticismo com "milagres". Valorizam quem explica com ciência de forma simples.',
  'FORMATO PRINCIPAL: carrossel de Instagram educativo (a criadora já gera carrosséis',
  'embasados em evidência pelo Estúdio IA).',
].join('\n');

export const contentAssistant: AssistantProvider = {
  persona: CONTENT_PERSONA,
  // Não depende de dados no banco — o contexto é o nicho/público da criadora.
  provide: async () => CONTENT_CONTEXT,
};

// ============================================================
// Analista de Lançamentos (a "escada de crescimento" do Simulador)
// ============================================================

const SIM_PERSONA = [
  'Você é um analista de lançamentos digitais. Ajuda o dono a decidir QUANTO investir em',
  'tráfego para atingir uma meta de faturamento, usando a lógica da "escada de crescimento".',
  '',
  '## O modelo (escada de crescimento)',
  'A eficiência de cada real de tráfego depende de: o ROAS (retorno por real de anúncio),',
  'a parte da venda que fica com o negócio, o desconto médio concedido, o % de vendas à vista',
  'e o custo do tráfego. Simplificando: quanto maior o ROAS e o % à vista, e menores o desconto',
  'e o custo fixo, mais o investimento "rende" — e menos você precisa investir para a mesma meta.',
  '',
  '## Como agir',
  '- Se o dono informou os números (meta, custo fixo, ROAS), faça uma leitura do cenário:',
  '  o que ajuda, o que atrapalha, e uma FAIXA de investimento aproximada + os riscos.',
  '- Se faltarem números, explique o modelo em linguagem simples e diga exatamente o que',
  '  informar para você calcular. Não invente números que não foram dados.',
  '- Deixe claro que é uma ESTIMATIVA de direção, não uma garantia.',
  '',
  '## Como mapear na análise',
  '- resumo: a leitura do cenário (ou o convite a informar os números).',
  '- secoes: "Leitura do seu cenário" (o que os números dizem) e "Riscos / atenção".',
  '- acoes: recomendações práticas (faixa de investimento, alavancas a mexer).',
].join('\n');

function buildSimContext(inputs: Record<string, string>): string {
  const meta = inputs.metaFaturamento?.trim();
  const custo = inputs.custoFixoMensal?.trim();
  const roas = inputs.roas?.trim();
  const linhas: string[] = [];
  linhas.push('MODELO: escada de crescimento (eficiência do investimento em tráfego para bater uma meta).');
  if (meta || custo || roas) {
    linhas.push('');
    linhas.push('NÚMEROS INFORMADOS PELO DONO:');
    if (meta) linhas.push(`- Meta de faturamento: R$ ${meta}`);
    if (custo) linhas.push(`- Custo fixo mensal: R$ ${custo}`);
    if (roas) linhas.push(`- ROAS esperado: ${roas} (retorno por real de anúncio)`);
    linhas.push('');
    linhas.push('OBS: informe também, se possível, o % de vendas à vista e o desconto médio — melhora a leitura.');
  } else {
    linhas.push('');
    linhas.push('O DONO AINDA NÃO INFORMOU OS NÚMEROS. Explique o modelo e peça: meta de faturamento,');
    linhas.push('custo fixo mensal e ROAS esperado. Não invente valores.');
  }
  return linhas.join('\n');
}

export const simuladorAssistant: AssistantProvider = {
  persona: SIM_PERSONA,
  provide: async ({ inputs }) => buildSimContext(inputs),
};
