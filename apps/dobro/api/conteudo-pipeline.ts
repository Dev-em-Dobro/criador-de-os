/**
 * apps/dobro — Pipeline "referência → rascunho" (AI action de PRODUTO, server-side).
 *
 * Fecha o ciclo do módulo de Conteúdo: gera um post ORIGINAL em AIDA (carrossel
 * OU reels) a partir de uma `referencia` pendente (capturada pelo Telegram) OU de
 * um tema livre, e grava um `conteudo_posts` com estado 'rascunho'.
 *
 * Segue o padrão da ação "Estúdio IA" (apps/neurovida/api/carousel.ts):
 *  - `@anthropic-ai/sdk`, modelo claude-opus-4-8 + adaptive thinking;
 *  - saída ESTRUTURADA forçada por uma tool (`publish_draft`) — sem parsear texto;
 *  - a API key (BYOK/agência) chega por parâmetro e vive só no servidor.
 *
 * O `database` é INJETADO: o script admin passa o client OWNER; o endpoint
 * `/api/conteudo/gerar` passa `dbPipeline` (role `app_pipeline`, menor privilégio).
 */

import Anthropic from '@anthropic-ai/sdk';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { referencias, conteudoPosts } from '../db/schema';
import { fetchInstagramContent } from './instagram';

/** Client Drizzle (owner OU role de menor privilégio) — injetado nas escritas. */
type Database = typeof db;

export interface SlideCarrossel {
  titulo: string;
  corpo: string;
}
export interface CenaReels {
  /** Janela de tempo, ex.: '0-3s'. */
  tempo: string;
  /** Fala/narração. */
  fala: string;
  /** Texto na tela. */
  texto_tela: string;
}

/** Saída estruturada que a Claude devolve via a tool `publish_draft`. */
export interface DraftResult {
  analise: string;
  formato: 'carrossel' | 'reels';
  titulo: string;
  gancho: string;
  slides?: SlideCarrossel[];
  cenas?: CenaReels[];
  legenda: string;
  hashtags: string[];
  cta_final: string;
  capa_brief: string;
}

/** O que o pipeline precisa saber de uma referência para gerar o rascunho. */
export interface RefInput {
  origemUrl: string | null;
  conteudoBruto: string | null;
  notaTime: string | null;
  formatoRef: string | null;
  /** Métricas conhecidas da referência (ex.: "1200 curtidas · 45 comentários"). */
  metricas?: string | null;
}

/** Entrada da geração: a partir de uma referência OU de um tema livre. */
export interface GerarInput {
  referencia?: RefInput | null;
  tema?: string | null;
}

/** Tool que FORÇA a saída estruturada do post (o modelo a chama ao terminar). */
const PUBLISH_TOOL: Anthropic.Tool = {
  name: 'publish_draft',
  description:
    'Publica o rascunho final estruturado. Chame UMA vez, ao terminar, com a ' +
    'análise e o post original em AIDA. Preencha SÓ `slides` (se carrossel) OU ' +
    '`cenas` (se reels), conforme o `formato`.',
  input_schema: {
    type: 'object',
    properties: {
      analise: {
        type: 'string',
        description:
          'Teardown curto: por que a referência provavelmente foi bem (gancho, ' +
          'promessa, gatilho, estrutura). Se for post a partir de tema livre, ' +
          'escreva 1 frase dizendo isso e o ângulo escolhido.',
      },
      formato: { type: 'string', enum: ['carrossel', 'reels'], description: 'Formato do NOSSO post.' },
      titulo: { type: 'string', description: 'Título curto do post (para o board).' },
      gancho: { type: 'string', description: 'A capa/abertura: gancho forte que faz parar o scroll.' },
      slides: {
        type: 'array',
        description: 'Se CARROSSEL: 6 a 8 slides na ordem AIDA. Vazio se reels.',
        items: {
          type: 'object',
          properties: {
            titulo: { type: 'string', description: 'Título curto do slide.' },
            corpo: { type: 'string', description: 'Corpo de 1 a 2 frases.' },
          },
          required: ['titulo', 'corpo'],
        },
      },
      cenas: {
        type: 'array',
        description: 'Se REELS: 4 a 7 cenas com o gancho nos primeiros 3s. Vazio se carrossel.',
        items: {
          type: 'object',
          properties: {
            tempo: { type: 'string', description: "Janela, ex.: '0-3s'." },
            fala: { type: 'string', description: 'Fala/narração da cena.' },
            texto_tela: { type: 'string', description: 'Texto na tela.' },
          },
          required: ['tempo', 'fala', 'texto_tela'],
        },
      },
      legenda: { type: 'string', description: 'Legenda: 2-4 frases + CTA suave. SEM hashtags aqui.' },
      hashtags: { type: 'array', items: { type: 'string' }, description: '5 a 8 hashtags, SEM o "#".' },
      cta_final: { type: 'string', description: 'A frase final de chamada pra ação.' },
      capa_brief: { type: 'string', description: 'Brief da imagem de capa ideal (1-2 frases).' },
    },
    required: ['analise', 'formato', 'titulo', 'gancho', 'legenda', 'hashtags', 'cta_final', 'capa_brief'],
  },
};

/** Bloco de regras AIDA comum aos dois modos (referência e tema). */
const REGRAS_AIDA = [
  '- `gancho`: a capa/abertura — afirmação ousada, contra-intuitiva ou pergunta',
  '  que faz parar o scroll.',
  '- Se CARROSSEL: preencha `slides` (6 a 8), cada um {titulo curto, corpo 1-2',
  '  frases}, na ordem AIDA: slide 1 = gancho (Atenção); meio inicial = Interesse',
  '  (o problema do público); meio final = Desejo (valor/transformação); último',
  '  = Ação (CTA).',
  '- Se REELS: preencha `cenas` (4 a 7), cada uma {tempo, fala, texto_tela}, com o',
  '  gancho nos primeiros 3s e ritmo de retenção.',
  '- `legenda`: 2 a 4 frases + chamada pra ação suave (sem hashtags aqui).',
  '- `hashtags`: 5 a 8, sem "#".',
  '- `cta_final`: a frase final de chamada pra ação.',
  '- `capa_brief`: 1-2 frases descrevendo a imagem de capa ideal (para designer/IA).',
  '',
  'OBRIGATÓRIO: o array (`slides` no carrossel, `cenas` no reels) NUNCA pode vir',
  'vazio — é o conteúdo principal do post. Preencha TODOS os itens.',
  '',
  'Ao terminar, chame `publish_draft` UMA vez com todos os campos. Preencha SÓ',
  '`slides` OU `cenas`, conforme o formato. Não escreva o post como texto solto.',
];

function buildPrompt(input: GerarInput): string {
  const ref = input.referencia;
  if (ref) {
    return [
      'Você é um estrategista sênior de conteúdo para Instagram. Recebeu uma',
      'REFERÊNCIA (um post que foi bem) e vai: (1) analisar POR QUE ela',
      'provavelmente performou e (2) criar um post ORIGINAL nosso — inspirado,',
      'NUNCA cópia — no mesmo tema/nicho, estruturado em AIDA.',
      '',
      '## Referência',
      `- Link: ${ref.origemUrl ?? '(não informado)'}`,
      `- Formato detectado: ${ref.formatoRef ?? 'indefinido'}`,
      `- Texto/legenda capturada: ${ref.conteudoBruto ?? '(não disponível)'}`,
      `- Nota de quem indicou: ${ref.notaTime ?? '(nenhuma)'}`,
      `- Métricas conhecidas: ${ref.metricas ?? '(não disponíveis)'}`,
      '',
      '## Passo 1 — Análise "por que foi bem" (campo `analise`)',
      'Teardown curto e objetivo: gancho, promessa, gatilho (curiosidade, medo,',
      'ganho, prova social...), estrutura e por que prende. Se faltar dado da',
      'referência, infira pelo tema/nota e deixe claro que é hipótese.',
      '',
      "## Passo 2 — Decida o FORMATO do nosso (`formato`: 'carrossel' | 'reels')",
      'Por padrão mantenha o formato da referência; adapte só se houver razão clara.',
      '',
      '## Passo 3 — Crie o post em AIDA (original, não copie)',
      ...REGRAS_AIDA,
    ].join('\n');
  }

  // Modo tema livre (sem referência).
  return [
    'Você é um estrategista sênior de conteúdo para Instagram. Crie um post',
    `ORIGINAL, estruturado em AIDA, sobre o tema: "${input.tema ?? ''}".`,
    '',
    '## `analise`',
    'Como não há referência, escreva 1 frase dizendo que é um post a partir de tema',
    'livre (sem referência) e qual ângulo você escolheu.',
    '',
    "## Formato (`formato`: 'carrossel' | 'reels')",
    'Escolha o formato que melhor serve o tema.',
    '',
    '## Post em AIDA',
    ...REGRAS_AIDA,
  ].join('\n');
}

/** Gera o rascunho estruturado (uma chamada à Claude) a partir de referência ou tema. */
export async function gerarRascunho(input: GerarInput, apiKey: string): Promise<DraftResult> {
  const client = new Anthropic({ apiKey });
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: buildPrompt(input) }];

  for (let i = 0; i < 4; i++) {
    const res = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      tools: [PUBLISH_TOOL],
      messages,
    });

    const publish = res.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'publish_draft',
    );
    if (publish) return normalizeDraft(publish.input as DraftResult);

    if (res.stop_reason === 'refusal') throw new Error('O modelo recusou gerar este conteúdo.');
    if (res.stop_reason === 'end_turn') {
      throw new Error('O modelo terminou sem publicar o rascunho estruturado.');
    }
    messages.push({ role: 'assistant', content: res.content });
  }
  throw new Error('Excedeu o limite de iterações sem publicar o rascunho.');
}

/** Normaliza hashtags (o modelo pode devolver array OU string) para texto "a b c". */
function hashtagsToText(h: unknown): string {
  const clean = (s: string) => s.trim().replace(/^#/, '');
  if (Array.isArray(h)) return h.map((x) => clean(String(x))).filter(Boolean).join(' ');
  if (typeof h === 'string') return h.split(/[\s,]+/).map(clean).filter(Boolean).join(' ');
  return '';
}

/** Remove tags tipo `<parameter>`/`</parameter>` que o modelo às vezes vaza no texto. */
function stripTags(s: string): string {
  return (s ?? '').replace(/<\/?[a-zA-Z_][^>]*>/g, '').trim();
}

/** Normaliza o resultado: coage o formato e limpa vazamentos de tags nos textos. */
function normalizeDraft(d: DraftResult): DraftResult {
  const formato: 'carrossel' | 'reels' = d.formato === 'reels' ? 'reels' : 'carrossel';
  return {
    ...d,
    formato,
    analise: stripTags(d.analise),
    titulo: stripTags(d.titulo),
    gancho: stripTags(d.gancho),
    legenda: stripTags(d.legenda),
    cta_final: stripTags(d.cta_final),
    slides: (d.slides ?? []).map((s) => ({ titulo: stripTags(s.titulo), corpo: stripTags(s.corpo) })),
    cenas: (d.cenas ?? []).map((c) => ({
      tempo: stripTags(c.tempo),
      fala: stripTags(c.fala),
      texto_tela: stripTags(c.texto_tela),
    })),
  };
}

/** Monta a `pauta` (texto legível da estrutura AIDA) a partir do resultado. */
function montarPauta(d: DraftResult): string {
  const linhas = [`Gancho: ${d.gancho}`];
  if (d.formato === 'carrossel') {
    (d.slides ?? []).forEach((s, i) => linhas.push(`Slide ${i + 1} — ${s.titulo}: ${s.corpo}`));
  } else {
    (d.cenas ?? []).forEach((c, i) =>
      linhas.push(`Cena ${i + 1} [${c.tempo}] — ${c.texto_tela} | fala: ${c.fala}`),
    );
  }
  linhas.push(`CTA: ${d.cta_final}`);
  return linhas.join('\n');
}

/** Insere o rascunho em `conteudo_posts` e devolve o id criado. */
async function inserirRascunhoPost(
  database: Database,
  draft: DraftResult,
  referenciaId: string | null,
): Promise<string | undefined> {
  const roteiro =
    draft.formato === 'carrossel'
      ? { formato: 'carrossel', slides: draft.slides ?? [], capa_brief: draft.capa_brief }
      : { formato: 'reels', cenas: draft.cenas ?? [], capa_brief: draft.capa_brief };

  const [row] = await database
    .insert(conteudoPosts)
    .values({
      referenciaId,
      titulo: draft.titulo,
      estado: 'rascunho',
      plataforma: 'instagram',
      formato: draft.formato,
      gancho: draft.gancho,
      pauta: montarPauta(draft),
      legenda: draft.legenda,
      hashtags: hashtagsToText(draft.hashtags),
      ctaFinal: draft.cta_final,
      roteiro,
    })
    .returning({ id: conteudoPosts.id });

  return row?.id;
}

/** Resultado de uma geração de rascunho. */
export interface CriarRascunhoResult {
  created: boolean;
  id?: string;
  titulo?: string;
  formato?: string;
  /** Motivo quando `created` é false (ex.: 'sem referências pendentes'). */
  reason?: string;
}

/**
 * Cria UM rascunho e devolve o resultado. Fontes possíveis:
 *  - `opts.tema` → post original a partir de tema livre (sem referência);
 *  - `opts.referenciaId` → aquela referência específica;
 *  - nenhum → a próxima referência pendente (se houver).
 * Escreve via o `database` injetado (owner no script; app_pipeline no endpoint).
 */
export async function criarRascunho(
  database: Database,
  apiKey: string,
  opts: { referenciaId?: string; tema?: string } = {},
): Promise<CriarRascunhoResult> {
  // Tema livre: gera sem referência.
  if (opts.tema && opts.tema.trim()) {
    const draft = await gerarRascunho({ tema: opts.tema.trim() }, apiKey);
    const id = await inserirRascunhoPost(database, draft, null);
    return { created: true, id, titulo: draft.titulo, formato: draft.formato };
  }

  // A partir de uma referência (específica ou a próxima pendente).
  const [ref] = opts.referenciaId
    ? await database.select().from(referencias).where(eq(referencias.id, opts.referenciaId)).limit(1)
    : await database.select().from(referencias).where(eq(referencias.status, 'pendente')).limit(1);

  if (!ref) {
    return { created: false, reason: opts.referenciaId ? 'referência não encontrada' : 'sem referências pendentes' };
  }

  // Enriquece com o conteúdo REAL do post (legenda/formato/métricas) antes de gerar,
  // e persiste isso na referência (para reruns e para o "inspirado em" no board).
  let conteudo = ref.conteudoBruto;
  let formatoRef = ref.formatoRef;
  let metricas: string | null = null;
  if (ref.origemUrl) {
    const ig = await fetchInstagramContent(ref.origemUrl);
    if (ig.caption) conteudo = ig.caption;
    if (ig.formato) formatoRef = ig.formato;
    const partes: string[] = [];
    if (ig.likes != null) partes.push(`${ig.likes} curtidas`);
    if (ig.comments != null) partes.push(`${ig.comments} comentários`);
    if (ig.mediaCount != null) partes.push(`${ig.mediaCount} mídias`);
    if (ig.autor) partes.push(`@${ig.autor}`);
    metricas = partes.length ? partes.join(' · ') : null;
    if (ig.fonte) {
      await database
        .update(referencias)
        .set({
          conteudoBruto: conteudo,
          formatoRef,
          metricasRef: {
            likes: ig.likes,
            comments: ig.comments,
            mediaCount: ig.mediaCount,
            autor: ig.autor,
            fonte: ig.fonte,
            thumbnailUrl: ig.thumbnailUrl,
          },
          capaUrl: ig.thumbnailUrl ?? ref.capaUrl,
        })
        .where(eq(referencias.id, ref.id));
    }
  }

  const draft = await gerarRascunho(
    {
      referencia: {
        origemUrl: ref.origemUrl,
        conteudoBruto: conteudo,
        notaTime: ref.notaTime,
        formatoRef,
        metricas,
      },
    },
    apiKey,
  );

  const id = await inserirRascunhoPost(database, draft, ref.id);
  await database
    .update(referencias)
    .set({ status: 'processada', analise: draft.analise })
    .where(eq(referencias.id, ref.id));

  return { created: true, id, titulo: draft.titulo, formato: draft.formato };
}

/**
 * Processa até `limit` referências pendentes (script admin, roda como OWNER).
 * Encadeia `criarRascunho` (próxima pendente) até acabar ou atingir o limite.
 */
export async function processarReferenciasPendentes(
  apiKey: string,
  limit = 5,
): Promise<{ processadas: number; rascunhos: string[] }> {
  const rascunhos: string[] = [];
  for (let i = 0; i < limit; i++) {
    const r = await criarRascunho(db, apiKey, {});
    if (!r.created) break;
    if (r.id) rascunhos.push(r.id);
  }
  return { processadas: rascunhos.length, rascunhos };
}
