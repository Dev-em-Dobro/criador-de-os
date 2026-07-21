/**
 * apps/dobro — rotas de ESCRITA do cronograma de Conteúdo (autenticadas).
 *
 * O criador cadastra/edita o cronograma da semana pela tela `/conteudo`. Estas
 * são as PRIMEIRAS rotas de escrita de NEGÓCIO do app (o webhook do Telegram
 * escreve `referencias`; aqui escrevemos `conteudo_posts`). As 3 defesas seguem
 * o mesmo espírito de `/api/query`:
 *   1. auth-first (fail-closed): sem sessão Better Auth → 401 antes de tocar o banco;
 *   2. contrato fechado de campos: só as colunas conhecidas de `conteudo_posts`
 *      entram — enums validados, o resto é ignorado (nunca confiamos no corpo);
 *   3. escrita via role `app_content` (SELECT/INSERT/UPDATE/DELETE só em
 *      `conteudo_posts`) — mesmo um bug aqui não toca auth nem outras tabelas.
 *
 * Endpoints (montados em app.ts):
 *   - POST   /api/conteudo       → cria 1..N posts (a semana toda de uma vez).
 *   - PATCH  /api/conteudo/:id   → edita um post (patch parcial).
 *   - DELETE /api/conteudo/:id   → remove um post.
 */

import type { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { auth } from './auth';
import { dbContent } from '../db/client';
import { conteudoPosts } from '../db/schema';

// --- Contrato fechado de valores (defesa 2) ---
const FORMATOS = ['carrossel', 'reels', 'story', 'post'] as const;
const ESTADOS = ['rascunho', 'pronto', 'publicado'] as const;
type Formato = (typeof FORMATOS)[number];
type Estado = (typeof ESTADOS)[number];

/** Regex leve de UUID — barra id malformado com 400 limpo (em vez de 500 do banco). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Campos que o cliente pode gravar em um post do cronograma. */
interface PostFields {
  titulo: string;
  dataProgramada: Date | null;
  formato: Formato;
  estado: Estado;
  ctaFinal: string | null;
  linkPresenteNotion: string | null;
  capaUrl: string | null;
  briefingUrl: string | null;
  briefing: string | null;
  refsLinks: string | null;
}

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
function optStr(value: unknown, max = 2000): string | null {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (!s) return null;
  return s.slice(0, max);
}

/** Converte o valor de data recebido (ISO/'YYYY-MM-DD') em Date válida ou null. */
function parseData(value: unknown): Date | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') throw new InputError('data_programada inválida');
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new InputError('data_programada inválida');
  return d;
}

/** Valida um enum contra a allowlist, com default quando ausente. */
function parseEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
  campo: string,
): T {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  throw new InputError(`${campo} inválido (use: ${allowed.join(', ')})`);
}

/** Valida o corpo de UM post para criação (título é obrigatório). */
function parseNovoPost(raw: unknown): PostFields {
  if (raw == null || typeof raw !== 'object') throw new InputError('post inválido');
  const o = raw as Record<string, unknown>;
  const titulo = optStr(o.titulo, 200);
  if (!titulo) throw new InputError('título é obrigatório');
  return {
    titulo,
    dataProgramada: parseData(o.dataProgramada),
    formato: parseEnum(o.formato, FORMATOS, 'carrossel', 'formato'),
    estado: parseEnum(o.estado, ESTADOS, 'rascunho', 'estado'),
    ctaFinal: optStr(o.ctaFinal),
    linkPresenteNotion: optStr(o.linkPresenteNotion),
    capaUrl: optStr(o.capaUrl),
    briefingUrl: optStr(o.briefingUrl),
    briefing: optStr(o.briefing, 8000),
    refsLinks: optStr(o.refsLinks, 4000),
  };
}

/**
 * Valida um PATCH parcial: só as chaves PRESENTES entram no `set`. Título, se
 * presente, não pode ficar vazio. Retorna o patch + `updatedAt` sempre.
 */
function parsePatch(raw: unknown): Record<string, unknown> {
  if (raw == null || typeof raw !== 'object') throw new InputError('patch inválido');
  const o = raw as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if ('titulo' in o) {
    const titulo = optStr(o.titulo, 200);
    if (!titulo) throw new InputError('título não pode ficar vazio');
    patch.titulo = titulo;
  }
  if ('dataProgramada' in o) patch.dataProgramada = parseData(o.dataProgramada);
  if ('formato' in o) patch.formato = parseEnum(o.formato, FORMATOS, 'carrossel', 'formato');
  if ('estado' in o) patch.estado = parseEnum(o.estado, ESTADOS, 'rascunho', 'estado');
  if ('ctaFinal' in o) patch.ctaFinal = optStr(o.ctaFinal);
  if ('linkPresenteNotion' in o) patch.linkPresenteNotion = optStr(o.linkPresenteNotion);
  if ('capaUrl' in o) patch.capaUrl = optStr(o.capaUrl);
  if ('briefingUrl' in o) patch.briefingUrl = optStr(o.briefingUrl);
  if ('briefing' in o) patch.briefing = optStr(o.briefing, 8000);
  if ('refsLinks' in o) patch.refsLinks = optStr(o.refsLinks, 4000);

  if (Object.keys(patch).length === 0) throw new InputError('nada para atualizar');
  patch.updatedAt = new Date();
  return patch;
}

/** Sessão obrigatória (defesa 1). Retorna null → o handler responde 401. */
async function getSession(c: Context) {
  return auth.api.getSession({ headers: c.req.raw.headers });
}

/** Colunas devolvidas ao cliente após escrever (contrato mínimo, igual à view). */
const RETURN_COLS = {
  id: conteudoPosts.id,
  titulo: conteudoPosts.titulo,
  capaUrl: conteudoPosts.capaUrl,
  dataProgramada: conteudoPosts.dataProgramada,
  ctaFinal: conteudoPosts.ctaFinal,
  linkPresenteNotion: conteudoPosts.linkPresenteNotion,
  briefingUrl: conteudoPosts.briefingUrl,
  briefing: conteudoPosts.briefing,
  refsLinks: conteudoPosts.refsLinks,
  estado: conteudoPosts.estado,
  formato: conteudoPosts.formato,
} as const;

/**
 * POST /api/conteudo — cria 1..N posts. Aceita `{ posts: [...] }` (a semana toda)
 * OU um único post no corpo. Grava tudo num INSERT e devolve os criados.
 */
export async function handleCriarConteudo(c: Context): Promise<Response> {
  if (!(await getSession(c))) return c.json({ error: 'Não autenticado' }, 401);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'JSON inválido no corpo' }, 400);
  }

  try {
    const lista = Array.isArray((body as { posts?: unknown })?.posts)
      ? ((body as { posts: unknown[] }).posts)
      : [body];
    if (lista.length === 0) return c.json({ error: 'nenhum post enviado' }, 400);
    if (lista.length > 50) return c.json({ error: 'máximo de 50 posts por vez' }, 400);

    const values = lista.map(parseNovoPost).map((p) => ({
      titulo: p.titulo,
      dataProgramada: p.dataProgramada,
      formato: p.formato,
      estado: p.estado,
      ctaFinal: p.ctaFinal,
      linkPresenteNotion: p.linkPresenteNotion,
      capaUrl: p.capaUrl,
      briefingUrl: p.briefingUrl,
      briefing: p.briefing,
      refsLinks: p.refsLinks,
      plataforma: 'instagram',
    }));

    const created = await dbContent.insert(conteudoPosts).values(values).returning(RETURN_COLS);
    return c.json({ created }, 201);
  } catch (err) {
    if (err instanceof InputError) return c.json({ error: err.message }, err.status);
    console.error('[conteudo] erro ao criar:', err instanceof Error ? err.message : err);
    return c.json({ error: 'Erro ao gravar o cronograma' }, 500);
  }
}

/** PATCH /api/conteudo/:id — edita um post (patch parcial). */
export async function handleAtualizarConteudo(c: Context): Promise<Response> {
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
      .update(conteudoPosts)
      .set(patch)
      .where(eq(conteudoPosts.id, id))
      .returning(RETURN_COLS);
    if (!row) return c.json({ error: 'post não encontrado' }, 404);
    return c.json({ updated: row });
  } catch (err) {
    if (err instanceof InputError) return c.json({ error: err.message }, err.status);
    console.error('[conteudo] erro ao atualizar:', err instanceof Error ? err.message : err);
    return c.json({ error: 'Erro ao atualizar o post' }, 500);
  }
}

/** DELETE /api/conteudo/:id — remove um post. */
export async function handleRemoverConteudo(c: Context): Promise<Response> {
  if (!(await getSession(c))) return c.json({ error: 'Não autenticado' }, 401);

  const id = c.req.param('id');
  if (!id || !UUID_RE.test(id)) return c.json({ error: 'id inválido' }, 400);

  try {
    const [row] = await dbContent
      .delete(conteudoPosts)
      .where(eq(conteudoPosts.id, id))
      .returning({ id: conteudoPosts.id });
    if (!row) return c.json({ error: 'post não encontrado' }, 404);
    return c.json({ deleted: row.id });
  } catch (err) {
    console.error('[conteudo] erro ao remover:', err instanceof Error ? err.message : err);
    return c.json({ error: 'Erro ao remover o post' }, 500);
  }
}
