/**
 * apps/dobro — rota de GERAÇÃO de rascunho com IA (autenticada).
 *
 * É a versão "pela tela" do que os scripts admin (`conteudo:processar`,
 * `conteudo:gerar-url`) fazem no terminal: o criador manda um TEMA livre OU um
 * LINK de referência do Instagram e a Claude gera um carrossel/reels em AIDA,
 * gravado como 'rascunho' no board. Mesmas 3 defesas de `/api/conteudo`:
 *   1. auth-first (fail-closed): sem sessão Better Auth → 401 antes de tocar o banco;
 *   2. contrato fechado de entrada: só `tema` OU `url` (+ `formato` no enum) entram;
 *   3. escrita via role `app_pipeline` (SELECT/INSERT/UPDATE em `referencias` +
 *      SELECT/INSERT em `conteudo_posts`) — menor privilégio que o owner do script.
 *
 * A chave da Claude (BYOK/agência) vive SÓ no servidor (`ANTHROPIC_API_KEY`). Sem
 * ela a rota responde 503 claro — nunca 500 cru. Endpoint montado em app.ts:
 *   - POST /api/conteudo/gerar  → { tema } | { url, nota? } (+ formato?) → cria 1 rascunho.
 */

import type { Context } from 'hono';
import { auth } from './auth.js';
import { dbPipeline } from '../db/client.js';
import { referencias } from '../db/schema.js';
import { criarRascunho, processarReferenciasPendentes } from './conteudo-pipeline.js';
import { getAgencyAnthropicKey } from './env.js';

/** Formatos que o criador pode forçar no NOSSO post. */
const FORMATOS = ['carrossel', 'reels'] as const;
type FormatoAlvo = (typeof FORMATOS)[number];

/** Erro de validação com status HTTP para resposta limpa. */
class InputError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 422 = 400,
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

/** Valida o formato alvo contra a allowlist (default 'carrossel'). */
function parseFormato(value: unknown): FormatoAlvo {
  if (value == null || value === '') return 'carrossel';
  if (typeof value === 'string' && (FORMATOS as readonly string[]).includes(value)) {
    return value as FormatoAlvo;
  }
  throw new InputError(`formato inválido (use: ${FORMATOS.join(', ')})`);
}

/** Aceita só http(s) — barra javascript:/data: e lixo antes de semear a referência. */
function parseUrl(value: string): string {
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    throw new InputError('link inválido');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new InputError('o link precisa começar com http(s)://');
  }
  return u.toString();
}

/**
 * POST /api/conteudo/gerar — gera UM rascunho com IA (carrossel/reels em AIDA) a
 * partir de um tema livre OU de um link de referência do Instagram.
 */
export async function handleGerarConteudo(c: Context): Promise<Response> {
  // DEFESA 1 — auth-first (fail-closed). Sem sessão → 401 antes de qualquer trabalho.
  if (!(await auth.api.getSession({ headers: c.req.raw.headers }))) {
    return c.json({ error: 'Não autenticado' }, 401);
  }

  // A chave da Claude é pré-requisito: sem ela, nada a gerar (503, não 500).
  const apiKey = getAgencyAnthropicKey();
  if (!apiKey) {
    return c.json(
      { error: 'Gerador de IA não configurado (defina ANTHROPIC_API_KEY no servidor).' },
      503,
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'JSON inválido no corpo' }, 400);
  }

  try {
    const o = (body ?? {}) as Record<string, unknown>;
    const tema = optStr(o.tema, 600);
    const urlRaw = optStr(o.url, 2000);
    const formatoAlvo = parseFormato(o.formato);

    if (!tema && !urlRaw) {
      throw new InputError('envie um `tema` ou um `url` de referência');
    }

    // Caminho LINK: semeia a referência (como o webhook do Telegram faria) e
    // deixa o pipeline enriquecer com o conteúdo real do post antes de gerar.
    if (urlRaw) {
      const url = parseUrl(urlRaw);
      const nota = optStr(o.nota, 500);
      const formatoRef = /\/(reel|reels|tv)\//i.test(url) ? 'reels' : null;
      const [ref] = await dbPipeline
        .insert(referencias)
        .values({
          canal: 'manual',
          origemUrl: url,
          tipo: 'link',
          formatoRef,
          conteudoBruto: url,
          notaTime: nota,
          status: 'pendente',
        })
        .returning({ id: referencias.id });
      if (!ref?.id) throw new InputError('falha ao registrar a referência', 422);

      const r = await criarRascunho(dbPipeline, apiKey, { referenciaId: ref.id, formatoAlvo });
      if (!r.created) throw new InputError(r.reason ?? 'não foi possível gerar o rascunho', 422);
      return c.json(
        { created: true, id: r.id, titulo: r.titulo, formato: r.formato, previsao: r.previsao ?? null },
        201,
      );
    }

    // Caminho TEMA livre: gera direto, sem referência.
    const r = await criarRascunho(dbPipeline, apiKey, { tema: tema!, formatoAlvo });
    if (!r.created) throw new InputError(r.reason ?? 'não foi possível gerar o rascunho', 422);
    return c.json(
      { created: true, id: r.id, titulo: r.titulo, formato: r.formato, previsao: r.previsao ?? null },
      201,
    );
  } catch (err) {
    if (err instanceof InputError) return c.json({ error: err.message }, err.status);
    // Recusa do modelo é do usuário saber (mensagem clara), não um 500 cru.
    const msg = err instanceof Error ? err.message : String(err);
    if (/recus/i.test(msg)) return c.json({ error: msg }, 422);
    console.error('[conteudo:gerar] erro inesperado:', msg);
    return c.json({ error: 'Erro ao gerar o rascunho' }, 500);
  }
}

/**
 * GET /api/cron/processar-referencias — processa as referências pendentes do
 * Telegram AUTOMATICAMENTE (Vercel Cron): teardown + rascunho no board, sem
 * ninguém rodar à mão. Valida o CRON_SECRET no header (sem sessão do Better Auth).
 */
export async function handleCronProcessarReferencias(c: Context): Promise<Response> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || c.req.header('authorization') !== `Bearer ${secret}`) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  const apiKey = getAgencyAnthropicKey();
  if (!apiKey) return c.json({ error: 'ANTHROPIC_API_KEY ausente no servidor' }, 503);
  try {
    // A function tem teto de 60s e cada ref leva ~15s (IA + enriquecimento) + ~13s
    // da previsão. Em vez de chutar um limite fixo, damos um ORÇAMENTO de 25s: só
    // começa mais uma referência se ainda houver tempo. O que sobrar fica pendente
    // para a próxima execução.
    const { processadas, rascunhos, adiadas } = await processarReferenciasPendentes(apiKey, 3, 25_000);
    // `adiadas` são carrosséis esperando o processamento local (que lê os slides).
    // Ficam visíveis aqui pra não parecer que a fila simplesmente não andou.
    console.log(
      `[cron:processar] ${processadas} referência(s), ${rascunhos.length} rascunho(s), ${adiadas} carrossel(éis) adiado(s)`,
    );
    return c.json({ ok: true, processadas, rascunhos: rascunhos.length, adiadas });
  } catch (err) {
    console.error('[cron:processar] erro:', err instanceof Error ? err.message : err);
    return c.json({ error: 'Erro ao processar referências' }, 500);
  }
}
