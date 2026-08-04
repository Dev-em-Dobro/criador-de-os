/**
 * apps/dobro — bloco CUSTOM: "Estrategista de carrossel" (v2).
 *
 * Responde UMA pergunta do dono: qual ESTRUTURA de carrossel funciona pra nós?
 * Foco em duas metas de negócio: ganhar SEGUIDORES e gerar COMENTÁRIOS (comentário
 * com palavra gatilho que dispara automação de DM).
 *
 * 100% client, SEM IA em runtime: lê os carrosséis já medidos de
 * `v_conteudo_desempenho` (coluna `estrutura` classificada offline por
 * `server/scripts/classificar-estrutura.ts`) e agrega com o motor puro
 * `carrossel-analise.ts`. Mostra duas coisas: o RANKING de estruturas (por taxa
 * por 1k de alcance) e os CAMPEÕES (top posts reais) da meta escolhida.
 *
 * A Etapa 2 (sugestão de cronograma semanal) vai puxar deste mesmo ranking.
 */

import { useMemo, useState } from 'react';
import { SectionHeader, EmptyState, SkeletonCards } from '@os/core';
import type { BlockDefinition, BlockProps } from '@os/core';
import {
  agregarPorEstrutura,
  rankearEstruturas,
  topCampeoes,
  nivelConfianca,
  META_LABEL,
  type Meta,
  type CarrosselMetrics,
  type AggEstrutura,
} from './carrossel-analise';

type Row = Record<string, unknown>;
interface ConteudoEstrategistaConfig {
  meta?: Meta;
}

const DISPLAY = { fontFamily: 'var(--font-display, inherit)' } as const;
/** Palavra curta da meta, usada nas taxas ("7,2 /1k seg"). */
const META_CURTA: Record<Meta, string> = { seguidores: 'seg', comentarios: 'com' };

function asRows(data: unknown): Row[] {
  if (Array.isArray(data)) return data.filter((r): r is Row => r != null && typeof r === 'object');
  if (data != null && typeof data === 'object') return [data as Row];
  return [];
}
function str(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}
function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
/** Só carrosséis; mapeia a linha da view → CarrosselMetrics. */
function toCarrosseis(rows: Row[]): CarrosselMetrics[] {
  return rows
    .filter((r) => str(r.formato).toLowerCase() === 'carrossel')
    .map((r, i) => ({
      id: str(r.id) || `row-${i}`,
      estrutura: str(r.estrutura) || null,
      tema: str(r.tema) || null,
      data: str(r.data) || null,
      permalink: str(r.permalink) || null,
      alcance: num(r.alcance),
      seguidores: num(r.seguidores),
      comentarios: num(r.comentarios),
      salvamentos: num(r.salvamentos),
      compartilhamentos: num(r.compartilhamentos),
      visitasPerfil: num(r.visitas_perfil),
    }));
}

const fmtInt = (n: number): string => n.toLocaleString('pt-BR');
const fmtTaxa = (n: number): string => n.toFixed(n >= 100 ? 0 : 1).replace('.', ',');

/** Botões de meta (Ganhar seguidores / Gerar comentários). */
function MetaToggle({ meta, onChange }: { meta: Meta; onChange: (m: Meta) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-gray-700 bg-gray-900/40 p-1">
      {(['seguidores', 'comentarios'] as Meta[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          aria-pressed={meta === m}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            meta === m ? 'bg-blue-500/20 text-blue-100 ring-1 ring-blue-500/40' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {m === 'seguidores' ? '📈 ' : '💬 '}
          {META_LABEL[m]}
        </button>
      ))}
    </div>
  );
}

/** Ranking das estruturas pela taxa por 1k da meta, com barra proporcional. */
function RankingEstruturas({ aggs, meta }: { aggs: AggEstrutura[]; meta: Meta }) {
  const chave = meta === 'seguidores' ? 'seguidoresPor1k' : 'comentariosPor1k';
  const outraChave = meta === 'seguidores' ? 'comentariosPor1k' : 'seguidoresPor1k';
  const max = Math.max(...aggs.map((a) => a[chave]), 0.0001);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Ranking de estruturas · {META_LABEL[meta]}
      </h3>
      <ol className="space-y-1.5">
        {aggs.map((a, i) => {
          const pct = Math.max(2, Math.round((a[chave] / max) * 100));
          const lider = i === 0;
          return (
            <li
              key={a.estrutura}
              className={`rounded-2xl border p-3 sm:p-4 ${
                lider ? 'border-blue-500/50 bg-blue-500/[0.07]' : 'border-gray-700/60 bg-gray-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    lider ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-100">{a.label}</span>
                      <span className="text-[11px] text-gray-500">{a.n} posts</span>
                      {a.amostraFraca && (
                        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300/90">
                          amostra pequena
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-gray-100" style={DISPLAY}>
                      {fmtTaxa(a[chave])}
                      <span className="ml-1 text-[10px] font-medium text-gray-500">/1k {META_CURTA[meta]}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-700/50">
                    <div
                      className={`h-full rounded-full ${lider ? 'bg-blue-400' : 'bg-gray-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500">
                    {fmtTaxa(a[outraChave])} /1k {META_CURTA[meta === 'seguidores' ? 'comentarios' : 'seguidores']}
                    <span className="text-gray-600"> · alcance médio {fmtInt(a.alcanceMedio)}</span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Campeões: top posts reais pela métrica absoluta da meta. */
function Campeoes({ posts, meta }: { posts: CarrosselMetrics[]; meta: Meta }) {
  const campeoes = useMemo(() => topCampeoes(posts, meta, 8), [posts, meta]);
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Campeões · {META_LABEL[meta]}
      </h3>
      <ol className="space-y-1.5">
        {campeoes.map((c, i) => {
          const principal = meta === 'seguidores' ? c.seguidores : c.comentarios;
          const outra = meta === 'seguidores' ? c.comentarios : c.seguidores;
          const outraLabel = meta === 'seguidores' ? 'coment.' : 'segs';
          return (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-gray-700/60 bg-gray-800/40 p-3"
            >
              <span className="w-4 shrink-0 text-right text-[11px] font-semibold text-gray-600">{i + 1}</span>
              <span className="shrink-0 text-right" style={{ minWidth: '3.5rem' }}>
                <span className="block text-base font-bold text-emerald-300" style={DISPLAY}>
                  {meta === 'seguidores' ? '+' : ''}
                  {fmtInt(principal)}
                </span>
                <span className="block text-[10px] text-gray-500">{fmtInt(outra)} {outraLabel}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="mb-0.5 flex items-center gap-1.5">
                  <span className="rounded-full border border-gray-600/70 px-1.5 py-0.5 text-[10px] font-medium text-gray-300">
                    {c.estruturaLabel}
                  </span>
                  {c.permalink && (
                    <a
                      href={c.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-medium text-blue-400 hover:text-blue-300"
                    >
                      ver post ↗
                    </a>
                  )}
                </span>
                <span className="block truncate text-[13px] text-gray-200">{c.tema || '—'}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ConteudoEstrategistaBlock({ config, ctx }: BlockProps<ConteudoEstrategistaConfig>) {
  const { data, loading, error } = ctx;
  const [meta, setMeta] = useState<Meta>(config.meta ?? 'seguidores');

  const posts = useMemo(() => toCarrosseis(asRows(data)), [data]);
  const conf = useMemo(() => nivelConfianca(posts), [posts]);
  const aggsRanked = useMemo(() => rankearEstruturas(agregarPorEstrutura(posts), meta), [posts, meta]);

  if (loading) {
    return (
      <div>
        <SectionHeader title="Estrategista de carrossel" subtitle="Carregando o desempenho…" icon="🎯" />
        <SkeletonCards count={2} columns={2} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <SectionHeader title="Estrategista de carrossel" icon="🎯" />
        <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />
      </div>
    );
  }

  const semDados = conf.n === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          title="Estrategista de carrossel"
          subtitle="Qual estrutura de carrossel mais rende — pelos seus números reais."
          icon="🎯"
        />
        <span className="rounded-full border border-gray-700 px-3 py-1 text-[11px] text-gray-400">
          base: {conf.n} carrosséis · confiança {conf.nivel}
        </span>
      </div>

      {semDados ? (
        <EmptyState
          icon="📊"
          message="Ainda não há carrosséis classificados. Rode o desempenho e a classificação de estrutura primeiro."
        />
      ) : (
        <>
          <MetaToggle meta={meta} onChange={setMeta} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RankingEstruturas aggs={aggsRanked} meta={meta} />
            <Campeoes posts={posts} meta={meta} />
          </div>

          <p className="rounded-xl border border-gray-800 bg-gray-900/30 px-4 py-3 text-[11px] leading-relaxed text-gray-500">
            As taxas são <span className="text-gray-400">por 1.000 de alcance</span>, pra medir o que a
            estrutura causa e não o quanto o algoritmo distribuiu. Metade dos posts tem 0 seguidor atribuído,
            então confie na <span className="text-gray-400">direção e nas taxas</span>, não nos números soltos.
            Estruturas com <span className="text-amber-300/80">amostra pequena</span> (menos de 5 posts) ainda
            precisam de mais dados pra confirmar.
          </p>
        </>
      )}
    </div>
  );
}

/** Definição registrável do bloco custom "Estrategista de carrossel". */
export const conteudoEstrategista: BlockDefinition = {
  type: 'custom:conteudo-estrategista',
  component: ConteudoEstrategistaBlock,
  defaultDataShape: 'collection',
};
