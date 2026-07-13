/**
 * apps/neurovida — extração de itens de fatura de cartão (PDF) por IA.
 *
 * Recebe o PDF em base64 + a chave BYOK do cliente e usa a Claude API (bloco
 * `document` + `tool_choice` forçado) para extrair CADA item: descrição, valor,
 * categoria e se é recorrente. Saída estruturada garantida pela tool — nada de
 * parsear texto solto. Não inventa itens: se o PDF não for uma fatura, retorna
 * `items` vazio. A chave vive só no servidor; nunca no bundle.
 */

import Anthropic from '@anthropic-ai/sdk';

/** Categorias FECHADAS (mesmas do bloco de Financeiro). */
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
  'Você recebeu o PDF de uma FATURA DE CARTÃO DE CRÉDITO (empresa de suplementos/saúde).',
  'Extraia TODOS os lançamentos de despesa: descrição, estabelecimento (se der), valor em reais, data (se houver).',
  'Para cada item, escolha a categoria mais adequada e marque se é um gasto RECORRENTE',
  '(assinatura/ferramenta/SaaS/plano mensal) ou pontual.',
  'Identifique a referência (mês/período) da fatura.',
  'NÃO invente lançamentos. Ignore pagamentos, estornos e créditos (valores negativos).',
  'Se o PDF não for uma fatura de cartão, chame a ferramenta com items vazio.',
  'Ao terminar, chame publish_invoice com a referência e os itens.',
].join('\n');

/** Extrai a fatura do PDF (base64) usando a chave BYOK do cliente. */
export async function extractInvoice(apiKey: string, pdfBase64: string): Promise<ExtractedInvoice> {
  const client = new Anthropic({ apiKey });

  const res = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8000,
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
  });

  const publish = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'publish_invoice',
  );
  if (!publish) {
    throw new Error('A IA não retornou a fatura estruturada. Tente novamente.');
  }

  const out = publish.input as ExtractedInvoice;
  // Saneamento leve: garante números positivos e categoria conhecida.
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
