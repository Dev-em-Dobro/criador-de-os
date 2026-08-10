/**
 * apps/dobro — SINCRONIZAÇÃO do desempenho a partir do Instagram Insights.
 *
 * Núcleo reusável (sem console): pega as últimas N mídias com insights (via
 * `instagram-insights.ts`) e faz UPSERT por `media_id` em `conteudo_desempenho`.
 * Preserva `duracao_s`/`tema`/`data`/`formato` que possam ter sido editados na
 * mão (só atualiza métricas + permalink no caso de UPDATE). `duracao_s` (base da
 * retenção) NÃO vem da API — continua manual.
 *
 * Consumido por:
 *   - a rota autenticada `POST /api/conteudo/desempenho/sync` (role app_content);
 *   - o script admin `ig:sync-desempenho` (role owner).
 * Recebe o client Drizzle por parâmetro → cada caminho usa seu privilégio.
 */

import { eq, isNotNull, isNull } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { conteudoDesempenho, conteudoPosts } from '../db/schema.js';
import {
  fetchProfile,
  fetchRecentMediaWithInsights,
  type MediaWithInsights,
  type ProfileSummary,
} from './instagram-insights.js';
import { casarMedicoes, type Vinculo } from './desempenho-vinculo.js';

/** ms → segundos (1 casa) para o tempo médio de reels; undefined preserva. */
function msParaS(ms: number | undefined): number | undefined {
  if (ms == null) return undefined;
  return Math.round((ms / 1000) * 10) / 10;
}

/** ISO timestamp → Date válida (ou undefined). */
function paraData(iso: string | undefined): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Mídia+insights → colunas de `conteudo_desempenho` (drizzle omite `undefined`). */
function mapMetricas(m: MediaWithInsights) {
  const i = m.insights;
  return {
    alcance: i.reach,
    visualizacoes: i.views,
    curtidas: i.likes,
    comentarios: i.comments,
    compartilhamentos: i.shares,
    salvamentos: i.saved,
    visitasPerfil: i.profileVisits,
    seguidores: i.follows,
    tempoMedioS: msParaS(i.reelsAvgWatchTimeMs),
    permalink: m.permalink,
  };
}

export interface SyncResult {
  profile: ProfileSummary;
  inserted: number;
  updated: number;
  total: number;
  /** Quantas medições ganharam um card do board neste sync (ver `vincularMedicoes`). */
  vinculadas: number;
}

/** Resultado do casamento medição → card. */
export interface VinculoResult {
  /** Medições que ainda não tinham card e entraram na disputa. */
  candidatas: number;
  /** Vínculos aplicados (ou que seriam aplicados, em `dryRun`). */
  vinculadas: number;
  /** Todos os vereditos, inclusive os "não casou" com o motivo (para relatório). */
  vereditos: Vinculo[];
}

/**
 * Teto de vínculos por execução automática. O casamento em si é CPU barata, mas
 * cada gravação é um round-trip HTTP na Neon e o cron da Vercel tem 60s. O que
 * sobrar entra na próxima execução (a operação é idempotente). O script admin
 * passa `Infinity` e resolve o passivo todo de uma vez.
 */
const MAX_VINCULOS_AUTOMATICOS = 20;

/**
 * Preenche `post_id` nas medições que ainda não têm card, casando a legenda
 * publicada com a legenda do card (ver `desempenho-vinculo.ts` para as travas).
 *
 * É isto que liga o PREVISTO (`conteudo_previsoes`, gravada quando o rascunho
 * nasce) ao REAL (as métricas que voltam do Instagram). Sem este passo as duas
 * metades do placar da IA existem, mas nunca se encontram.
 *
 * Idempotente: só olha linhas com `post_id IS NULL` e nunca reatribui um card que
 * já tem medição. `dryRun` calcula tudo e não grava nada.
 */
export async function vincularMedicoes(
  db: Db,
  opts: { dryRun?: boolean; max?: number } = {},
): Promise<VinculoResult> {
  const max = opts.max ?? MAX_VINCULOS_AUTOMATICOS;

  const semCard = await db
    .select({
      id: conteudoDesempenho.id,
      tema: conteudoDesempenho.tema,
      data: conteudoDesempenho.data,
      formato: conteudoDesempenho.formato,
    })
    .from(conteudoDesempenho)
    .where(isNull(conteudoDesempenho.postId));

  if (semCard.length === 0) return { candidatas: 0, vinculadas: 0, vereditos: [] };

  const cards = await db
    .select({
      id: conteudoPosts.id,
      titulo: conteudoPosts.titulo,
      gancho: conteudoPosts.gancho,
      legenda: conteudoPosts.legenda,
      formato: conteudoPosts.formato,
      estado: conteudoPosts.estado,
      dataProgramada: conteudoPosts.dataProgramada,
      createdAt: conteudoPosts.createdAt,
    })
    .from(conteudoPosts);

  const jaVinculados = await db
    .select({ postId: conteudoDesempenho.postId })
    .from(conteudoDesempenho)
    .where(isNotNull(conteudoDesempenho.postId));

  const vereditos = casarMedicoes(
    semCard,
    cards,
    new Set(jaVinculados.map((r) => r.postId).filter((id): id is string => !!id)),
  );

  let vinculadas = 0;
  for (const v of vereditos) {
    if (!v.postId) continue;
    if (vinculadas >= max) break;
    if (!opts.dryRun) {
      await db
        .update(conteudoDesempenho)
        .set({ postId: v.postId, updatedAt: new Date() })
        .where(eq(conteudoDesempenho.id, v.medicaoId));
    }
    vinculadas++;
  }

  return { candidatas: semCard.length, vinculadas, vereditos };
}

/**
 * Sincroniza as últimas `limit` mídias (default 25, máx 500 — pagina a Graph API)
 * para `conteudo_desempenho`. Idempotente por `media_id`.
 */
export async function syncDesempenhoFromInsights(
  db: Db,
  opts: { limit?: number } = {},
): Promise<SyncResult> {
  const limit = Math.min(Math.max(opts.limit ?? 25, 1), 500);
  const profile = await fetchProfile();
  const midias = await fetchRecentMediaWithInsights({ limit, igUserId: profile.igUserId });

  let inserted = 0;
  let updated = 0;
  for (const m of midias) {
    const metricas = mapMetricas(m);
    const [existente] = await db
      .select({ id: conteudoDesempenho.id })
      .from(conteudoDesempenho)
      .where(eq(conteudoDesempenho.mediaId, m.mediaId))
      .limit(1);

    if (existente) {
      await db
        .update(conteudoDesempenho)
        .set({ ...metricas, updatedAt: new Date() })
        .where(eq(conteudoDesempenho.id, existente.id));
      updated++;
    } else {
      await db.insert(conteudoDesempenho).values({
        mediaId: m.mediaId,
        data: paraData(m.timestamp),
        formato: m.formato,
        tema: m.caption?.replace(/\s+/g, ' ').trim().slice(0, 300),
        ...metricas,
      });
      inserted++;
    }
  }

  // Com as métricas no lugar, tenta casar com os cards do board. Best-effort de
  // propósito: o sync já entregou o valor dele (os números). Se o casamento
  // falhar, as medições ficam sem card e a próxima execução tenta de novo.
  let vinculadas = 0;
  try {
    ({ vinculadas } = await vincularMedicoes(db));
  } catch (err) {
    console.warn(
      '[desempenho:vinculo] não casou medições com os cards:',
      err instanceof Error ? err.message : err,
    );
  }

  return { profile, inserted, updated, total: midias.length, vinculadas };
}
