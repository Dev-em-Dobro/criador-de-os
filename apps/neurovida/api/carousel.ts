/**
 * apps/neurovida — "agente" gerador de carrossel científico (item 5 do relatório).
 *
 * NÃO é um agente do AIOX (aqueles são de desenvolvimento, rodam na CLI). É uma
 * AÇÃO DE IA do produto: o operador pede um tema pelo painel e a Claude API gera
 * um carrossel de Instagram embasado em EVIDÊNCIA REAL.
 *
 * Como a "fonte confiável + revisor" do relatório é implementada:
 *  - `web_search` (server-side da Anthropic) faz a busca de verdade e retorna
 *    resultados com URLs reais — nada é inventado pelo modelo.
 *  - a instrução proíbe citar o que não foi verificado na busca (o "revisor").
 *  - a tool `publish_carousel` FORÇA a saída estruturada (slides + fontes), então
 *    não dependemos de parsear texto solto.
 *
 * Modelo: claude-opus-4-8 (mais capaz) + adaptive thinking. A API key vive só no
 * servidor (env), nunca no bundle.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicKey } from './env';

export interface CarouselSlide {
  titulo: string;
  corpo: string;
}

export interface CarouselFonte {
  titulo: string;
  url: string;
}

export interface CarouselResult {
  titulo: string;
  slides: CarouselSlide[];
  fontes: CarouselFonte[];
}

/** Schema da tool que o modelo chama para "publicar" o carrossel estruturado. */
const PUBLISH_TOOL: Anthropic.Tool = {
  name: 'publish_carousel',
  description:
    'Publica o carrossel final estruturado. Chame UMA vez, ao terminar, com o ' +
    'título, os slides e as fontes REAIS (título + URL) verificadas na busca.',
  input_schema: {
    type: 'object',
    properties: {
      titulo: { type: 'string', description: 'Título do carrossel' },
      slides: {
        type: 'array',
        description: 'Os slides, em ordem.',
        items: {
          type: 'object',
          properties: {
            titulo: { type: 'string', description: 'Título curto e chamativo do slide' },
            corpo: { type: 'string', description: 'Corpo do slide (1-2 frases, linguagem acessível)' },
          },
          required: ['titulo', 'corpo'],
        },
      },
      fontes: {
        type: 'array',
        description: 'Fontes reais usadas (nunca inventadas).',
        items: {
          type: 'object',
          properties: {
            titulo: { type: 'string', description: 'Título/descrição da fonte' },
            url: { type: 'string', description: 'URL real da fonte (verificada na busca)' },
          },
          required: ['titulo', 'url'],
        },
      },
    },
    required: ['titulo', 'slides', 'fontes'],
  },
};

function buildPrompt(tema: string, slides: number): string {
  return [
    'Você é o estúdio de conteúdo da Neurovida, uma marca de suplementos e cursos de saúde.',
    `Crie um carrossel de Instagram (${slides} slides) sobre o tema: "${tema}".`,
    '',
    'Regras:',
    '- Público leigo (não técnico): linguagem acessível, acolhedora, sem jargão.',
    '- Baseie-se em EVIDÊNCIA CIENTÍFICA CONFIÁVEL. Use a ferramenta de busca para',
    '  encontrar fontes reais (priorize revisões e artigos indexados no PubMed).',
    '  NUNCA invente estudos nem cite fontes que você não verificou na busca.',
    '- Cada slide: um título curto e chamativo + um corpo de 1 a 2 frases.',
    '- Slide 1 = gancho que prende a atenção. Último slide = chamada de ação suave',
    '  (ex.: consultar um profissional / conhecer a Neurovida).',
    '- Inclua um lembrete de que o conteúdo é educativo e não substitui orientação profissional.',
    '',
    'Ao terminar, chame a ferramenta publish_carousel com o título, os slides e as',
    'fontes REAIS (título + URL) que você usou. Não escreva o carrossel como texto solto.',
  ].join('\n');
}

/**
 * Gera o carrossel. Roda um loop de tool use: `web_search` executa no servidor
 * da Anthropic (pode gerar `pause_turn`, que apenas continuamos); quando o modelo
 * chama `publish_carousel`, capturamos o input estruturado e retornamos.
 */
export async function generateCarousel(tema: string, slides = 6): Promise<CarouselResult> {
  const client = new Anthropic({ apiKey: getAnthropicKey() });

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: buildPrompt(tema, slides) },
  ];

  // Limite de segurança de iterações (web search + publicação cabem com folga).
  for (let i = 0; i < 8; i++) {
    const res = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 12000,
      thinking: { type: 'adaptive' },
      tools: [{ type: 'web_search_20260209', name: 'web_search' }, PUBLISH_TOOL],
      messages,
    });

    // Loop de tool server-side (web search) atingiu o limite → reenvie para retomar.
    if (res.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: res.content });
      continue;
    }

    // O modelo publicou o carrossel?
    const publish = res.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'publish_carousel',
    );
    if (publish) {
      return publish.input as CarouselResult;
    }

    if (res.stop_reason === 'end_turn') {
      const texto = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .slice(0, 300);
      throw new Error(
        `O modelo terminou sem publicar o carrossel estruturado.${texto ? ` Resposta: ${texto}` : ''}`,
      );
    }

    // Qualquer outra parada (ex.: refusal) — reporta.
    if (res.stop_reason === 'refusal') {
      throw new Error('O modelo recusou gerar este conteúdo. Ajuste o tema.');
    }

    // Continua o loop (defensivo).
    messages.push({ role: 'assistant', content: res.content });
  }

  throw new Error('Excedeu o limite de iterações sem publicar o carrossel.');
}
