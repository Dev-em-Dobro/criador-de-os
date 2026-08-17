/**
 * apps/dobro — confronta as METAS SEMANAIS do painel com a distribuição real das
 * últimas semanas e sugere valores novos.
 *
 * Por que RELATÓRIO e não ajuste automático (mesma razão de `calibrar-regua.ts`):
 * meta que se recalcula sozinha vira espelho do passado — se a conta cai, a meta
 * cai junto e o painel sempre diz "bateu". A decisão continua humana, escrita à
 * mão em `src/manifest.ts` → `config.metasSemana`. O que este script faz é dar o
 * dado: quanto a conta realmente entrega por semana, e onde ficam os percentis.
 *
 * A janela de cada semana é a MESMA da visão "Conta" do painel (7 dias fechados,
 * meia-noite no fuso da conta) — sem isso a meta é calibrada contra um número
 * que a tela nunca mostra. As interações também seguem a conta do app
 * (curtidas + comentários + salvamentos + compartilhamentos).
 *
 * Critério da sugestão:
 *   · min   = p25 — piso que a conta bate em 3 de 4 semanas;
 *   · media = p50 — o normal da casa;
 *   · alta  = p90 — semana de pico, exceção de verdade.
 * Os valores saem arredondados para números redondos (meta é para ser lida, não
 * para ter precisão falsa de 3 dígitos).
 *
 * Uso: pnpm --filter @app/dobro conteudo:calibrar-metas [semanas]
 */

import { isNotNull } from 'drizzle-orm';
import { db } from '../../db/client';
import { conteudoDesempenho } from '../../db/schema';
import { meiaNoiteNoFuso } from '../instagram-insights';
import { getInstagramInsightsToken, getInstagramIgUserId, getInstagramTimezone } from '../env';

const GRAPH = 'https://graph.facebook.com/v21.0';
const SEMANAS_PADRAO = 12;

type Json = Record<string, unknown>;
const asObj = (v: unknown): Json => (v && typeof v === 'object' ? (v as Json) : {});
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const s = (v: unknown): string => (v == null ? '' : String(v));
const num = (v: unknown): number | undefined => {
  const n = Number(v);
  return v == null || v === '' || !Number.isFinite(n) ? undefined : n;
};

async function api(path: string, params: Record<string, string>) {
  const url = new URL(`${GRAPH}/${path.replace(/^\//, '')}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', getInstagramInsightsToken() ?? '');
  const res = await fetch(url);
  return { ok: res.ok, status: res.status, json: await res.json().catch(() => null), headers: res.headers };
}

interface Semana {
  since: number;
  until: number;
  views: number | null;
  reach: number | null;
  interacoes: number | null;
  seguidores: number | null;
  posts: number;
}

/** Métricas de conta de UMA semana, na mesma janela da visão "Conta". */
async function metricasDaSemana(id: string, since: number, until: number) {
  const su = { since: String(since), until: String(until) };
  const out = { views: null as number | null, reach: null as number | null, interacoes: null as number | null, seguidores: null as number | null };

  const r = await api(`${id}/insights`, {
    metric: 'reach,views,likes,comments,saves,shares',
    period: 'day',
    metric_type: 'total_value',
    ...su,
  });
  if (r.ok) {
    const v: Record<string, number | undefined> = {};
    for (const item of asArr(asObj(r.json).data).map(asObj)) {
      v[s(item.name)] = num(asObj(item.total_value).value);
    }
    out.views = v.views ?? null;
    out.reach = v.reach ?? null;
    const parcelas = [v.likes, v.comments, v.saves, v.shares];
    out.interacoes = parcelas.some((p) => p != null)
      ? parcelas.reduce((a: number, p) => a + (p ?? 0), 0)
      : null;
  }

  const f = await api(`${id}/insights`, {
    metric: 'follows_and_unfollows',
    period: 'day',
    metric_type: 'total_value',
    breakdown: 'follow_type',
    ...su,
  });
  if (f.ok) {
    const item = asArr(asObj(f.json).data).map(asObj)[0];
    const bd = asArr(asObj(item?.total_value).breakdowns).map(asObj);
    let ganhos: number | undefined;
    let perdidos: number | undefined;
    for (const res of asArr(bd[0]?.results).map(asObj)) {
      const dim = s(asArr(res.dimension_values)[0]);
      if (dim === 'FOLLOWER') ganhos = num(res.value);
      else if (dim === 'NON_FOLLOWER') perdidos = num(res.value);
    }
    if (ganhos != null || perdidos != null) out.seguidores = (ganhos ?? 0) - (perdidos ?? 0);
  }

  return out;
}

/** Percentil "nearest rank" — o valor sugerido é sempre uma semana que existiu. */
function percentil(valores: number[], p: number): number {
  if (!valores.length) return 0;
  const a = [...valores].sort((x, y) => x - y);
  const i = Math.max(0, Math.ceil((p / 100) * a.length) - 1);
  return a[i];
}

/** Arredonda para um número "de meta": redondo o bastante para ser lido. */
function redondo(v: number): number {
  if (v >= 500_000) return Math.round(v / 50_000) * 50_000;
  if (v >= 100_000) return Math.round(v / 25_000) * 25_000;
  if (v >= 10_000) return Math.round(v / 1_000) * 1_000;
  if (v >= 1_000) return Math.round(v / 100) * 100;
  if (v >= 100) return Math.round(v / 50) * 50;
  return Math.round(v);
}

const fmt = (n: number | null) => (n == null ? '     —' : Math.round(n).toLocaleString('pt-BR').padStart(9));
const dia = (e: number) => new Date(e * 1000).toISOString().slice(5, 10);

async function main() {
  const semanasPedidas = Number(process.argv[2]) || SEMANAS_PADRAO;
  const id = getInstagramIgUserId();
  if (!id) throw new Error('INSTAGRAM_IG_USER_ID ausente no .env');
  if (!getInstagramInsightsToken()) throw new Error('META_APP_TOKEN ausente no .env');

  // "Agora" pela rede: a janela do painel depende do relógio, e o desta máquina
  // já apareceu 15h atrasado uma vez (17/08/2026).
  const head = await api('', {});
  const dh = head.headers.get('date');
  const agora = new Date(dh ? Date.parse(dh) : Date.now());
  const tz = getInstagramTimezone();
  const fimAtual = meiaNoiteNoFuso(agora, tz); // meia-noite de hoje: fim da semana mais recente

  // Posts publicados por semana, do banco (é o que o card "Posts no período" conta).
  const linhas = await db
    .select({ data: conteudoDesempenho.data })
    .from(conteudoDesempenho)
    .where(isNotNull(conteudoDesempenho.data));
  const datasPosts = linhas
    .map((l) => (l.data ? new Date(l.data).getTime() / 1000 : null))
    .filter((t): t is number => t != null);

  console.log(`\nconta ${id} · fuso ${tz} · ${semanasPedidas} semanas fechadas até ${dia(fimAtual)}\n`);
  console.log('semana            views     alcance   interações  seguidores  posts');

  const semanas: Semana[] = [];
  for (let i = 0; i < semanasPedidas; i++) {
    const until = fimAtual - i * 7 * 86400;
    const since = until - 7 * 86400;
    const m = await metricasDaSemana(id, since, until);
    const posts = datasPosts.filter((t) => t >= since && t < until).length;
    semanas.push({ since, until, ...m, posts });
    console.log(
      `${dia(since)}→${dia(until)}  ${fmt(m.views)}  ${fmt(m.reach)}  ${fmt(m.interacoes)}  ${fmt(m.seguidores)}  ${String(posts).padStart(5)}`,
    );
  }

  // Sugestão por indicador. Semanas sem dado (API falhou) ficam de fora.
  const indicadores: [string, (s: Semana) => number | null][] = [
    ['visualizacoes', (x) => x.views],
    ['alcance', (x) => x.reach],
    ['interacoes', (x) => x.interacoes],
    ['novosSeguidores', (x) => x.seguidores],
    ['posts', (x) => x.posts],
  ];

  console.log('\n== distribuição e sugestão ==');
  console.log('indicador          p25 (min)   p50 (media)   p90 (alta)   pior     melhor   n');
  const sugestoes: Record<string, { min: number; media: number; alta: number }> = {};
  for (const [nome, pega] of indicadores) {
    const vals = semanas.map(pega).filter((v): v is number => v != null);
    if (!vals.length) {
      console.log(`${nome.padEnd(16)} sem dado`);
      continue;
    }
    const p25 = percentil(vals, 25);
    const p50 = percentil(vals, 50);
    const p90 = percentil(vals, 90);
    sugestoes[nome] = { min: redondo(p25), media: redondo(p50), alta: redondo(p90) };
    console.log(
      `${nome.padEnd(16)} ${fmt(p25)}   ${fmt(p50)}   ${fmt(p90)}  ${fmt(Math.min(...vals))} ${fmt(Math.max(...vals))} ${String(vals.length).padStart(3)}`,
    );
  }

  console.log('\n== para colar em src/manifest.ts → config.metasSemana ==\n');
  console.log('                metasSemana: {');
  for (const [nome] of indicadores) {
    const g = sugestoes[nome];
    if (!g) continue;
    console.log(`                  ${nome}: { min: ${g.min}, media: ${g.media}, alta: ${g.alta} },`);
  }
  console.log('                },');

  // Quantas semanas cada nível classifica — o teste de sanidade da meta.
  console.log('\n== quantas das semanas medidas bateriam cada nível ==');
  for (const [nome, pega] of indicadores) {
    const g = sugestoes[nome];
    if (!g) continue;
    const vals = semanas.map(pega).filter((v): v is number => v != null);
    const conta = (alvo: number) => vals.filter((v) => v >= alvo).length;
    console.log(
      `${nome.padEnd(16)} min ${conta(g.min)}/${vals.length} · media ${conta(g.media)}/${vals.length} · alta ${conta(g.alta)}/${vals.length}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('falhou:', e);
    process.exit(1);
  });
