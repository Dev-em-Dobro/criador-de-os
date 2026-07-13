/**
 * @os/server — extração de itens de fatura de cartão (PDF) por IA (genérico).
 *
 * Recebe PDF em base64 + a chave BYOK do cliente e usa a Claude API (bloco
 * `document` + `tool_choice` forçado) para extrair CADA item categorizado. Saída
 * estruturada garantida pela tool. Não inventa: `items` vazio se não for fatura.
 */

import Anthropic from '@anthropic-ai/sdk';

export const INVOICE_CATEGORIES = [
  'Ferramentas',
  'Tráfego',
  'Fornecedores',
  'Logística',
  'Serviços',
  'Impostos',
  'Outros',
] as const;

export interface ExtractedItem {
  description: string;
  establishment?: string;
  amount: number;
  date?: string;
  category: string;
  recurring: boolean;
}
export interface ExtractedInvoice {
  reference: string;
  items: ExtractedItem[];
}

const PUBLISH_TOOL: Anthropic.Tool = {
  name: 'publish_invoice',
  description:
    'Publica a fatura extraída de forma estruturada. Chame UMA vez com a ' +
    'referência (mês/período) e TODOS os itens de despesa da fatura.',
  input_schema: {
    type: 'object',
    properties: {
      reference: {
        type: 'string',
        description: 'Mês/período de referência da fatura (ex.: "Julho/2026") ou a data de fechamento/vencimento.',
      },
      items: {
        type: 'array',
        description: 'Todos os lançamentos de DESPESA da fatura (ignore pagamentos/estornos/créditos).',
        items: {
          type: 'object',
          properties: {
            description: { type: 'string', description: 'Descrição do lançamento (como aparece na fatura).' },
            establishment: { type: 'string', description: 'Estabelecimento/loja, se identificável.' },
            amount: { type: 'number', description: 'Valor em reais (BRL), positivo.' },
            date: { type: 'string', description: 'Data da compra, se houver.' },
            category: {
              type: 'string',
              enum: [...INVOICE_CATEGORIES],
              description: 'Categoria do gasto (escolha a mais adequada).',
            },
            recurring: {
              type: 'boolean',
              description: 'true se for assinatura/ferramenta recorrente (SaaS, plano mensal); false se for compra pontual.',
            },
          },
          required: ['description', 'amount', 'category', 'recurring'],
        },
      },
    },
    required: ['reference', 'items'],
  },
};

const PROMPT = [
  'O PDF anexado é uma FATURA DE CARTÃO DE CRÉDITO (pode ter VÁRIAS páginas e mais de um cartão).',
  'Percorra TODAS as páginas e extraia CADA lançamento de DESPESA/COMPRA (inclusive parcelas',
  '"Parcela X de Y" e IOF), com descrição, estabelecimento (se der), valor em reais e data (se houver).',
  'Para cada item, escolha a categoria mais adequada e marque se é RECORRENTE (assinatura/ferramenta/',
  'SaaS/plano mensal) ou pontual.',
  'IGNORE apenas pagamentos, estornos e créditos (linhas com valor a CRÉDITO, geralmente com "+").',
  'Identifique a referência (mês/período) da fatura.',
  'NÃO invente nem resuma: liste TODOS os lançamentos que você conseguir ler, sem omitir nenhum.',
  'Só chame com items vazio se o PDF realmente não for uma fatura de cartão.',
  'Ao terminar, chame publish_invoice com a referência e TODOS os itens.',
].join('\n');

/**
 * Robustez: alguns downloads de fatura vêm com LIXO (bytes nulos/cabeçalho) antes
 * do `%PDF` — a Anthropic recusa como "PDF inválido". Corta tudo antes do `%PDF`.
 */
function sanitizePdfBase64(pdfBase64: string): string {
  const buf = Buffer.from(pdfBase64, 'base64');
  const start = buf.indexOf('%PDF');
  return start > 0 ? buf.subarray(start).toString('base64') : pdfBase64;
}

/** Extrai a fatura do PDF (base64) usando a chave BYOK do cliente. */
export async function extractInvoice(apiKey: string, pdfBase64Raw: string): Promise<ExtractedInvoice> {
  const client = new Anthropic({ apiKey });
  const pdfBase64 = sanitizePdfBase64(pdfBase64Raw);

  // Faturas com muitas páginas geram MUITOS itens → a saída estruturada pode ser
  // grande. Streaming + max_tokens alto evitam truncar (e timeouts de HTTP).
  const res = await client.messages
    .stream({
      model: 'claude-opus-4-8',
      max_tokens: 32000,
      tools: [PUBLISH_TOOL],
      tool_choice: { type: 'tool', name: 'publish_invoice' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    })
    .finalMessage();

  const publish = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'publish_invoice',
  );
  if (!publish) {
    if (res.stop_reason === 'max_tokens') {
      throw new Error('A fatura é muito grande e a leitura foi cortada. Tente uma fatura por vez.');
    }
    throw new Error('A IA não retornou a fatura estruturada. Tente novamente.');
  }

  const out = publish.input as ExtractedInvoice;
  const known = new Set<string>(INVOICE_CATEGORIES);
  const items = (out.items ?? [])
    .map((it) => ({
      description: String(it.description ?? '').slice(0, 300),
      establishment: it.establishment ? String(it.establishment).slice(0, 200) : undefined,
      amount: Math.abs(Number(it.amount) || 0),
      date: it.date ? String(it.date).slice(0, 40) : undefined,
      category: known.has(it.category) ? it.category : 'Outros',
      recurring: Boolean(it.recurring),
    }))
    .filter((it) => it.amount > 0 && it.description.length > 0);

  return { reference: String(out.reference ?? '').slice(0, 80) || 'Fatura', items };
}
