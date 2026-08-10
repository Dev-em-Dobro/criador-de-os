/**
 * apps/dobro — rota de ESCRITA do relatório semanal (autenticada).
 *
 * "Fechar semana" grava, numa linha por semana, DUAS coisas:
 *   · os números como foram apresentados na reunião (snapshot). `conteudo_desempenho`
 *     é atualizado por upsert a cada sincronização, então recalcular a mesma semana
 *     meses depois pode dar outro número. O snapshot é o que foi visto;
 *   · o registro da reunião (aprendizado, hipóteses, responsáveis, prazos), que é o
 *     produto da conversa e não existia em lugar nenhum do OS.
 *
 * As mesmas 3 defesas de `conteudo.ts`: auth-first, contrato fechado de campos e
 * escrita pela role `app_content`.
 *
 * Endpoint (montado em app.ts):
 *   - POST /api/relatorio → cria OU atualiza a semana (upsert por `semana_inicio`).
 *
 * Não existe DELETE de propósito: semana fechada é registro histórico. Refechar
 * a mesma semana atualiza a linha, o que também é o caminho pra corrigir um
 * número que entrou errado.
 */

import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { auth } from './auth.js';
import { dbContent } from '../db/client.js';
import { relatorioSemanal } from '../db/schema.js';
import { desmontarPostPorIa } from './relatorio-dna.js';
import { getAgencyAnthropicKey } from './env.js';

/** Regex leve de UUID — barra id malformado com 400 limpo. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fase do negócio na semana (a 2ª pergunta da pauta). Aceita vazio: melhor não
 * declarar do que declarar errado, e semana antiga não tem como saber.
 */
const FASES = ['atracao', 'aquecimento', 'lancamento', 'vendas', 'retencao'] as const;

/** Erro de validação com status HTTP para resposta limpa. */
class InputError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 = 400,
  ) {
    super(message);
  }
}

/** Texto opcional → trim ou null. */
function optStr(value: unknown, max = 4000): string | null {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  return s ? s.slice(0, max) : null;
}

/**
 * As oito respostas da desmontagem do melhor post (seção 5 da pauta). Formato e
 * Resultado, os outros dois elementos da tabela do doc, não entram: a tela os
 * responde com dado, e gravá-los aqui criaria uma segunda versão do mesmo número.
 */
const DNA_CAMPOS = [
  'publico',
  'dorDesejo',
  'gancho',
  'promessa',
  'linguagem',
  'desenvolvimento',
  'visual',
  'cta',
] as const;

/**
 * Contrato FECHADO do `dna` (defesa 2, igual ao resto da rota): só as oito chaves
 * conhecidas entram, cada uma como texto curto. Chave desconhecida é ignorada em
 * silêncio — o JSONB é do nosso formulário, não um saco aberto que o cliente
 * enche. Devolve null quando ninguém respondeu nada, para não gravar `{}` e
 * fazer a semana parecer preenchida.
 */
function parseDna(value: unknown): Record<string, string> | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null;
  const o = value as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const campo of DNA_CAMPOS) {
    const texto = optStr(o[campo], 500);
    if (texto) out[campo] = texto;
  }
  return Object.keys(out).length ? out : null;
}

/** Inteiro opcional (aceita number ou string numérica); nunca NaN no banco. */
function optInt(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/**
 * Normaliza a semana recebida para a SEGUNDA-FEIRA em UTC, meia-noite.
 *
 * O cliente manda 'YYYY-MM-DD' (o dia da segunda que ele está exibindo). Fixar em
 * UTC evita que o mesmo relatório caia em duas linhas conforme o fuso de quem
 * fechou — `semana_inicio` é chave única, e duas linhas para a mesma semana
 * quebrariam a comparação.
 */
function parseSemana(value: unknown): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new InputError('semanaInicio inválida (use YYYY-MM-DD, a segunda-feira da semana)');
  }
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new InputError('semanaInicio inválida');
  if (d.getUTCDay() !== 1) throw new InputError('semanaInicio precisa ser uma segunda-feira');
  return d;
}

/**
 * POST /api/relatorio/desmontar — a IA lê o post e devolve um RASCUNHO dos oito
 * campos da desmontagem (seção 5 da pauta).
 *
 * NÃO grava nada de propósito: devolve o texto para a tela preencher os campos,
 * e quem fecha a semana é gente. Se a resposta da IA fosse salva direto, a
 * reunião passaria a validar o que a máquina achou em vez de desmontar o post,
 * que é o ponto do exercício.
 */
export async function handleDesmontarPost(c: Context): Promise<Response> {
  if (!(await auth.api.getSession({ headers: c.req.raw.headers }))) {
    return c.json({ error: 'Não autenticado' }, 401);
  }

  const apiKey = getAgencyAnthropicKey();
  if (!apiKey) {
    return c.json({ error: 'Análise por IA não configurada (defina ANTHROPIC_API_KEY).' }, 503);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'JSON inválido no corpo' }, 400);
  }

  const medicaoId = (body as { medicaoId?: unknown })?.medicaoId;
  if (typeof medicaoId !== 'string' || !UUID_RE.test(medicaoId)) {
    return c.json({ error: 'medicaoId inválido' }, 400);
  }

  try {
    // A origem serve para buscar a capa em produção, onde a function não enxerga
    // a pasta `public/` (lá o arquivo é servido como estático pelo mesmo host).
    const origem = (() => {
      try {
        return new URL(c.req.url).origin;
      } catch {
        return null;
      }
    })();
    const r = await desmontarPostPorIa(dbContent, apiKey, medicaoId, origem);
    if (!r) return c.json({ error: 'post medido não encontrado' }, 404);
    return c.json(r);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/recus/i.test(msg)) return c.json({ error: msg }, 422);
    console.error('[relatorio:desmontar] erro:', msg);
    return c.json({ error: 'Erro ao analisar o post' }, 500);
  }
}

/**
 * POST /api/relatorio — fecha (ou refecha) uma semana.
 *
 * `destaques` entra como JSON livre de propósito: é o retrato dos campeões e do
 * melhor/pior como a tela mostrou, e o formato dessa tela vai mudar. Validar
 * campo a campo aqui congelaria a UI; o que precisa ser confiável são os números
 * e os textos da decisão, que são validados.
 */
export async function handleFecharSemana(c: Context): Promise<Response> {
  if (!(await auth.api.getSession({ headers: c.req.raw.headers }))) {
    return c.json({ error: 'Não autenticado' }, 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'JSON inválido no corpo' }, 400);
  }

  try {
    const o = (body ?? {}) as Record<string, unknown>;
    const semanaInicio = parseSemana(o.semanaInicio);
    const destaques = o.destaques != null && typeof o.destaques === 'object' ? o.destaques : null;

    const valores = {
      semanaInicio,
      alcance: optInt(o.alcance),
      visualizacoes: optInt(o.visualizacoes),
      interacoes: optInt(o.interacoes),
      seguidores: optInt(o.seguidores),
      postsPublicados: optInt(o.postsPublicados),
      postsPlanejados: optInt(o.postsPlanejados),
      destaques,
      dna: parseDna(o.dna),
      fase: typeof o.fase === 'string' && (FASES as readonly string[]).includes(o.fase) ? o.fase : null,
      eventoExterno: optStr(o.eventoExterno),
      campanha: optStr(o.campanha),
      aprendizado: optStr(o.aprendizado),
      estruturaVencedora: optStr(o.estruturaVencedora),
      erroEvitar: optStr(o.erroEvitar),
      hipoteses: optStr(o.hipoteses),
      responsaveis: optStr(o.responsaveis),
      prazos: optStr(o.prazos),
      metricaEsperada: optStr(o.metricaEsperada),
      updatedAt: new Date(),
    };

    const [row] = await dbContent
      .insert(relatorioSemanal)
      .values(valores)
      .onConflictDoUpdate({
        target: relatorioSemanal.semanaInicio,
        set: {
          alcance: sql`excluded.alcance`,
          visualizacoes: sql`excluded.visualizacoes`,
          interacoes: sql`excluded.interacoes`,
          seguidores: sql`excluded.seguidores`,
          postsPublicados: sql`excluded.posts_publicados`,
          postsPlanejados: sql`excluded.posts_planejados`,
          destaques: sql`excluded.destaques`,
          dna: sql`excluded.dna`,
          fase: sql`excluded.fase`,
          eventoExterno: sql`excluded.evento_externo`,
          campanha: sql`excluded.campanha`,
          aprendizado: sql`excluded.aprendizado`,
          estruturaVencedora: sql`excluded.estrutura_vencedora`,
          erroEvitar: sql`excluded.erro_evitar`,
          hipoteses: sql`excluded.hipoteses`,
          responsaveis: sql`excluded.responsaveis`,
          prazos: sql`excluded.prazos`,
          metricaEsperada: sql`excluded.metrica_esperada`,
          updatedAt: new Date(),
        },
      })
      .returning({ id: relatorioSemanal.id, semanaInicio: relatorioSemanal.semanaInicio });

    return c.json({ ok: true, relatorio: row }, 200);
  } catch (err) {
    if (err instanceof InputError) return c.json({ error: err.message }, err.status);
    console.error('[relatorio] erro ao fechar semana:', err instanceof Error ? err.message : err);
    return c.json({ error: 'Erro ao gravar o relatório da semana' }, 500);
  }
}
