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
 *       (limit = quantas mídias recentes; default 30, máx 500 — pagina a API)
 */

import { db } from '../../db/client';
import { syncDesempenhoFromInsights } from '../desempenho-sync';
import { InsightsError } from '../instagram-insights';

async function main(): Promise<void> {
  const limit = Math.min(Math.max(Number(process.argv[2]) || 30, 1), 500);

  console.log(`[sync] buscando perfil + insights das últimas ${limit} mídias...`);
  const { profile, inserted, updated, total, vinculadas } = await syncDesempenhoFromInsights(db, {
    limit,
  });

  console.log(
    `[sync] perfil @${profile.username ?? '?'} — ` +
      `${profile.followersCount?.toLocaleString('pt-BR') ?? '?'} seguidores, ` +
      `${profile.mediaCount?.toLocaleString('pt-BR') ?? '?'} posts.`,
  );
  console.log(
    `[sync] OK — ${total} mídias · ${inserted} inseridos, ${updated} atualizados, ` +
      `${vinculadas} casado(s) com card do board.\n` +
      `[sync] Retenção dos reels precisa da DURAÇÃO (não vem da API): preencha "duração" na tela.\n` +
      `[sync] Passivo antigo de vínculos: pnpm --filter @app/dobro conteudo:vincular --dry`,
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
