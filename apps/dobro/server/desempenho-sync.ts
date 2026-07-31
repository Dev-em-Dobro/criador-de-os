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

import { eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { conteudoDesempenho } from '../db/schema.js';
import {
  fetchProfile,
  fetchRecentMediaWithInsights,
  type MediaWithInsights,
  type ProfileSummary,
} from './instagram-insights.js';

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

  return { profile, inserted, updated, total: midias.length };
}
