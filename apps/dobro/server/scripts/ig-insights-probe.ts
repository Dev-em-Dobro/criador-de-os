/**
 * apps/dobro — SONDA de diagnóstico da Instagram Graph API de Insights (dev).
 *
 * Lê o token do .env (`META_APP_TOKEN`/`INSTAGRAM_INSIGHTS_TOKEN`) via env.ts e:
 *   1) mostra QUEM é o token (/me) e a conta business vinculada (/me/accounts);
 *   2) lê o perfil (username, followers_count, media_count);
 *   3) lista as últimas mídias com seu tipo (FEED/REELS/…);
 *   4) para 1 mídia de cada tipo, testa CADA métrica de insights isoladamente e
 *      imprime as que valem + o valor — é assim que calibramos o mapeamento do
 *      "Sincronizar" (Fase 1) com a API REAL, sem inventar nomes de métrica.
 *
 * Segurança: NUNCA imprime o token nem a URL (que o carrega). Só status + corpo
 * das respostas, e não pede `access_token` de página (evita vazar segredo no log).
 *
 * Uso: pnpm --filter @app/dobro exec tsx server/scripts/ig-insights-probe.ts
 */

import { getInstagramInsightsToken, getInstagramIgUserId } from '../env';

const GRAPH = 'https://graph.facebook.com/v21.0';

/** Métricas candidatas de insights POR MÍDIA (nomes variam por tipo/versão). */
const CANDIDATE_METRICS = [
  'reach',
  'saved',
  'shares',
  'likes',
  'comments',
  'total_interactions',
  'views',
  'plays',
  'impressions',
  'profile_visits',
  'profile_activity',
  'follows',
  'ig_reels_avg_watch_time',
  'ig_reels_video_view_total_time',
  'clips_replays_count',
] as const;

type Json = Record<string, unknown>;
const asObj = (v: unknown): Json => (v && typeof v === 'object' ? (v as Json) : {});
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const s = (v: unknown): string => (v == null ? '' : String(v));

interface ApiResult {
  ok: boolean;
  status: number;
  json: unknown;
}

/** Chama a Graph API com o token do env (nunca logando a URL/token). */
async function api(path: string, params: Record<string, string>): Promise<ApiResult> {
  const token = getInstagramInsightsToken();
  const url = new URL(`${GRAPH}/${path.replace(/^\//, '')}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', token ?? '');
  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, json };
}

/** Extrai o valor de uma resposta de /insights (values[0].value ou total_value.value). */
function insightValue(json: unknown): unknown {
  const first = asArr(asObj(json).data).map(asObj)[0];
  if (!first) return undefined;
  const values = asArr(first.values).map(asObj);
  if (values[0] && 'value' in values[0]) return values[0].value;
  const tv = asObj(first.total_value);
  if ('value' in tv) return tv.value;
  return undefined;
}

async function main(): Promise<void> {
  const token = getInstagramInsightsToken();
  if (!token) {
    console.error(
      '[probe] token ausente. Defina META_APP_TOKEN (ou INSTAGRAM_INSIGHTS_TOKEN) em apps/dobro/.env e rode de novo.',
    );
    process.exit(1);
  }
  console.log(`[probe] token presente (${token.length} chars).`);

  // 1) Quem é o token? + quais permissões recebeu.
  const me = await api('me', { fields: 'id,name' });
  console.log('\n=== /me ===', me.status, JSON.stringify(me.json));

  const perms = await api('me/permissions', {});
  const granted = asArr(asObj(perms.json).data)
    .map(asObj)
    .filter((p) => s(p.status) === 'granted')
    .map((p) => s(p.permission));
  console.log('=== permissões concedidas ===', granted.join(', ') || '(nenhuma)');

  // 2) Descobrir a conta IG business (env tem prioridade; senão via /me/accounts).
  let igId = getInstagramIgUserId() ?? '';
  if (!igId) {
    const accts = await api('me/accounts', { fields: 'name,instagram_business_account' });
    console.log('\n=== /me/accounts ===', accts.status, JSON.stringify(accts.json));
    const page = asArr(asObj(accts.json).data)
      .map(asObj)
      .find((p) => asObj(p.instagram_business_account).id);
    igId = page ? s(asObj(page.instagram_business_account).id) : '';
  } else {
    console.log('\n[probe] IG user id via .env:', igId);
  }
  if (!igId) {
    console.error(
      '\n[probe] não encontrei instagram_business_account. Verifique: (a) permissões instagram_basic + instagram_manage_insights no token; (b) Instagram vinculado a uma Página do Facebook.',
    );
    process.exit(1);
  }

  // 3) Perfil (revela followers_count — o gate de seguidores).
  const prof = await api(igId, { fields: 'username,followers_count,media_count' });
  console.log('\n=== perfil ===', prof.status, JSON.stringify(prof.json));

  // 4) Últimas mídias com tipo.
  const media = await api(`${igId}/media`, {
    fields: 'id,caption,media_type,media_product_type,permalink,timestamp',
    limit: '12',
  });
  if (!media.ok) {
    console.error('\n[probe] falha ao listar mídias:', media.status, JSON.stringify(media.json));
    process.exit(1);
  }
  const items = asArr(asObj(media.json).data).map(asObj);
  console.log(`\n=== mídias (${items.length}) ===`);
  for (const m of items) {
    console.log(
      `- ${s(m.id)} | ${s(m.media_product_type)}/${s(m.media_type)} | ${s(m.timestamp).slice(0, 10)} | ${s(m.caption).slice(0, 48).replace(/\n/g, ' ')}`,
    );
  }

  // 5) Sondar insights: 1 mídia de cada tipo, cada métrica isolada.
  const seen = new Set<string>();
  const samples = items.filter((m) => {
    const key = `${s(m.media_product_type)}/${s(m.media_type)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  for (const m of samples) {
    const id = s(m.id);
    const kind = `${s(m.media_product_type)}/${s(m.media_type)}`;
    console.log(`\n=== insights de ${kind} (${id}) ===`);
    const ok: Record<string, unknown> = {};
    const bad: string[] = [];
    for (const metric of CANDIDATE_METRICS) {
      const r = await api(`${id}/insights`, { metric });
      if (r.ok) ok[metric] = insightValue(r.json);
      else bad.push(metric);
    }
    console.log('  ✓ válidas:', JSON.stringify(ok));
    console.log('  ✗ inválidas p/ este tipo:', bad.join(', ') || '(nenhuma)');
  }

  console.log('\n[probe] fim. Copie tudo acima (não há token no output) e me mande.');
}

main().catch((err) => {
  console.error('[probe] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
