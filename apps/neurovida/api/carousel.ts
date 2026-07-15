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
 * Modelo: claude-opus-4-8 (mais capaz) + adaptive thinking. A API key (BYOK — a
 * chave do próprio cliente, guardada cifrada em Configurações) chega por parâmetro
 * e vive só no servidor; nunca no bundle.
 */

import Anthropic from '@anthropic-ai/sdk';

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
  /** Legenda (caption) do post — texto + chamada pra ação. */
  legenda: string;
  /** Hashtags (sem o #). */
  hashtags: string[];
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
      legenda: {
        type: 'string',
        description:
          'Legenda (caption) do post do Instagram: 2 a 4 frases acolhedoras + uma ' +
          'chamada pra ação suave. NÃO inclua hashtags aqui (elas vão em "hashtags").',
      },
      hashtags: {
        type: 'array',
        description: '5 a 8 hashtags relevantes, SEM o "#" (só a palavra).',
        items: { type: 'string' },
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
    required: ['titulo', 'slides', 'legenda', 'hashtags', 'fontes'],
  },
};

/**
 * Prompt do roteirista. Incorpora o framework de conteúdo do @carousel-designer
 * (AIDA + capa-gancho + slide 3 de engajamento). É GENÉRICO/independente de marca:
 * o conteúdo NÃO cita nenhuma empresa/produto — serve pra qualquer perfil.
 */
function buildPrompt(tema: string, slides: number): string {
  return [
    'Você é um roteirista sênior de carrosséis de Instagram para uma criadora de',
    'conteúdo de saúde e bem-estar (público leigo). Escreva o ROTEIRO completo de um',
    `carrossel de ${slides} slides sobre o tema: "${tema}".`,
    '',
    '## Framework AIDA (OBRIGATÓRIO, nesta ordem — nunca pule uma etapa)',
    'O carrossel inteiro segue AIDA — Atenção → Interesse → Desejo → Ação:',
    '- SLIDE 1 (CAPA = Atenção): um GANCHO forte e provocativo — uma afirmação ousada,',
    '  contra-intuitiva ou uma pergunta que faz parar o scroll. Título curto e impactante',
    '  (o corpo pode ser 1 frase curta ou vazio). NÃO é uma descrição neutra: é um gancho.',
    '- SLIDES DO MEIO INICIAL (Interesse): nomeie o problema, a dúvida ou a situação do',
    '  público — o "por que isso importa pra VOCÊ". Faça a pessoa querer continuar arrastando.',
    '- SLIDES DO MEIO FINAL (Desejo): entregue o valor — o que a ciência mostra, os',
    '  benefícios, a transformação. Conecte cada ponto a um benefício concreto + evidência.',
    '- ÚLTIMO SLIDE (Ação): UMA chamada pra ação clara e suave (ex.: consultar um',
    '  profissional de saúde; salvar o post pra consultar depois).',
    '',
    '## Slide 3 — engajamento (OBRIGATÓRIO)',
    'O slide 3 pede UMA micro-ação pro algoritmo: SALVAR (padrão pra conteúdo educativo),',
    'CURTIR ou SEGUIR — escolha conforme o conteúdo. NÃO substitui o CTA do último slide.',
    '',
    '## Regras de conteúdo',
    '- Público leigo: linguagem acessível, acolhedora, sem jargão.',
    '- EVIDÊNCIA CIENTÍFICA CONFIÁVEL: use a ferramenta de busca para achar fontes reais',
    '  (priorize revisões e artigos indexados no PubMed). NUNCA invente estudos nem cite',
    '  fontes que você não verificou na busca.',
    '- Cada slide: um título curto e chamativo + um corpo de 1 a 2 frases.',
    '- Inclua um lembrete de que o conteúdo é educativo e não substitui orientação profissional.',
    '- NÃO cite nenhuma marca, empresa ou produto específico — nem nos slides, nem no CTA,',
    '  nem na legenda. O conteúdo é da própria criadora, genérico e independente de marca.',
    '- Escreva também a LEGENDA (caption) do post: 2 a 4 frases acolhedoras + uma chamada',
    '  pra ação, e de 5 a 8 HASHTAGS relevantes (sem o "#").',
    '',
    'Ao terminar, chame a ferramenta publish_carousel com o título, os slides (na ordem',
    'AIDA), a legenda, as hashtags e as fontes REAIS (título + URL). Não escreva o',
    'carrossel como texto solto.',
  ].join('\n');
}

/**
 * Gera o carrossel. Roda um loop de tool use: `web_search` executa no servidor
 * da Anthropic (pode gerar `pause_turn`, que apenas continuamos); quando o modelo
 * chama `publish_carousel`, capturamos o input estruturado e retornamos.
 */
export async function generateCarousel(
  tema: string,
  slides = 6,
  apiKey: string,
): Promise<CarouselResult> {
  const client = new Anthropic({ apiKey });

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
