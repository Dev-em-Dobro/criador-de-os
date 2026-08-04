/**
 * apps/dobro — CORE reutilizável da Instagram Graph API de Insights (BYOK).
 *
 * É a única porta de saída pra API de Insights do Instagram. Consumido por:
 *   - `server/scripts/ig-sync-desempenho.ts` (Fase 1 — preenche `conteudo_desempenho`);
 *   - (futuro) card de seguidores/crescimento do dashboard;
 *   - (futuro) aprendizado por performance dos carrosséis (few-shot dos top-N).
 *
 * Token: lido do env via `getInstagramInsightsToken()` (aceita META_APP_TOKEN ou
 * INSTAGRAM_INSIGHTS_TOKEN). Conta IG: `getInstagramIgUserId()` (INSTAGRAM_IG_USER_ID).
 *
 * Segurança: NUNCA loga o token nem a URL (que o carrega). Só status + corpo.
 *
 * Mapa de métricas CALIBRADO contra a API real (v21, perfil @devemdobro, 29/07/2026):
 *   comuns a todos:  reach, saved, shares, likes, comments, total_interactions, views
 *   só FEED (img/carrossel): profile_visits, follows
 *   só REELS: ig_reels_avg_watch_time (ms), ig_reels_video_view_total_time (ms)
 *   MORTAS na v21: plays, impressions (viraram `views`), clips_replays_count.
 */

import { getInstagramInsightsToken, getInstagramIgUserId } from './env.js';

const GRAPH = 'https://graph.facebook.com/v21.0';

/** Nosso enum de formato (bate com `conteudo_desempenho.formato`). */
export type Formato = 'reel' | 'carrossel' | 'post' | 'story';

/** Métricas de insights por mídia, já normalizadas (número ou undefined). */
export interface MediaInsights {
  reach?: number;
  saved?: number;
  shares?: number;
  likes?: number;
  comments?: number;
  totalInteractions?: number;
  views?: number;
  /** FEED (imagem/carrossel) — visitas ao perfil vindas do post. */
  profileVisits?: number;
  /** FEED (imagem/carrossel) — seguidores ganhos a partir do post. */
  follows?: number;
  /** REELS — tempo médio assistido, em MILISSEGUNDOS. */
  reelsAvgWatchTimeMs?: number;
  /** REELS — tempo total assistido somando todas as views, em MILISSEGUNDOS. */
  reelsTotalWatchTimeMs?: number;
}

/** Uma mídia do feed com seus insights já resolvidos. */
export interface MediaWithInsights {
  mediaId: string;
  permalink?: string;
  /** ISO timestamp de publicação. */
  timestamp?: string;
  caption?: string;
  /** Ex.: 'FEED' | 'REELS' | 'STORY'. */
  mediaProductType?: string;
  /** Ex.: 'IMAGE' | 'CAROUSEL_ALBUM' | 'VIDEO'. */
  mediaType?: string;
  /** Formato normalizado pro nosso enum. */
  formato: Formato;
  insights: MediaInsights;
}

/** Perfil (revela o gate de seguidores). */
export interface ProfileSummary {
  igUserId: string;
  username?: string;
  followersCount?: number;
  mediaCount?: number;
}

type Json = Record<string, unknown>;
const asObj = (v: unknown): Json => (v && typeof v === 'object' ? (v as Json) : {});
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const s = (v: unknown): string => (v == null ? '' : String(v));
const num = (v: unknown): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** Erro rico do módulo — carrega status HTTP + corpo (sem token). */
export class InsightsError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'InsightsError';
  }
}

interface ApiResult {
  ok: boolean;
  status: number;
  json: unknown;
}

/** GET na Graph API com o token do env. NUNCA loga a URL/token. */
async function api(path: string, params: Record<string, string>): Promise<ApiResult> {
  const token = getInstagramInsightsToken();
  if (!token) throw new InsightsError('Token de Insights ausente (META_APP_TOKEN no .env).');
  const url = new URL(`${GRAPH}/${path.replace(/^\//, '')}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', token);
  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, json };
}

/** Descobre o IG user id: env tem prioridade; senão via /me/accounts. */
export async function resolveIgUserId(): Promise<string> {
  const fromEnv = getInstagramIgUserId();
  if (fromEnv) return fromEnv;
  const accts = await api('me/accounts', { fields: 'instagram_business_account' });
  const page = asArr(asObj(accts.json).data)
    .map(asObj)
    .find((p) => asObj(p.instagram_business_account).id);
  const id = page ? s(asObj(page.instagram_business_account).id) : '';
  if (!id) {
    throw new InsightsError(
      'Não encontrei o instagram_business_account. Defina INSTAGRAM_IG_USER_ID no .env ' +
        'ou garanta que o token (System User) tem o ativo Instagram atribuído no Business.',
      accts.status,
      accts.json,
    );
  }
  return id;
}

/** Métricas de NÍVEL DE CONTA agregadas num período (a "visão Conta" do painel). */
export interface AccountInsights {
  /** Dias da janela efetivamente usada (1..30 — a API limita o range a 30 dias). */
  dias: number;
  /** Contas ÚNICAS alcançadas no período (deduplicado no range — igual ao app). */
  reach?: number;
  /** Visualizações de TODO o conteúdo no período (feed + reels + stories). */
  views?: number;
  /** Interações totais (curtidas+coment+compart+salv+…) no período. */
  interactions?: number;
  /** Seguidores LÍQUIDOS no período (ganhos − perdidos) — igual ao app do Instagram. */
  followers?: number;
  /** Seguidores GANHOS no período (bruto, contas que começaram a seguir). */
  followersGained?: number;
  /** Seguidores PERDIDOS no período (unfollows). */
  followersLost?: number;
}

/**
 * Busca as métricas de CONTA (as mesmas do app: contas alcançadas, visualizações,
 * interações e seguidores ganhos) agregadas nos últimos `dias`. Diferente de somar
 * os posts publicados: aqui é a atividade da conta no período, incluindo posts
 * antigos/reels/stories que continuaram rodando — e o alcance é deduplicado.
 *
 * A Graph API limita o range a 30 dias → `dias` é clampeado. Resiliente: cada
 * grupo de métricas num try isolado; o que falhar fica `undefined` (a UI degrada
 * aquele card, nunca a tela toda).
 */
export async function fetchAccountInsights(dias = 7, igUserId?: string): Promise<AccountInsights> {
  const d = Math.min(Math.max(Math.round(dias), 1), 30);
  const id = igUserId ?? (await resolveIgUserId());
  const until = Math.floor(Date.now() / 1000);
  const since = until - d * 24 * 3600;
  const su = { since: String(since), until: String(until) };
  const out: AccountInsights = { dias: d };

  // Agregado no range (total_value): reach dedup, views, interações — numa call.
  try {
    const r = await api(`${id}/insights`, {
      metric: 'reach,views,total_interactions',
      period: 'day',
      metric_type: 'total_value',
      ...su,
    });
    if (r.ok) {
      for (const item of asArr(asObj(r.json).data).map(asObj)) {
        const v = num(asObj(item.total_value).value);
        const name = s(item.name);
        if (name === 'reach') out.reach = v;
        else if (name === 'views') out.views = v;
        else if (name === 'total_interactions') out.interactions = v;
      }
    }
  } catch {
    /* degrada — os cards de conta ficam sem esses números */
  }

  // Seguidores LÍQUIDOS (ganhos − perdidos), como o "seguidores líquidos" do app.
  // `follows_and_unfollows` com breakdown `follow_type` devolve:
  //   FOLLOWER      = ganhos  (bate 1:1 com follower_count somado)
  //   NON_FOLLOWER  = perdidos (unfollows)
  // Calibrado 03/08/2026 (@devemdobro): 7d → +1395 −896 = 499 líquido.
  try {
    const r = await api(`${id}/insights`, {
      metric: 'follows_and_unfollows',
      period: 'day',
      metric_type: 'total_value',
      breakdown: 'follow_type',
      ...su,
    });
    if (r.ok) {
      const item = asArr(asObj(r.json).data).map(asObj)[0];
      const breakdowns = asArr(asObj(item?.total_value).breakdowns).map(asObj);
      const results = asArr(breakdowns[0]?.results).map(asObj);
      let gained: number | undefined;
      let lost: number | undefined;
      for (const res of results) {
        const dim = s(asArr(res.dimension_values)[0]);
        if (dim === 'FOLLOWER') gained = num(res.value);
        else if (dim === 'NON_FOLLOWER') lost = num(res.value);
      }
      if (gained != null || lost != null) {
        out.followersGained = gained;
        out.followersLost = lost;
        out.followers = (gained ?? 0) - (lost ?? 0);
      }
    }
  } catch {
    /* degrada — cai no fallback de ganhos brutos abaixo */
  }

  // Fallback: sem o líquido, usa follower_count (série diária) = ganhos brutos.
  if (out.followers == null) {
    try {
      const r = await api(`${id}/insights`, { metric: 'follower_count', period: 'day', ...su });
      if (r.ok) {
        const item = asArr(asObj(r.json).data).map(asObj)[0];
        if (item) {
          const vals = asArr(item.values).map(asObj);
          const ganhos = vals.reduce((a, v) => a + (num(v.value) ?? 0), 0);
          out.followers = ganhos;
          out.followersGained = ganhos;
        }
      }
    } catch {
      /* degrada — o card de novos seguidores fica sem número */
    }
  }

  return out;
}

/** Lê o perfil (username, followers_count, media_count). */
export async function fetchProfile(igUserId?: string): Promise<ProfileSummary> {
  const id = igUserId ?? (await resolveIgUserId());
  const r = await api(id, { fields: 'username,followers_count,media_count' });
  if (!r.ok) throw new InsightsError('Falha ao ler o perfil.', r.status, r.json);
  const o = asObj(r.json);
  return {
    igUserId: id,
    username: o.username ? s(o.username) : undefined,
    followersCount: num(o.followers_count),
    mediaCount: num(o.media_count),
  };
}

/** IG media_product_type/media_type → nosso enum de formato. */
export function toFormato(mediaProductType: string, mediaType: string): Formato {
  const p = mediaProductType.toUpperCase();
  const t = mediaType.toUpperCase();
  if (p === 'REELS') return 'reel';
  if (p === 'STORY') return 'story';
  if (t === 'CAROUSEL_ALBUM') return 'carrossel';
  if (t === 'VIDEO') return 'reel'; // vídeo de feed antigo — trata como reel p/ métricas
  return 'post'; // IMAGE
}

/** Métricas candidatas por família (evita pedir métrica inválida que derruba a call). */
const FEED_METRICS = [
  'reach',
  'saved',
  'shares',
  'likes',
  'comments',
  'total_interactions',
  'views',
  'profile_visits',
  'follows',
] as const;
const REELS_METRICS = [
  'reach',
  'saved',
  'shares',
  'likes',
  'comments',
  'total_interactions',
  'views',
  'ig_reels_avg_watch_time',
  'ig_reels_video_view_total_time',
] as const;

/** Extrai o valor de UM item de /insights (values[0].value ou total_value.value). */
function insightValue(item: Json): number | undefined {
  const values = asArr(item.values).map(asObj);
  if (values[0] && 'value' in values[0]) return num(values[0].value);
  const tv = asObj(item.total_value);
  if ('value' in tv) return num(tv.value);
  return undefined;
}

/**
 * Busca os insights de UMA mídia. Tenta em lote; se a call falhar (alguma métrica
 * inválida pra este item), cai pra uma métrica por vez — resiliente a posts
 * antigos/variações de tipo.
 */
async function fetchOneMediaInsights(
  mediaId: string,
  metrics: readonly string[],
): Promise<Record<string, number | undefined>> {
  const out: Record<string, number | undefined> = {};
  const batch = await api(`${mediaId}/insights`, { metric: metrics.join(',') });
  if (batch.ok) {
    for (const item of asArr(asObj(batch.json).data).map(asObj)) {
      out[s(item.name)] = insightValue(item);
    }
    return out;
  }
  // Fallback: uma métrica por vez (ignora as inválidas silenciosamente).
  for (const m of metrics) {
    const r = await api(`${mediaId}/insights`, { metric: m });
    if (r.ok) {
      const item = asArr(asObj(r.json).data).map(asObj)[0];
      if (item) out[m] = insightValue(item);
    }
  }
  return out;
}

/** Normaliza o dicionário cru de insights → nossa interface tipada. */
function normalizeInsights(raw: Record<string, number | undefined>): MediaInsights {
  return {
    reach: raw.reach,
    saved: raw.saved,
    shares: raw.shares,
    likes: raw.likes,
    comments: raw.comments,
    totalInteractions: raw.total_interactions,
    views: raw.views,
    profileVisits: raw.profile_visits,
    follows: raw.follows,
    reelsAvgWatchTimeMs: raw.ig_reels_avg_watch_time,
    reelsTotalWatchTimeMs: raw.ig_reels_video_view_total_time,
  };
}

/**
 * Lista as últimas `limit` mídias e resolve os insights de cada uma.
 * A ordem é a do feed (mais recente primeiro). Stories não entram (endpoint /media).
 */
export async function fetchRecentMediaWithInsights(
  opts: { limit?: number; igUserId?: string } = {},
): Promise<MediaWithInsights[]> {
  const limit = Math.min(Math.max(opts.limit ?? 25, 1), 500);
  const igId = opts.igUserId ?? (await resolveIgUserId());

  // 1) Lista as mídias PAGINANDO (a Graph API devolve ~25–100 por página) até
  // atingir `limit` ou acabar o feed. Segue o cursor `paging.cursors.after`.
  const items: Json[] = [];
  const pageSize = Math.min(limit, 100);
  let after: string | undefined;
  while (items.length < limit) {
    const params: Record<string, string> = {
      fields: 'id,caption,media_type,media_product_type,permalink,timestamp',
      limit: String(pageSize),
    };
    if (after) params.after = after;
    const media = await api(`${igId}/media`, params);
    if (!media.ok) throw new InsightsError('Falha ao listar mídias.', media.status, media.json);
    const data = asArr(asObj(media.json).data).map(asObj);
    items.push(...data);
    const cursors = asObj(asObj(asObj(media.json).paging).cursors);
    after = cursors.after ? s(cursors.after) : undefined;
    if (!after || data.length === 0) break; // fim do feed
  }
  items.length = Math.min(items.length, limit); // não passa do pedido

  // 2) Resolve os insights de cada mídia (sequencial — resiliente a variações de tipo).
  const out: MediaWithInsights[] = [];
  for (const m of items) {
    const mediaProductType = s(m.media_product_type);
    const mediaType = s(m.media_type);
    const formato = toFormato(mediaProductType, mediaType);
    const metrics = formato === 'reel' ? REELS_METRICS : FEED_METRICS;
    const raw = await fetchOneMediaInsights(s(m.id), metrics);
    out.push({
      mediaId: s(m.id),
      permalink: m.permalink ? s(m.permalink) : undefined,
      timestamp: m.timestamp ? s(m.timestamp) : undefined,
      caption: m.caption ? s(m.caption) : undefined,
      mediaProductType,
      mediaType,
      formato,
      insights: normalizeInsights(raw),
    });
  }
  return out;
}
