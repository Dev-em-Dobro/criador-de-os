/**
 * @os/server — copiloto de IA flutuante, GENÉRICO (primitivo da fábrica).
 *
 * `mountAssistant(app, {auth, resolveApiKey, providers})` expõe:
 *   POST /api/assistant/:key/analyze  → análise estruturada (resumo/secoes/acoes)
 *   POST /api/assistant/:key/chat     → resposta em texto (follow-up)
 * Auth-first + BYOK. A LÓGICA genérica (loop Claude, saída forçada, sanitização)
 * vive aqui, uma vez; cada domínio registra um `AssistantProvider` (persona +
 * provedor de contexto) por `contextKey` — o mesmo `contextKey` do manifesto.
 *
 * Modelos: o DIAGNÓSTICO (analyze) usa claude-opus-4-8 (caprichado, sob demanda);
 * o CHAT de follow-up usa claude-sonnet-4-6 (leve e rápido, resposta concisa). A
 * persona é do DOMÍNIO (server-side); o formato da saída é imposto aqui. Dado e
 * chave nunca saem do servidor.
 */

import type { Hono } from 'hono';
import Anthropic from '@anthropic-ai/sdk';
import type { AuthLike } from './mount';

export interface AssistantSection {
  titulo: string;
  itens: string[];
}
export interface AssistantAction {
  titulo: string;
  detalhe: string;
}
export interface AssistantAnalysis {
  resumo: string;
  secoes: AssistantSection[];
  acoes: AssistantAction[];
}
export interface AssistantChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Provedor de um assistente, registrado pelo app por `contextKey`. */
export interface AssistantProvider {
  /** Persona/método do agente (instruções de DOMÍNIO — vive server-side). */
  persona: string;
  /**
   * Constrói o CONTEXTO real (texto) que o agente analisa, a partir dos inputs do
   * usuário. Retorne `null` para sinalizar "ainda não há dados" (o front mostra o
   * estado vazio sem gastar IA).
   */
  provide: (args: { inputs: Record<string, string> }) => Promise<string | null>;
}

export interface AssistantDeps {
  auth: AuthLike;
  /** Resolve a chave da IA (BYOK do cliente com fallback da agência). */
  resolveApiKey: () => Promise<string | null>;
  /** Provedores por `contextKey` (o mesmo `contextKey` do manifesto). */
  providers: Record<string, AssistantProvider>;
}

/** Schema que força a análise estruturada genérica. */
const ANALYSIS_TOOL: Anthropic.Tool = {
  name: 'publish_analysis',
  description:
    'Publica a análise final e estruturada. Chame UMA vez, ao terminar. Baseie-se ' +
    'EXCLUSIVAMENTE nos dados fornecidos — nunca invente.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      resumo: { type: 'string', description: 'Visão geral em 1-2 frases.' },
      secoes: {
        type: 'array',
        description: 'Blocos temáticos (destaques, leituras, riscos...).',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            titulo: { type: 'string' },
            itens: { type: 'array', items: { type: 'string' } },
          },
          required: ['titulo', 'itens'],
        },
      },
      acoes: {
        type: 'array',
        description: 'Recomendações práticas priorizadas (título + detalhe).',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            titulo: { type: 'string' },
            detalhe: { type: 'string' },
          },
          required: ['titulo', 'detalhe'],
        },
      },
    },
    required: ['resumo', 'secoes', 'acoes'],
  },
};

function analysisPrompt(persona: string, contexto: string): string {
  return [
    persona,
    '',
    '## Formato da resposta (obrigatório)',
    'Baseie-se EXCLUSIVAMENTE nos dados reais abaixo — NUNCA invente números, itens ou fatos.',
    'Preencha:',
    '- resumo: 1-2 frases com o retrato geral.',
    '- secoes: blocos temáticos (título + itens curtos) — use para destaques, leituras e riscos.',
    '- acoes: recomendações práticas PRIORIZADAS (título + detalhe com o porquê/impacto).',
    'Linguagem acolhedora e sem jargão. Use R$ quando houver valores.',
    '',
    '## Dados reais',
    contexto,
    '',
    'Ao terminar, chame a ferramenta publish_analysis.',
  ].join('\n');
}

function chatSystem(persona: string, contexto: string): string {
  return [
    persona,
    '',
    'Responda de forma CURTA e direta — no máximo ~120 palavras, em 1 parágrafo curto ou',
    'até 3 bullets. Vá ao ponto; só aprofunde se o usuário pedir mais. Use R$ quando houver',
    'valores. Baseie-se EXCLUSIVAMENTE nos dados abaixo — não invente. Se faltar dado para',
    'responder bem, diga com honestidade e sugira o que informar/subir.',
    '',
    'DADOS REAIS:',
    contexto,
  ].join('\n');
}

/** Análise estruturada (saída forçada via tool, sem thinking — não conflita). */
export async function runAssistantAnalysis(
  apiKey: string,
  persona: string,
  contexto: string,
): Promise<AssistantAnalysis> {
  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8000,
    tools: [ANALYSIS_TOOL],
    tool_choice: { type: 'tool', name: 'publish_analysis' },
    messages: [{ role: 'user', content: analysisPrompt(persona, contexto) }],
  });
  const pub = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'publish_analysis',
  );
  if (!pub) throw new Error('O modelo não retornou a análise estruturada.');
  return pub.input as AssistantAnalysis;
}

/** Resposta de chat em texto — leve e rápida (Sonnet, sem thinking; contexto no system). */
export async function runAssistantChat(
  apiKey: string,
  persona: string,
  contexto: string,
  pergunta: string,
  historico: AssistantChatTurn[],
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const messages: Anthropic.MessageParam[] = [
    ...historico.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: pergunta },
  ];
  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    system: chatSystem(persona, contexto),
    messages,
  });
  const texto = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  return texto || 'Não consegui responder agora. Tente reformular a pergunta.';
}

function sanitizeInputs(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === 'string' && val.trim()) out[k] = val.trim();
    }
  }
  return out;
}

function sanitizeHistory(v: unknown): AssistantChatTurn[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(
      (m): m is AssistantChatTurn =>
        !!m &&
        typeof m === 'object' &&
        ((m as AssistantChatTurn).role === 'user' || (m as AssistantChatTurn).role === 'assistant') &&
        typeof (m as AssistantChatTurn).content === 'string',
    )
    .slice(-12);
}

/** Monta /api/assistant/:key/analyze e /chat no app. Auth-first + BYOK. */
export function mountAssistant(app: Hono, deps: AssistantDeps): void {
  const uid = async (headers: Headers): Promise<string | null> =>
    (await deps.auth.api.getSession({ headers }))?.user.id ?? null;

  app.post('/api/assistant/:key/analyze', async (c) => {
    if (!(await uid(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
    const provider = deps.providers[c.req.param('key')];
    if (!provider) return c.json({ error: 'Assistente desconhecido' }, 404);

    let inputs: Record<string, string> = {};
    try {
      const body = (await c.req.json()) as { inputs?: unknown };
      inputs = sanitizeInputs(body.inputs);
    } catch {
      inputs = {};
    }

    const apiKey = await deps.resolveApiKey();
    if (!apiKey) {
      return c.json({ error: 'Nenhuma chave de API configurada. Adicione a sua em Configurações.' }, 400);
    }

    try {
      const contexto = await provider.provide({ inputs });
      if (contexto == null) return c.json({ vazio: true, analise: null });
      const analise = await runAssistantAnalysis(apiKey, provider.persona, contexto);
      return c.json({ vazio: false, analise });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[assistant/analyze] erro:', msg); // não vaza a key
      return c.json({ error: msg }, 500);
    }
  });

  app.post('/api/assistant/:key/chat', async (c) => {
    if (!(await uid(c.req.raw.headers))) return c.json({ error: 'Não autenticado' }, 401);
    const provider = deps.providers[c.req.param('key')];
    if (!provider) return c.json({ error: 'Assistente desconhecido' }, 404);

    let body: { pergunta?: unknown; historico?: unknown; inputs?: unknown };
    try {
      body = (await c.req.json()) as typeof body;
    } catch {
      return c.json({ error: 'JSON inválido no corpo' }, 400);
    }
    const pergunta = typeof body.pergunta === 'string' ? body.pergunta.trim() : '';
    if (pergunta.length < 2) return c.json({ error: 'Escreva uma pergunta.' }, 400);
    const inputs = sanitizeInputs(body.inputs);
    const historico = sanitizeHistory(body.historico);

    const apiKey = await deps.resolveApiKey();
    if (!apiKey) {
      return c.json({ error: 'Nenhuma chave de API configurada. Adicione a sua em Configurações.' }, 400);
    }

    try {
      const contexto = (await provider.provide({ inputs })) ?? 'Ainda não há dados carregados nesta seção.';
      const resposta = await runAssistantChat(apiKey, provider.persona, contexto, pergunta, historico);
      return c.json({ resposta });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[assistant/chat] erro:', msg); // não vaza a key
      return c.json({ error: msg }, 500);
    }
  });
}
