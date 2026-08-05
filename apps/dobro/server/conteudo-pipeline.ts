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
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../db/client.js';
import { referencias, conteudoPosts } from '../db/schema.js';
import { fetchInstagramContent } from './instagram.js';
import { transcreverSlides, podeLerSlides } from './instagram-slides.js';
import { preverDesempenho, formatarPrevisaoBriefing, type PrevisaoIa } from './conteudo-previsao.js';

/** Client Drizzle (owner OU role de menor privilégio) — injetado nas escritas. */
type Database = typeof db;

/** Referência capturada, ainda não virou rascunho. */
const STATUS_PENDENTE = 'pendente';
/**
 * Carrossel que a fila automática NÃO processou porque não conseguia ler os
 * slides (cron na Vercel: sem navegador, sem sessão do Instagram). Fica esperando
 * o processamento local, que lê os slides de verdade. Não é erro: é adiamento.
 */
const STATUS_AGUARDANDO_SLIDES = 'aguardando_slides';

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
  /**
   * Força o formato do NOSSO post, sobrepondo o padrão "mantém o formato da
   * referência". Útil para adaptar um reels de referência em carrossel (ou
   * vice-versa). Ausente/null → o modelo decide (mantém o da referência).
   */
  formatoAlvo?: 'carrossel' | 'reels' | null;
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

/** Bloco de regras AIDA + Fura a Bolha, comum aos dois modos (referência e tema). */
const REGRAS_AIDA = [
  '- `gancho`: a capa que faz PARAR O DEDO. É uma AFIRMAÇÃO FORTE E COMPLETA (a',
  '  frase INTEIRA da promessa, nunca um resumo de 3 ou 4 palavras). Só DESCREVER',
  '  é fraco (ex.: "Esse jogo ensina Git de graça"). Crie TENSÃO usando pelo menos',
  '  UMA destas 5 técnicas de gancho:',
  '    1. Lacuna de curiosidade: uma frase que obriga a abrir pra saber o resto.',
  '       Ex.: "20 mil devs já usam o Claude Code de graça, e não é pirataria."',
  '    2. Paradoxo / contra-intuição: quebre o senso comum.',
  '       Ex.: "Você decora os comandos de Git e esquece na semana seguinte."',
  '    3. Número surpreendente como isca.',
  '       Ex.: "Um arquivo que 99% dos devs não usa deixa a IA 10x mais útil."',
  '    4. Metáfora ou mini-história comprimida.',
  '       Ex.: "Sua IA trabalha como estagiário perdido. Faltou dar o crachá."',
  '    5. Medo de perder (o custo de NÃO fazer / de continuar como está).',
  '       Ex.: "Cada sessão nova do Claude queima tokens que você paga à toa."',
  '  Cole a técnica no NOSSO ângulo campeão (ferramenta ou conceito de IA/dev, de',
  '  graça, open source, no seu PC). Provocar > descrever. NUNCA invente número ou',
  '  fato pra caber numa técnica: se não tem o dado, use uma técnica que não precise.',
  '- Se CARROSSEL: preencha `slides` (6 a 8), cada um {titulo, corpo 1-2 frases}.',
  '  Estrutura (nosso passo a passo = Fura a Bolha + AIDA):',
  '    - Slide 1 = a CAPA: o `titulo` deste slide DEVE repetir o gancho POR',
  '      EXTENSO (a mesma afirmação forte e completa), nunca uma versão encurtada.',
  '      É esse titulo que vira a imagem de capa, então ele carrega o peso todo.',
  '      Os DEMAIS slides têm titulo curto (2 a 6 palavras).',
  '    - Slide 2 = CONFIRMA o gancho e dá o motivo pra ficar ("isso vale meu',
  '      tempo"): deixa claro logo que a promessa é real. NÃO abra pelo problema.',
  '    - Meio = Interesse e Desejo: por que importa, o que a pessoa ganha, prova.',
  '    - Inclua UM slide SALVÁVEL: um cheatsheet, lista de comandos, modelo ou',
  '      frase que a pessoa quer guardar, e sinalize no título que é pra salvar',
  '      (ex.: "Salva esse slide:"). É o que vira salvamento.',
  '    - Último = Ação (CTA).',
  '- Cada slide funciona SOZINHO: 1 ideia por slide, contraste alto, sem poluição.',
  '  Se alguém printar um slide solto, ele ainda faz sentido.',
  '- DESTAQUE no título: em cada `titulo` de slide, envolva 1 a 3 palavras-chave',
  '  (as mais fortes) entre `**` — o app pinta. Ex.: `Não é **falta de conteúdo**`.',
  '  Use com moderação, só o que realmente importa.',
  '- Se REELS: preencha `cenas` (4 a 7), cada uma {tempo, fala, texto_tela}, com o',
  '  gancho nos primeiros 3s e ritmo de retenção.',
  '- `legenda`: 2 a 4 frases + chamada pra ação suave (sem hashtags aqui).',
  '- `hashtags`: 5 a 8, sem "#".',
  '- `cta_final`: UM pedido só (não empilhe CTA, isso mata a ação). De preferência',
  '  uma palavra-gatilho pra comentário que dispara a automação de DM, ex.:',
  '  "comenta X que eu te mando o link".',
  '- `capa_brief`: 1-2 frases descrevendo a imagem de capa ideal (para designer/IA).',
  '',
  'NADA INVENTADO (regra dura): use SÓ fatos que estão na referência/no tema ou que',
  'são verdade conhecida. NUNCA invente nome de método, produto, ferramenta, número',
  'ou funcionalidade. Sem o dado, não afirme.',
  '',
  'OBRIGATÓRIO: o array (`slides` no carrossel, `cenas` no reels) NUNCA pode vir',
  'vazio — é o conteúdo principal do post. Preencha TODOS os itens.',
  '',
  'PROIBIDÍSSIMO (deixa com cara de texto gerado por IA): em NENHUM campo use',
  'travessão "—" nem meia-risca "–". Reescreva com vírgula, ponto, dois-pontos ou',
  'parênteses, ou quebre em duas frases. Evite também reticências "…" decorativas.',
  'Hífen "-" só em palavras compostas (ex.: bem-estar).',
  '',
  'Ao terminar, chame `publish_draft` UMA vez com todos os campos. Preencha SÓ',
  '`slides` OU `cenas`, conforme o formato. Não escreva o post como texto solto.',
];

/**
 * Voz da marca + veredito de performance (o que funciona no @devemdobro, extraído
 * dos 113 carrosséis reais medidos). Injetado no prompt pra o rascunho já sair no
 * NOSSO estilo, não num AIDA genérico.
 */
const VOZ_E_VEREDITO = [
  '## Quem somos e o que funciona pra nós (siga isto à risca)',
  'Perfil @devemdobro (ensino de programação e carreira tech). As DUAS metas do',
  'nosso conteúdo: ganhar SEGUIDORES e gerar COMENTÁRIOS (comentário com palavra-',
  'gatilho que dispara automação de DM).',
  '',
  'O que MAIS performa nos nossos carrosséis (priorize estes ângulos):',
  '- FERRAMENTA concreta de IA/dev, de preferência grátis, open source e que roda',
  '  local, com NOME PRÓPRIO e um número/prova. Nossos campeões reais: JARVIS open',
  '  source no PC, LightBot, Claude Code de graça, Oh My Git.',
  '- CONCEITO que destrava iniciante (Git, métodos de array em JS, flexbox, lógica).',
  'Gancho que mais converte: "você não precisa pagar / ser bilionário / ser',
  'avançado pra ter [algo poderoso]" e "de graça / open source / no seu PC".',
  '',
  'EVITE: post motivacional ou contrarian genérico ("o problema não é falta de',
  'esforço"), que rende pouco pra nós. Não prometa milagre. Salvamento e comentário',
  'são as metas: dê um motivo concreto pra salvar e um CTA de comentar palavra-gatilho.',
  '',
  'Tom: direto, de builder pra builder, português do dia a dia, frases curtas. Sem',
  'jargão corporativo nem palavras de IA (delve, robusto, transformador, poderoso).',
];

/**
 * Instrução do FORMATO do nosso post. Se `formatoAlvo` vier setado, FIXA o
 * formato (e manda adaptar mesmo que a referência seja de outro tipo); senão,
 * mantém o comportamento padrão (segue o formato da referência).
 */
function formatoInstrucao(formatoAlvo?: 'carrossel' | 'reels' | null): string[] {
  if (formatoAlvo === 'carrossel' || formatoAlvo === 'reels') {
    const preenche = formatoAlvo === 'carrossel' ? '`slides`' : '`cenas`';
    const vazio = formatoAlvo === 'carrossel' ? '`cenas`' : '`slides`';
    return [
      `O formato do NOSSO post está FIXADO: \`formato\` = '${formatoAlvo}'. Se a`,
      `referência for de outro tipo (ex.: um reels), ADAPTE a ideia para`,
      `'${formatoAlvo}' — preencha ${preenche} e deixe ${vazio} vazio.`,
    ];
  }
  return ['Por padrão mantenha o formato da referência; adapte só se houver razão clara.'];
}

function buildPrompt(input: GerarInput): string {
  const ref = input.referencia;
  if (ref) {
    return [
      'Você é um estrategista sênior de conteúdo para Instagram. Recebeu uma',
      'REFERÊNCIA (um post que foi bem) e vai: (1) analisar POR QUE ela',
      'provavelmente performou e (2) criar um post ORIGINAL nosso — inspirado,',
      'NUNCA cópia — no mesmo tema/nicho, estruturado em AIDA.',
      '',
      ...VOZ_E_VEREDITO,
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
      "## Passo 2 — FORMATO do nosso (`formato`: 'carrossel' | 'reels')",
      ...formatoInstrucao(input.formatoAlvo),
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
    ...VOZ_E_VEREDITO,
    '',
    '## `analise`',
    'Como não há referência, escreva 1 frase dizendo que é um post a partir de tema',
    'livre (sem referência) e qual ângulo você escolheu.',
    '',
    "## Formato (`formato`: 'carrossel' | 'reels')",
    ...(input.formatoAlvo ? formatoInstrucao(input.formatoAlvo) : ['Escolha o formato que melhor serve o tema.']),
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

/**
 * TRAVA DURA: remove travessão "—" e meia-risca "–" (cara de texto de IA). Converte
 * em vírgula e limpa a pontuação resultante. Garante "em hipótese alguma" mesmo se
 * o modelo ignorar a regra do prompt.
 */
function semTravessao(s: string): string {
  return (s ?? '')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s*,\s*,/g, ',')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/,\s*([.!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s,]+$/g, '')
    .trim();
}

/** Limpa tags vazadas E travessões de uma vez. */
function cleanTexto(s: string): string {
  return semTravessao(stripTags(s));
}

/** Normaliza o resultado: coage o formato e limpa vazamentos de tags nos textos. */
function normalizeDraft(d: DraftResult): DraftResult {
  const formato: 'carrossel' | 'reels' = d.formato === 'reels' ? 'reels' : 'carrossel';
  return {
    ...d,
    formato,
    analise: cleanTexto(d.analise),
    titulo: cleanTexto(d.titulo),
    gancho: cleanTexto(d.gancho),
    legenda: cleanTexto(d.legenda),
    cta_final: cleanTexto(d.cta_final),
    slides: (d.slides ?? []).map((s) => ({ titulo: cleanTexto(s.titulo), corpo: cleanTexto(s.corpo) })),
    cenas: (d.cenas ?? []).map((c) => ({
      tempo: cleanTexto(c.tempo),
      fala: cleanTexto(c.fala),
      texto_tela: cleanTexto(c.texto_tela),
    })),
  };
}

/**
 * Monta o campo "Referências" do card: o link que originou o rascunho, com autor
 * e métricas quando a gente conseguiu capturar. Uma linha por referência (é o
 * formato que o editor espera).
 */
function montarRefsLinks(origemUrl: string | null, metricas: string | null): string | null {
  if (!origemUrl) return null;
  return metricas ? `${origemUrl}\n(referência: ${metricas})` : origemUrl;
}

/** Monta a `pauta` (texto legível da estrutura AIDA) a partir do resultado. */
function montarPauta(d: DraftResult): string {
  const linhas = [`Gancho: ${d.gancho}`];
  if (d.formato === 'carrossel') {
    (d.slides ?? []).forEach((s, i) => linhas.push(`Slide ${i + 1}: ${s.titulo}. ${s.corpo}`));
  } else {
    (d.cenas ?? []).forEach((c, i) =>
      linhas.push(`Cena ${i + 1} [${c.tempo}]: ${c.texto_tela} | fala: ${c.fala}`),
    );
  }
  linhas.push(`CTA: ${d.cta_final}`);
  return linhas.join('\n');
}

/**
 * Grava o rascunho em `conteudo_posts` e devolve o id.
 *
 * COMPLETA o card-esqueleto quando ele existe. O webhook do Telegram cria um card
 * vazio no instante da captura, pra você ver na hora que o link chegou; quando a
 * geração termina, ela preenche ESSE card em vez de criar outro. Sem isso, cada
 * link viraria dois cards no board.
 *
 * O esqueleto é reconhecido por `roteiro IS NULL` — é o campo que só a geração
 * preenche. Um card já gerado nunca é sobrescrito: reprocessar uma referência
 * cria um card novo de propósito, que é o que permite comparar antes e depois.
 */
async function salvarRascunhoPost(
  database: Database,
  draft: DraftResult,
  referenciaId: string | null,
  briefing: string | null,
  refsLinks: string | null,
): Promise<string | undefined> {
  const roteiro =
    draft.formato === 'carrossel'
      ? { formato: 'carrossel', slides: draft.slides ?? [], capa_brief: draft.capa_brief }
      : { formato: 'reels', cenas: draft.cenas ?? [], capa_brief: draft.capa_brief };

  const campos = {
    titulo: draft.titulo,
    formato: draft.formato,
    gancho: draft.gancho,
    pauta: montarPauta(draft),
    legenda: draft.legenda,
    hashtags: hashtagsToText(draft.hashtags),
    ctaFinal: draft.cta_final,
    briefing,
    refsLinks,
    roteiro,
    updatedAt: new Date(),
  };

  if (referenciaId) {
    const [esqueleto] = await database
      .select({ id: conteudoPosts.id })
      .from(conteudoPosts)
      .where(and(eq(conteudoPosts.referenciaId, referenciaId), isNull(conteudoPosts.roteiro)))
      .limit(1);

    if (esqueleto) {
      await database.update(conteudoPosts).set(campos).where(eq(conteudoPosts.id, esqueleto.id));
      return esqueleto.id;
    }
  }

  const [row] = await database
    .insert(conteudoPosts)
    .values({ referenciaId, estado: 'rascunho', plataforma: 'instagram', ...campos })
    .returning({ id: conteudoPosts.id });

  return row?.id;
}

/**
 * Cria o card-esqueleto de uma referência recém-capturada: aparece no board na
 * hora, com o link, e é completado quando a geração roda. Devolve o id (ou
 * undefined se falhar — ver o card é um conforto, não pode derrubar a captura).
 */
export async function criarEsqueletoDoCard(
  database: Database,
  referenciaId: string,
  origemUrl: string,
  notaTime: string | null,
): Promise<string | undefined> {
  try {
    const [row] = await database
      .insert(conteudoPosts)
      .values({
        referenciaId,
        titulo: '⏳ Referência capturada (gerando...)',
        estado: 'rascunho',
        plataforma: 'instagram',
        formato: 'carrossel',
        refsLinks: notaTime ? `${origemUrl}\n(nota: ${notaTime})` : origemUrl,
        // `roteiro` fica NULL de propósito: é ele que marca este card como esqueleto.
      })
      .returning({ id: conteudoPosts.id });
    return row?.id;
  } catch (err) {
    console.warn('[esqueleto] não criou o card:', err instanceof Error ? err.message : err);
    return undefined;
  }
}

/**
 * Registra a PREVISÃO da IA para este rascunho ("Placar da IA", metade previsto).
 * É uma segunda chamada, com avaliador cético independente — ver `conteudo-previsao.ts`.
 *
 * BEST-EFFORT de propósito: se a previsão falhar (timeout, recusa, erro de rede),
 * o rascunho é gravado do mesmo jeito, só que sem o bloco de previsão. O post é o
 * produto; a previsão é o extra que a gente está testando.
 */
async function preverBestEffort(draft: DraftResult, apiKey: string): Promise<PrevisaoIa | null> {
  try {
    return await preverDesempenho(
      {
        formato: draft.formato,
        titulo: draft.titulo,
        gancho: draft.gancho,
        slides: draft.slides,
        cenas: draft.cenas,
        legenda: draft.legenda,
        ctaFinal: draft.cta_final,
        hashtags: hashtagsToText(draft.hashtags),
      },
      apiKey,
    );
  } catch (err) {
    console.warn('[conteudo:previsao] falhou (rascunho segue sem previsão):', err instanceof Error ? err.message : err);
    return null;
  }
}

/** Resultado de uma geração de rascunho. */
export interface CriarRascunhoResult {
  created: boolean;
  id?: string;
  titulo?: string;
  formato?: string;
  /** Previsão da IA registrada junto (null se a previsão falhou). */
  previsao?: PrevisaoIa | null;
  /**
   * True quando a referência foi ADIADA de propósito (carrossel esperando leitura
   * local dos slides). Não é falha: quem varre a fila deve seguir para a próxima.
   */
  adiada?: boolean;
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
  opts: {
    referenciaId?: string;
    tema?: string;
    formatoAlvo?: 'carrossel' | 'reels';
    /**
     * Gera carrossel mesmo sem conseguir ler os slides (o rascunho sai raso).
     * Só para chamadas em que um humano pediu e está vendo o resultado: os
     * scripts admin e a rota `/api/conteudo/gerar`. Automação nunca passa isto.
     */
    permitirSemSlides?: boolean;
  } = {},
): Promise<CriarRascunhoResult> {
  // Tema livre: gera sem referência.
  if (opts.tema && opts.tema.trim()) {
    const draft = await gerarRascunho({ tema: opts.tema.trim(), formatoAlvo: opts.formatoAlvo }, apiKey);
    const previsao = await preverBestEffort(draft, apiKey);
    const id = await salvarRascunhoPost(
      database,
      draft,
      null,
      previsao ? formatarPrevisaoBriefing(previsao) : null,
      null, // tema livre não tem referência de origem
    );
    return { created: true, id, titulo: draft.titulo, formato: draft.formato, previsao };
  }

  // A partir de uma referência (específica ou a próxima da fila).
  //
  // A fila inclui as ADIADAS (carrossel que ficou esperando leitura de slides) só
  // onde dá pra ler slides — no PC. Na Vercel elas continuam de fora, senão o cron
  // pegaria de novo a mesma referência todo dia pra adiar outra vez.
  const statusDaFila = podeLerSlides()
    ? [STATUS_PENDENTE, STATUS_AGUARDANDO_SLIDES]
    : [STATUS_PENDENTE];

  const [ref] = opts.referenciaId
    ? await database.select().from(referencias).where(eq(referencias.id, opts.referenciaId)).limit(1)
    : await database.select().from(referencias).where(inArray(referencias.status, statusDaFila)).limit(1);

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

    // Num CARROSSEL o conteúdo está dentro das imagens: a legenda quase sempre é
    // só isca ("comenta X que eu mando"). Sem isto, o teardown é feito em cima de
    // hashtags e o rascunho sai sobre um tema que a referência nunca tratou.
    // Só funciona LOCAL (Playwright + sessão logada); na Vercel devolve null e
    // seguimos com a legenda, como antes.
    if (formatoRef === 'carrossel') {
      // Não geramos carrossel raso automaticamente: sem leitura de slides (cron e
      // webhook na Vercel), a referência é ADIADA e fica esperando o PC. Sem isto,
      // nascia um card fraco e o card bom virava duplicata depois.
      //
      // `permitirSemSlides` é EXPLÍCITO de propósito. A versão anterior deduzia
      // "foi um humano que pediu" da presença de `referenciaId` — mas o webhook do
      // Telegram também passa `referenciaId`, então ele teria voltado a gerar
      // carrossel raso na Vercel. Só quem sabe se a decisão é humana é quem chama.
      if (!opts.permitirSemSlides && !podeLerSlides()) {
        await database
          .update(referencias)
          .set({ status: STATUS_AGUARDANDO_SLIDES })
          .where(eq(referencias.id, ref.id));
        return {
          created: false,
          adiada: true,
          reason: 'carrossel adiado: os slides só podem ser lidos no processamento local',
        };
      }
      const slides = await transcreverSlides(ref.origemUrl, apiKey);
      if (slides) conteudo = `${slides}\n\n[Legenda do post]\n${ig.caption ?? '(sem legenda)'}`;
    }
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
      formatoAlvo: opts.formatoAlvo,
    },
    apiKey,
  );

  const previsao = await preverBestEffort(draft, apiKey);
  const id = await salvarRascunhoPost(
    database,
    draft,
    ref.id,
    previsao ? formatarPrevisaoBriefing(previsao) : null,
    // O card mostra DE ONDE veio a ideia: sem isto o link só existe na FK interna
    // e some da tela. Autor e métricas ajudam a lembrar por que ela foi salva.
    montarRefsLinks(ref.origemUrl, metricas),
  );
  await database
    .update(referencias)
    .set({ status: 'processada', analise: draft.analise })
    .where(eq(referencias.id, ref.id));

  return { created: true, id, titulo: draft.titulo, formato: draft.formato, previsao };
}

/**
 * Processa até `limit` referências pendentes (script admin, roda como OWNER).
 * Encadeia `criarRascunho` (próxima pendente) até acabar ou atingir o limite.
 *
 * `orcamentoMs` é a trava de tempo para quem roda com teto de execução (a rota de
 * cron na Vercel tem 60s): antes de COMEÇAR mais uma referência, se já passou do
 * orçamento, para. Uma referência leva ~15s de geração + até 25s de previsão, e o
 * que sobrar pendente simplesmente entra na próxima execução. Sem orçamento
 * (`0`), roda até o limite — é o caso do script admin no terminal.
 */
export async function processarReferenciasPendentes(
  apiKey: string,
  limit = 5,
  orcamentoMs = 0,
): Promise<{ processadas: number; rascunhos: string[]; adiadas: number }> {
  const rascunhos: string[] = [];
  const inicio = Date.now();
  let adiadas = 0;
  for (let i = 0; i < limit; i++) {
    if (orcamentoMs > 0 && i > 0 && Date.now() - inicio > orcamentoMs) break;
    const r = await criarRascunho(db, apiKey, {});
    // Adiada não é fim de fila: a referência saiu de 'pendente', então a próxima
    // volta traz outra. Parar aqui deixaria o resto da fila parada atrás dela.
    if (!r.created && r.adiada) {
      adiadas += 1;
      continue;
    }
    if (!r.created) break;
    if (r.id) rascunhos.push(r.id);
  }
  return { processadas: rascunhos.length, rascunhos, adiadas };
}
