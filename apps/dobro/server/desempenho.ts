/**
 * apps/dobro — rotas de ESCRITA do desempenho por post (autenticadas).
 *
 * A criadora registra os números de cada conteúdo publicado (alcance, salvamentos,
 * compartilhamentos…) pela tela `/conteudo/desempenho`. É a "aba Instagram" da
 * planilha, dentro do OS. Segue as MESMAS 3 defesas de `/api/conteudo`:
 *   1. auth-first (fail-closed): sem sessão Better Auth → 401 antes de tocar o banco;
 *   2. contrato fechado de campos: só as colunas conhecidas de `conteudo_desempenho`
 *      entram — enum de formato validado, números coeridos/validados, resto ignorado;
 *   3. escrita via role `app_content` (CRUD só em `conteudo_posts`/`conteudo_desempenho`).
 *
 * As TAXAS e a CLASSIFICAÇÃO (Forte/Saudável/Abaixo) NÃO são gravadas: a tela as
 * deriva destes valores crus + os benchmarks do manifesto. Guardamos só o sinal.
 *
 * Endpoints (montados em app.ts):
 *   - POST   /api/conteudo/desempenho       → cria 1..N medições.
 *   - PATCH  /api/conteudo/desempenho/:id    → edita uma medição (patch parcial).
 *   - DELETE /api/conteudo/desempenho/:id    → remove uma medição.
 */

import type { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { auth } from './auth.js';
import { dbContent } from '../db/client.js';
import { conteudoDesempenho } from '../db/schema.js';

// --- Contrato fechado de valores (defesa 2) ---
const FORMATOS = ['reel', 'carrossel', 'post', 'story'] as const;
type Formato = (typeof FORMATOS)[number];

/** Regex leve de UUID — barra id malformado com 400 limpo (em vez de 500 do banco). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** As colunas numéricas inteiras (contagens não-negativas). */
const INT_FIELDS = [
  'alcance',
  'visualizacoes',
  'curtidas',
  'comentarios',
  'compartilhamentos',
  'salvamentos',
  'visitasPerfil',
  'seguidores',
  'duracaoS',
] as const;

/** Erro de validação com status HTTP para resposta limpa. */
class InputError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 = 400,
  ) {
    super(message);
  }
}

/** String opcional → trim ou null (aceita ausência/null/''); não-string vira null. */
function optStr(value: unknown, max = 500): string | null {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (!s) return null;
  return s.slice(0, max);
}

/** Converte o valor de data recebido (ISO/'YYYY-MM-DD') em Date válida ou null. */
function parseData(value: unknown): Date | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') throw new InputError('data inválida');
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new InputError('data inválida');
  return d;
}

/** Inteiro não-negativo (ou null). Aceita number ou string numérica; arredonda. */
function optInt(value: unknown, campo: string): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) throw new InputError(`${campo} inválido (número esperado)`);
  if (n < 0) throw new InputError(`${campo} não pode ser negativo`);
  return Math.round(n);
}

/** Número não-negativo (ou null) — para o tempo médio (decimal em segundos). */
function optNum(value: unknown, campo: string): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) throw new InputError(`${campo} inválido (número esperado)`);
  if (n < 0) throw new InputError(`${campo} não pode ser negativo`);
  return n;
}

/** Valida o enum de formato, com default quando ausente. */
function parseFormato(value: unknown): Formato {
  if (value == null || value === '') return 'reel';
  if (typeof value === 'string' && (FORMATOS as readonly string[]).includes(value)) {
    return value as Formato;
  }
  throw new InputError(`formato inválido (use: ${FORMATOS.join(', ')})`);
}

/** postId opcional: uuid válido ou null (não confiamos no corpo). */
function optPostId(value: unknown): string | null {
  const s = optStr(value, 40);
  if (s == null) return null;
  if (!UUID_RE.test(s)) throw new InputError('post_id inválido');
  return s;
}

/** Campos completos de UMA medição (para INSERT). */
function parseNova(raw: unknown): Record<string, unknown> {
  if (raw == null || typeof raw !== 'object') throw new InputError('medição inválida');
  const o = raw as Record<string, unknown>;
  const row: Record<string, unknown> = {
    postId: optPostId(o.postId),
    data: parseData(o.data),
    formato: parseFormato(o.formato),
    tema: optStr(o.tema, 300),
    tempoMedioS: optNum(o.tempoMedioS, 'tempoMedioS'),
    permalink: optStr(o.permalink, 500),
    mediaId: optStr(o.mediaId, 100),
  };
  for (const f of INT_FIELDS) row[f] = optInt(o[f], f);
  return row;
}

/**
 * Valida um PATCH parcial: só as chaves PRESENTES entram no `set`. Retorna o
 * patch + `updatedAt` sempre.
 */
function parsePatch(raw: unknown): Record<string, unknown> {
  if (raw == null || typeof raw !== 'object') throw new InputError('patch inválido');
  const o = raw as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if ('postId' in o) patch.postId = optPostId(o.postId);
  if ('data' in o) patch.data = parseData(o.data);
  if ('formato' in o) patch.formato = parseFormato(o.formato);
  if ('tema' in o) patch.tema = optStr(o.tema, 300);
  if ('tempoMedioS' in o) patch.tempoMedioS = optNum(o.tempoMedioS, 'tempoMedioS');
  if ('permalink' in o) patch.permalink = optStr(o.permalink, 500);
  if ('mediaId' in o) patch.mediaId = optStr(o.mediaId, 100);
  for (const f of INT_FIELDS) {
    if (f in o) patch[f] = optInt(o[f], f);
  }

  if (Object.keys(patch).length === 0) throw new InputError('nada para atualizar');
  patch.updatedAt = new Date();
  return patch;
}

/** Sessão obrigatória (defesa 1). Retorna null → o handler responde 401. */
async function getSession(c: Context) {
  return auth.api.getSession({ headers: c.req.raw.headers });
}

/** Colunas devolvidas ao cliente após escrever (contrato mínimo). */
const RETURN_COLS = {
  id: conteudoDesempenho.id,
  postId: conteudoDesempenho.postId,
  data: conteudoDesempenho.data,
  formato: conteudoDesempenho.formato,
  tema: conteudoDesempenho.tema,
  alcance: conteudoDesempenho.alcance,
  visualizacoes: conteudoDesempenho.visualizacoes,
  curtidas: conteudoDesempenho.curtidas,
  comentarios: conteudoDesempenho.comentarios,
  compartilhamentos: conteudoDesempenho.compartilhamentos,
  salvamentos: conteudoDesempenho.salvamentos,
  visitasPerfil: conteudoDesempenho.visitasPerfil,
  seguidores: conteudoDesempenho.seguidores,
  duracaoS: conteudoDesempenho.duracaoS,
  tempoMedioS: conteudoDesempenho.tempoMedioS,
  permalink: conteudoDesempenho.permalink,
} as const;

/**
 * POST /api/conteudo/desempenho — cria 1..N medições. Aceita `{ posts: [...] }`
 * OU uma única medição no corpo. Grava tudo num INSERT e devolve as criadas.
 */
export async function handleCriarDesempenho(c: Context): Promise<Response> {
  if (!(await getSession(c))) return c.json({ error: 'Não autenticado' }, 401);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'JSON inválido no corpo' }, 400);
  }

  try {
    const lista = Array.isArray((body as { posts?: unknown })?.posts)
      ? (body as { posts: unknown[] }).posts
      : [body];
    if (lista.length === 0) return c.json({ error: 'nenhuma medição enviada' }, 400);
    if (lista.length > 100) return c.json({ error: 'máximo de 100 medições por vez' }, 400);

    const values = lista.map(parseNova);
    const created = await dbContent
      .insert(conteudoDesempenho)
      .values(values as never)
      .returning(RETURN_COLS);
    return c.json({ created }, 201);
  } catch (err) {
    if (err instanceof InputError) return c.json({ error: err.message }, err.status);
    console.error('[desempenho] erro ao criar:', err instanceof Error ? err.message : err);
    return c.json({ error: 'Erro ao gravar o desempenho' }, 500);
  }
}

/** PATCH /api/conteudo/desempenho/:id — edita uma medição (patch parcial). */
export async function handleAtualizarDesempenho(c: Context): Promise<Response> {
  if (!(await getSession(c))) return c.json({ error: 'Não autenticado' }, 401);

  const id = c.req.param('id');
  if (!id || !UUID_RE.test(id)) return c.json({ error: 'id inválido' }, 400);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'JSON inválido no corpo' }, 400);
  }

  try {
    const patch = parsePatch(body);
    const [row] = await dbContent
      .update(conteudoDesempenho)
      .set(patch)
      .where(eq(conteudoDesempenho.id, id))
      .returning(RETURN_COLS);
    if (!row) return c.json({ error: 'medição não encontrada' }, 404);
    return c.json({ updated: row });
  } catch (err) {
    if (err instanceof InputError) return c.json({ error: err.message }, err.status);
    console.error('[desempenho] erro ao atualizar:', err instanceof Error ? err.message : err);
    return c.json({ error: 'Erro ao atualizar a medição' }, 500);
  }
}

/** DELETE /api/conteudo/desempenho/:id — remove uma medição. */
export async function handleRemoverDesempenho(c: Context): Promise<Response> {
  if (!(await getSession(c))) return c.json({ error: 'Não autenticado' }, 401);

  const id = c.req.param('id');
  if (!id || !UUID_RE.test(id)) return c.json({ error: 'id inválido' }, 400);

  try {
    const [row] = await dbContent
      .delete(conteudoDesempenho)
      .where(eq(conteudoDesempenho.id, id))
      .returning({ id: conteudoDesempenho.id });
    if (!row) return c.json({ error: 'medição não encontrada' }, 404);
    return c.json({ deleted: row.id });
  } catch (err) {
    console.error('[desempenho] erro ao remover:', err instanceof Error ? err.message : err);
    return c.json({ error: 'Erro ao remover a medição' }, 500);
  }
}
