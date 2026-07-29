/**
 * apps/dobro — Fase 1 do "Resumo de desempenho": SINCRONIZA os números reais de
 * cada post do Instagram (via Graph API de Insights) para `conteudo_desempenho`.
 *
 * O que faz:
 *   1) lê o perfil (mostra followers_count — o gate de seguidores destravado);
 *   2) pega as últimas N mídias com seus insights (mapa calibrado em
 *      `server/instagram-insights.ts`);
 *   3) UPSERT por `media_id` em `conteudo_desempenho`:
 *        - novo   → INSERT com data/formato/tema + todas as métricas;
 *        - existe → UPDATE só das métricas + permalink (preserva `duracao_s`,
 *          `tema`, `data` e `formato` que possam ter sido editados na mão).
 *
 * `duracao_s` (duração do reel, base da RETENÇÃO) NÃO vem da API — continua manual.
 * A tela deriva taxas/classificação; aqui só gravamos o sinal cru.
 *
 * Idempotente: rodar de novo só atualiza os números. Roda como OWNER (script admin,
 * igual aos seeds). NUNCA loga o token.
 *
 * Uso:  pnpm --filter @app/dobro ig:sync-desempenho [limit]
 *       (limit = quantas mídias recentes; default 30, máx 100)
 */

import { and, eq, isNotNull } from 'drizzle-orm';
import { db } from '../../db/client';
import { conteudoDesempenho } from '../../db/schema';
import {
  fetchProfile,
  fetchRecentMediaWithInsights,
  InsightsError,
  type MediaWithInsights,
} from '../instagram-insights';

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

async function main(): Promise<void> {
  const limit = Math.min(Math.max(Number(process.argv[2]) || 30, 1), 100);

  // 1) Perfil — followers_count é o gate de seguidores que abriu com o token.
  const perfil = await fetchProfile();
  console.log(
    `[sync] perfil @${perfil.username ?? '?'} — ` +
      `${perfil.followersCount?.toLocaleString('pt-BR') ?? '?'} seguidores, ` +
      `${perfil.mediaCount?.toLocaleString('pt-BR') ?? '?'} posts.`,
  );

  // 2) Últimas mídias com insights.
  console.log(`[sync] buscando insights das últimas ${limit} mídias...`);
  const midias = await fetchRecentMediaWithInsights({ limit, igUserId: perfil.igUserId });
  console.log(`[sync] ${midias.length} mídias retornadas.`);

  // 3) UPSERT por media_id.
  let inseridos = 0;
  let atualizados = 0;
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
      atualizados++;
    } else {
      await db.insert(conteudoDesempenho).values({
        mediaId: m.mediaId,
        data: paraData(m.timestamp),
        formato: m.formato,
        tema: m.caption?.replace(/\s+/g, ' ').trim().slice(0, 300),
        ...metricas,
      });
      inseridos++;
    }

    const taxaSalv =
      metricas.alcance && metricas.salvamentos != null
        ? ` salv ${((metricas.salvamentos / metricas.alcance) * 100).toFixed(1)}%`
        : '';
    console.log(
      `  ${existente ? '~' : '+'} ${m.formato.padEnd(9)} ` +
        `alc ${String(metricas.alcance ?? '—').padStart(6)}` +
        ` · ${(m.caption ?? '').replace(/\s+/g, ' ').slice(0, 40)}${taxaSalv}`,
    );
  }

  // Aviso: reels sem duração não têm retenção calculável (duração é manual).
  const reelsSemDuracao = await db
    .select({ id: conteudoDesempenho.id })
    .from(conteudoDesempenho)
    .where(and(eq(conteudoDesempenho.formato, 'reel'), isNotNull(conteudoDesempenho.mediaId)));

  console.log(
    `\n[sync] OK — ${inseridos} inseridos, ${atualizados} atualizados.\n` +
      `[sync] Retenção dos reels precisa da DURAÇÃO (não vem da API): ` +
      `preencha "duração" na tela p/ os ${reelsSemDuracao.length} reels sincronizados.`,
  );
}

main().catch((err) => {
  if (err instanceof InsightsError) {
    console.error(`[sync] FALHOU (${err.status ?? '?'}): ${err.message}`);
    if (err.body) console.error('[sync] corpo:', JSON.stringify(err.body));
  } else {
    console.error('[sync] FALHOU:', err instanceof Error ? err.message : err);
  }
  process.exit(1);
});
