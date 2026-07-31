/**
 * apps/dobro — rota do "Social Media Estrategista" (autenticada).
 *
 * Story 2 do epic Social Media Estrategista, agora com 5 MODOS (um por prompt do
 * dono): diagnóstico do perfil, reparador de conteúdo, engenheiro de alcance,
 * conversor em vendas e plano de 30 dias. A TELA (client) monta o BRIEFING de
 * desempenho (motor de Lead Score) e o PERFIL do negócio (form salvo no navegador)
 * e manda pra cá; o servidor escolhe o prompt do modo, preenche o contexto com
 * esses dados e pede à Claude a análise estruturada em seções.
 *
 * Defesas (iguais a /api/conteudo/gerar): auth-first (401), contrato fechado de
 * entrada, e a chave da Claude só no servidor (sem ela, 503). Não escreve no banco.
 *
 * Endpoint (montado em app.ts):
 *   - POST /api/conteudo/estrategista  → { modo, briefing, perfil } → { analise }.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Context } from 'hono';
import { auth } from './auth.js';
import { getAgencyAnthropicKey } from './env.js';

// --- Contrato do briefing recebido (defesa 2) ---
interface AggItem {
  chave: string;
  scoreMedio: number;
  n: number;
}
interface PostItem {
  score: number;
  rotulo: string;
  formato: string;
  taxaTop: string | null;
  tema: string;
}
interface Briefing {
  objetivoLabel: string;
  confianca: string;
  totalPosts: number;
  porFormato: AggItem[];
  porDia: AggItem[];
  campeoes: PostItem[];
  piores: PostItem[];
}
interface Perfil {
  direcao: string;
  bio: string;
  destaques: string;
  produto: string;
  ticket: string;
  comoVende: string;
  objecao: string;
  tempoDia: string;
  publico: string;
}

class InputError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 422 = 400,
  ) {
    super(message);
  }
}

const s = (v: unknown, max = 1200): string =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';
const nOr0 = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

function parseAgg(v: unknown): AggItem[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 10).map((x) => {
    const o = (x ?? {}) as Record<string, unknown>;
    return { chave: s(o.chave, 40), scoreMedio: nOr0(o.scoreMedio), n: nOr0(o.n) };
  });
}
function parsePosts(v: unknown): PostItem[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 12).map((x) => {
    const o = (x ?? {}) as Record<string, unknown>;
    return {
      score: nOr0(o.score),
      rotulo: s(o.rotulo, 20),
      formato: s(o.formato, 20),
      taxaTop: o.taxaTop == null ? null : s(o.taxaTop, 40),
      tema: s(o.tema, 200),
    };
  });
}
function parseBriefing(raw: unknown): Briefing {
  if (raw == null || typeof raw !== 'object') throw new InputError('briefing ausente');
  const o = raw as Record<string, unknown>;
  const b: Briefing = {
    objetivoLabel: s(o.objetivoLabel, 40) || 'Captar lead',
    confianca: s(o.confianca, 20) || 'baixa',
    totalPosts: nOr0(o.totalPosts),
    porFormato: parseAgg(o.porFormato),
    porDia: parseAgg(o.porDia),
    campeoes: parsePosts(o.campeoes),
    piores: parsePosts(o.piores),
  };
  if (b.campeoes.length === 0) throw new InputError('briefing sem posts para analisar', 422);
  return b;
}
function parsePerfil(raw: unknown): Perfil {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    direcao: s(o.direcao, 1000),
    bio: s(o.bio, 600),
    destaques: s(o.destaques, 600),
    produto: s(o.produto, 600),
    ticket: s(o.ticket, 100),
    comoVende: s(o.comoVende, 600),
    objecao: s(o.objecao, 600),
    tempoDia: s(o.tempoDia, 100),
    publico: s(o.publico, 600),
  };
}

// --- Modos (um por prompt) ---
export type ModoId = 'diagnostico' | 'conteudo' | 'alcance' | 'vendas' | 'plano30';
const MODOS: readonly ModoId[] = ['diagnostico', 'conteudo', 'alcance', 'vendas', 'plano30'];
function parseModo(v: unknown): ModoId {
  return typeof v === 'string' && (MODOS as readonly string[]).includes(v) ? (v as ModoId) : 'diagnostico';
}

/** Tool comum: força a saída em seções + um entregável opcional pronto pra usar. */
const ANALISE_TOOL: Anthropic.Tool = {
  name: 'entregar_analise',
  description: 'Entregue a análise final. Chame UMA vez, ao terminar, com o resumo, as seções e o entregável.',
  input_schema: {
    type: 'object',
    properties: {
      resumo: { type: 'string', description: 'Veredito em 1 a 3 frases: o ponto central da análise.' },
      secoes: {
        type: 'array',
        description: 'Uma seção por ponto pedido na tarefa, na ordem. Preencha TODAS as pedidas.',
        items: {
          type: 'object',
          properties: {
            titulo: { type: 'string', description: 'Título curto da seção (ex.: "3 erros graves").' },
            conteudo: {
              type: 'string',
              description: 'Conteúdo da seção. Use "- " para itens de lista, quebra de linha entre eles.',
            },
          },
          required: ['titulo', 'conteudo'],
        },
      },
      entregavel: {
        type: 'object',
        description: 'Conteúdo PRONTO pra usar (bio reescrita, post pronto, etc.), quando a tarefa pedir. Omita se não houver.',
        properties: {
          titulo: { type: 'string' },
          texto: { type: 'string' },
        },
        required: ['titulo', 'texto'],
      },
    },
    required: ['resumo', 'secoes'],
  },
};

const NICHO =
  'Perfil @devemdobro (Instagram, ensino), modelo de negócio de LANÇAMENTO MENSAL: o conteúdo ' +
  'capta leads e nutre até o lançamento do mês. O posicionamento está EM EVOLUÇÃO — quando houver ' +
  '"Direção estratégica atual" abaixo, ela tem prioridade sobre qualquer suposição de nicho.';

/** Direção estratégica (pivô/foco atual) informada pelo dono — precede o histórico. */
function direcaoTxt(p: Perfil): string {
  if (!p.direcao) return '';
  return [
    '## DIREÇÃO ESTRATÉGICA ATUAL (prioridade máxima — vale mais que o histórico)',
    p.direcao,
    'ATENÇÃO: os dados de desempenho abaixo são do conteúdo PASSADO (público e posicionamento ANTIGOS). ' +
      'Use-os para aprender MECANISMOS que funcionam (ganchos, CTAs, gatilhos, ritmo), mas ao recomendar o ' +
      'FUTURO, mire no público e na direção acima. O que foi campeão com o público antigo pode NÃO servir ' +
      'para o novo. Se a direção priorizar um formato, respeite-a mesmo que o Lead Score médio geral diga outra coisa (o geral é do período todo, não da tendência recente).',
  ].join('\n');
}

function fmtAgg(items: AggItem[]): string {
  return items.map((a) => `${a.chave} (LS ${a.scoreMedio}/100, ${a.n} posts)`).join('; ') || '(sem dados)';
}
function fmtPosts(items: PostItem[]): string {
  return items
    .map((p) => `- [LS ${p.score} ${p.rotulo}] ${p.formato}${p.taxaTop ? ` · destaque: ${p.taxaTop}` : ''} · "${p.tema}"`)
    .join('\n');
}

/** Bloco de dados de desempenho (comum a todos os modos). */
function dadosTxt(b: Briefing): string {
  return [
    `## Desempenho real (${b.totalPosts} posts, confiança ${b.confianca}, objetivo atual: ${b.objetivoLabel})`,
    'Lead Score (0-100) mede captação de lead por alcance (pesa comentários, visitas ao perfil e salvamentos; ignora curtidas).',
    `- Lead Score médio por FORMATO: ${fmtAgg(b.porFormato)}`,
    `- Lead Score médio por DIA: ${fmtAgg(b.porDia)}`,
    '- Campeões (mais captam lead):',
    fmtPosts(b.campeoes),
    '- Piores (rendem pouco lead):',
    fmtPosts(b.piores) || '(sem dados)',
  ].join('\n');
}

/** Campos do perfil (só os informados; marca os vazios). */
function perfilTxt(p: Perfil, campos: (keyof Perfil)[]): string {
  const label: Record<keyof Perfil, string> = {
    direcao: 'Direção estratégica',
    bio: 'Bio atual',
    destaques: 'Destaques',
    produto: 'Produto/serviço',
    ticket: 'Ticket/preço',
    comoVende: 'Como a venda acontece hoje',
    objecao: 'Principal objeção antes de comprar',
    tempoDia: 'Tempo disponível por dia',
    publico: 'Público ideal / maior dor',
  };
  const linhas = campos.map((c) => `- ${label[c]}: ${p[c] || '(não informado)'}`);
  return `## Perfil do negócio (informado pelo dono)\n${linhas.join('\n')}`;
}

const REGRAS_ESCRITA =
  'REGRAS DE ESCRITA: escreva em português do Brasil, direto e prático. NUNCA use travessão "—" ' +
  'nem meia-risca "–" (use vírgula, ponto ou parênteses). Não invente números, nomes de produtos ' +
  'ou métricas que não estejam no contexto. Conteúdo genérico que serve pra qualquer perfil não serve.';

const CHAMAR = 'Ao terminar, chame `entregar_analise` UMA vez: `resumo`, uma `secao` por ponto pedido (na ordem) e o `entregavel` quando a tarefa pedir conteúdo pronto.';

/** Monta o prompt do modo escolhido, com o contexto já preenchido. */
function buildPrompt(modo: ModoId, b: Briefing, p: Perfil): string {
  const dir = direcaoTxt(p);
  const base = [NICHO, '', ...(dir ? [dir, ''] : []), dadosTxt(b), ''];

  switch (modo) {
    case 'diagnostico':
      return [
        '# IDENTIDADE',
        'Você é um social media de alto nível especializado em diagnóstico completo de perfis de Instagram. Audita como um profissional que cobra caro: sem elogio fácil, apontando exatamente o que está sabotando o crescimento.',
        '',
        '# CONTEXTO',
        ...base,
        perfilTxt(p, ['bio', 'destaques', 'publico']),
        '',
        '# TAREFA — entregue uma seção para cada ponto:',
        '1) Os 3 erros mais graves que estão limitando o crescimento agora.',
        '2) O que já está funcionando e deve ser mantido (use os campeões do desempenho).',
        '3) Bio reescrita na estrutura: quem você ajuda + resultado + diferencial + próximo passo.',
        '4) Estrutura de destaques ideal para o objetivo.',
        '5) Diagnóstico do feed: o que a primeira impressão comunica para quem chega.',
        '6) A ÚNICA correção de maior impacto imediato se feita esta semana, e por quê.',
        'entregavel = a bio reescrita, pronta pra colar.',
        '',
        '# REGRA: diagnóstico sem priorização não serve. Diga o que resolver primeiro e por quê.',
        REGRAS_ESCRITA,
        CHAMAR,
      ].join('\n');

    case 'conteudo':
      return [
        '# IDENTIDADE',
        'Você é um estrategista de conteúdo especializado em identificar por que posts não performam e reconstruí-los para gerar alcance real. Conteúdo fraco não é falta de esforço, é falta de estratégia por trás de cada post.',
        '',
        '# CONTEXTO',
        ...base,
        perfilTxt(p, ['publico']),
        '',
        '# TAREFA — uma seção por ponto:',
        '1) Por que o conteúdo atual provavelmente não alcança quem ainda não segue (use os piores do desempenho).',
        '2) Os 4 pilares de conteúdo que este perfil deveria usar, com a função estratégica de cada um.',
        '3) 10 ideias de conteúdo com ângulo específico e alto potencial de captação, coerentes com os campeões.',
        '4) A proporção ideal entre conteúdo de atração, autoridade e conversão.',
        'entregavel = o conteúdo COMPLETO da melhor ideia (gancho + roteiro/slides + legenda + CTA), pronto pra publicar.',
        '',
        '# REGRA: cada peça precisa refletir uma perspectiva específica deste perfil, não servir pra qualquer um.',
        REGRAS_ESCRITA,
        CHAMAR,
      ].join('\n');

    case 'alcance':
      return [
        '# IDENTIDADE',
        'Você é um especialista em distribuição orgânica no Instagram. Entende como o algoritmo decide o que mostrar para não seguidores, e sabe que alcance é consequência de retenção, salvamento e compartilhamento, não de sorte.',
        '',
        '# CONTEXTO',
        ...base,
        perfilTxt(p, ['publico']),
        '',
        '# TAREFA — uma seção por ponto:',
        '1) Os elementos que o algoritmo mais valoriza para distribuir a não seguidores, e como aplicar cada um aqui.',
        '2) A estrutura de Reels que maximiza retenção do primeiro ao último segundo.',
        '3) Os tipos de conteúdo que geram mais compartilhamento e salvamento neste nicho.',
        '4) O gancho ideal para os 3 primeiros segundos que impede o scroll.',
        'entregavel = 3 ganchos testáveis para o próximo conteúdo, cada um com uma técnica diferente.',
        '',
        '# REGRA: alcance sem retenção não vira seguidor. A estratégia precisa atrair E segurar o espectador certo.',
        REGRAS_ESCRITA,
        CHAMAR,
      ].join('\n');

    case 'vendas':
      return [
        '# IDENTIDADE',
        'Você é um estrategista de vendas no Instagram especializado em transformar audiência em faturamento. Perfil que cresce mas não vende é hobby com plateia. Conversão precisa de sistema, não de post de venda solta.',
        '',
        '# CONTEXTO',
        ...base,
        perfilTxt(p, ['produto', 'ticket', 'comoVende', 'objecao', 'publico']),
        '',
        '# TAREFA — uma seção por ponto:',
        '1) O conteúdo que instala a crença de compra ANTES de a venda aparecer.',
        '2) A cadência ideal de posts de venda sem cansar a audiência.',
        '3) A sequência de mensagens no Direct para o lead que demonstrou interesse mas não comprou.',
        '4) A mensagem de boas-vindas para novo seguidor que inicia relacionamento sem vender de cara.',
        '5) O cálculo de quantos leads por mês são necessários para a meta de faturamento (use o ticket informado; se faltar dado, explique a conta).',
        'entregavel = o post de conversão que parece conteúdo (próximo passo lógico), não anúncio.',
        '',
        '# REGRA: urgência inventada quebra confiança. A venda é resultado de entregar valor suficiente.',
        REGRAS_ESCRITA,
        CHAMAR,
      ].join('\n');

    case 'plano30':
      return [
        '# IDENTIDADE',
        'Você é um consultor de Instagram especializado em planos de recuperação de perfil. Transforma diagnóstico em execução, com ação clara por semana e uma métrica que confirma o progresso.',
        '',
        '# CONTEXTO',
        ...base,
        perfilTxt(p, ['tempoDia', 'publico']),
        '',
        '# TAREFA — monte um plano de 30 dias em 4 semanas. Uma seção por semana, cada uma com: objetivo único, as 3 ações prioritárias, o que publicar e a métrica que confirma que está funcionando.',
        'Semana 1: consertar a base (perfil e posicionamento). Semana 2: conteúdo de alcance. Semana 3: engajamento e retenção. Semana 4: conversão.',
        'Some uma seção final "Métrica-guia": a única métrica para acompanhar do início ao fim.',
        'Cada semana deve caber no tempo disponível por dia informado.',
        '',
        '# REGRA: plano que exige mais tempo do que a pessoa tem não é plano, é frustração programada.',
        REGRAS_ESCRITA,
        CHAMAR,
      ].join('\n');
  }
}

/** Remove tags tipo `<parameter>` que o modelo às vezes vaza no texto. */
function stripTags(v: string): string {
  return (v ?? '').replace(/<\/?[a-zA-Z_][^>]*>/g, '').trim();
}
/** Remove travessões/meia-riscas (cara de texto de IA), preservando quebras de linha. */
function semTravessao(v: string): string {
  return stripTags(v)
    // O modelo às vezes escreve \n / \t como TEXTO literal (barra+n) em vez de
    // quebra real — normaliza para o caractere de verdade antes de exibir.
    .replace(/\\r\\n|\\r|\\n/g, '\n')
    .replace(/\\t/g, ' ')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/[ \t]{2,}/g, ' ')
    // No máximo uma linha em branco entre blocos (evita buracos enormes).
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface Secao {
  titulo: string;
  conteudo: string;
}
export interface Analise {
  resumo: string;
  secoes: Secao[];
  entregavel: { titulo: string; texto: string } | null;
}

function limpar(r: Analise): Analise {
  return {
    resumo: semTravessao(String(r.resumo ?? '')),
    secoes: (Array.isArray(r.secoes) ? r.secoes : []).map((x) => ({
      titulo: semTravessao(String(x?.titulo ?? '')),
      conteudo: semTravessao(String(x?.conteudo ?? '')),
    })),
    entregavel:
      r.entregavel && (r.entregavel.titulo || r.entregavel.texto)
        ? { titulo: semTravessao(String(r.entregavel.titulo ?? '')), texto: semTravessao(String(r.entregavel.texto ?? '')) }
        : null,
  };
}

/** Chama a Claude (tool forçada) para o modo escolhido. */
export async function gerarAnalise(modo: ModoId, b: Briefing, p: Perfil, apiKey: string): Promise<Analise> {
  const client = new Anthropic({ apiKey });
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: buildPrompt(modo, b, p) }];

  for (let i = 0; i < 4; i++) {
    const res = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 10000,
      tools: [ANALISE_TOOL],
      tool_choice: { type: 'tool', name: 'entregar_analise' },
      messages,
    });
    const call = res.content.find(
      (x): x is Anthropic.ToolUseBlock => x.type === 'tool_use' && x.name === 'entregar_analise',
    );
    if (call) return limpar(call.input as Analise);
    if (res.stop_reason === 'refusal') throw new Error('O modelo recusou gerar esta análise.');
    if (res.stop_reason === 'end_turn') throw new Error('O modelo terminou sem entregar a análise.');
    messages.push({ role: 'assistant', content: res.content });
  }
  throw new Error('Excedeu o limite de iterações sem entregar a análise.');
}

/** Núcleo testável: valida entrada e chama a IA. Usado pela rota e por scripts. */
export async function estrategistaFromInput(raw: unknown, apiKey: string): Promise<{ modo: ModoId; analise: Analise }> {
  const o = (raw ?? {}) as Record<string, unknown>;
  const modo = parseModo(o.modo);
  const briefing = parseBriefing(o.briefing ?? o);
  const perfil = parsePerfil(o.perfil);
  const analise = await gerarAnalise(modo, briefing, perfil, apiKey);
  return { modo, analise };
}

/**
 * POST /api/conteudo/estrategista — recebe { modo, briefing, perfil } e devolve
 * a análise estruturada em seções do modo escolhido. Não escreve no banco.
 */
export async function handleEstrategista(c: Context): Promise<Response> {
  if (!(await auth.api.getSession({ headers: c.req.raw.headers }))) {
    return c.json({ error: 'Não autenticado' }, 401);
  }
  const apiKey = getAgencyAnthropicKey();
  if (!apiKey) {
    return c.json({ error: 'IA não configurada (defina ANTHROPIC_API_KEY no servidor).' }, 503);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'JSON inválido no corpo' }, 400);
  }

  try {
    const { modo, analise } = await estrategistaFromInput(body, apiKey);
    return c.json({ modo, analise });
  } catch (err) {
    if (err instanceof InputError) return c.json({ error: err.message }, err.status);
    const msg = err instanceof Error ? err.message : String(err);
    if (/recus/i.test(msg)) return c.json({ error: msg }, 422);
    console.error('[conteudo:estrategista] erro:', msg);
    return c.json({ error: 'Erro ao gerar a análise' }, 500);
  }
}
