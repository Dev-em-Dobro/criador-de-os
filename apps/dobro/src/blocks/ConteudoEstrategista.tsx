/**
 * apps/dobro — bloco CUSTOM: "Estrategista" (v2).
 *
 * Duas frentes, escolhidas por um seletor no topo:
 *
 *  · CARROSSEL — responde qual ESTRUTURA funciona pra nós, com os números reais.
 *    Foco em duas metas de negócio: ganhar SEGUIDORES e gerar COMENTÁRIOS
 *    (comentário com palavra gatilho que dispara automação de DM). 100% client,
 *    SEM IA em runtime: lê os carrosséis já medidos de `v_conteudo_desempenho`
 *    (coluna `estrutura` classificada offline por
 *    `server/scripts/classificar-estrutura.ts`) e agrega com o motor puro
 *    `carrossel-analise.ts`. Mostra o RANKING de estruturas (por taxa por 1k de
 *    alcance) e os CAMPEÕES (top posts reais) da meta escolhida.
 *
 *  · REELS / YAP — o dossiê de pesquisa do formato "yap content", em
 *    `yap-dossie.ts`. É leitura, não medição: ainda não temos reels no banco.
 *    Quando houver, esta aba passa a comparar o que a pesquisa promete com o que
 *    os nossos números entregam.
 *
 * A Etapa 2 (sugestão de cronograma semanal) vai puxar destes dois lados.
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
import { YAP_DOSSIE, YAP_FONTES, YAP_PESQUISA_EM } from './yap-dossie';
import {
  CARROSSEL_DOSSIE,
  CARROSSEL_FONTES,
  CARROSSEL_DOSSIE_EM,
  CARROSSEL_DOSSIE_TOTAL,
} from '../../shared/carrossel-dossie';
import { CONFIANCA_LABEL, type Confianca, type DossieSecao, type Fonte } from '../../shared/dossie-tipos';

type Row = Record<string, unknown>;
/** Qual frente a aba está mostrando. */
type Foco = 'carrossel' | 'yap';
interface ConteudoEstrategistaConfig {
  meta?: Meta;
  foco?: Foco;
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

// ============================================================
// Dossiê do formato Reels / Yap (leitura, não medição)
// ============================================================

/** Botões da frente da aba (Carrossel medido / Reels em pesquisa). */
function FocoToggle({ foco, onChange }: { foco: Foco; onChange: (f: Foco) => void }) {
  const opcoes: ReadonlyArray<[Foco, string]> = [
    ['carrossel', '🎠 Carrossel'],
    ['yap', '🎙️ Reels · Yap'],
  ];
  return (
    <div className="inline-flex rounded-xl border border-gray-700 bg-gray-900/40 p-1">
      {opcoes.map(([f, label]) => (
        <button
          key={f}
          type="button"
          onClick={() => onChange(f)}
          aria-pressed={foco === f}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            foco === f ? 'bg-fuchsia-500/20 text-fuchsia-100 ring-1 ring-fuchsia-500/40' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Selo de quão firme é a afirmação, pra separar dado de aposta nossa. */
const CONFIANCA_TONE: Record<Confianca, string> = {
  // Roxo é o mais forte da escala de propósito: no dossiê de carrossel, "medido
  // aqui" é o selo que vale mais que qualquer fonte de fora.
  medido: 'border-violet-500/40 bg-violet-500/15 text-violet-200',
  decisao: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300/90',
  consenso: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300/90',
  indicio: 'border-sky-500/30 bg-sky-500/10 text-sky-300/90',
  hipotese: 'border-amber-500/30 bg-amber-500/10 text-amber-300/90',
};

/**
 * Seções que ganham moldura de alerta: o aviso de volume no dossiê de reels e as
 * ressalvas de leitura no de carrossel. As duas são "leia antes de usar o resto".
 */
const IDS_ALERTA = new Set(['volume', 'ler-numeros']);

/** Uma seção do dossiê, colapsável. A primeira já vem aberta. */
function SecaoDossie({ secao, aberta, onToggle }: { secao: DossieSecao; aberta: boolean; onToggle: () => void }) {
  const alerta = IDS_ALERTA.has(secao.id);
  return (
    <section
      className={`overflow-hidden rounded-2xl border ${
        alerta ? 'border-amber-500/40 bg-amber-500/[0.04]' : 'border-gray-700/60 bg-gray-800/30'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberta}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-gray-700/20"
      >
        <span className="text-lg leading-none" aria-hidden="true">
          {secao.icone}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-100" style={DISPLAY}>
            {secao.titulo}
          </span>
          <span className="mt-0.5 block text-[12px] leading-relaxed text-gray-400">{secao.resumo}</span>
        </span>
        <span className="shrink-0 pt-0.5 text-xs text-gray-500" aria-hidden="true">
          {aberta ? '▲' : '▼'}
        </span>
      </button>

      {aberta && (
        <ul className="space-y-2 border-t border-gray-700/50 p-4 pt-3">
          {secao.itens.map((item) => (
            <li key={item.titulo} className="rounded-xl border border-gray-700/40 bg-gray-900/30 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[13px] font-semibold text-gray-100">{item.titulo}</span>
                {item.confianca && (
                  <span
                    className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${CONFIANCA_TONE[item.confianca]}`}
                  >
                    {CONFIANCA_LABEL[item.confianca]}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-gray-300">{item.texto}</p>
              {(item.numero || item.fonte) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {item.numero && (
                    <span
                      className="rounded-lg bg-gray-700/40 px-2 py-0.5 text-[11px] font-bold text-gray-100"
                      style={DISPLAY}
                    >
                      {item.numero}
                    </span>
                  )}
                  {item.fonte && <span className="text-[10.5px] text-gray-500">fonte: {item.fonte}</span>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Lista de seções colapsáveis com o rodapé de fontes. Serve os DOIS dossiês (o
 * de reels e o de carrossel), que têm a mesma forma e mudam só no conteúdo.
 */
function ListaDossie({
  secoes,
  abrirPorPadrao,
  fontes,
  rotuloFontes,
}: {
  secoes: DossieSecao[];
  abrirPorPadrao: string[];
  fontes: Fonte[];
  rotuloFontes: string;
}) {
  const [abertas, setAbertas] = useState<Set<string>>(() => new Set(abrirPorPadrao));
  const toggle = (id: string) =>
    setAbertas((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });

  return (
    <>
      <div className="space-y-2.5">
        {secoes.map((secao) => (
          <SecaoDossie key={secao.id} secao={secao} aberta={abertas.has(secao.id)} onToggle={() => toggle(secao.id)} />
        ))}
      </div>

      <details className="rounded-2xl border border-gray-800 bg-gray-900/30 px-4 py-3">
        <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          {rotuloFontes}
        </summary>
        <ul className="mt-2 space-y-1">
          {fontes.map((f) => (
            <li key={f.url}>
              <a
                href={f.url}
                target={f.url.startsWith('/') ? undefined : '_blank'}
                rel="noreferrer"
                className="text-[11.5px] text-blue-400 hover:text-blue-300"
              >
                {f.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}

/** O dossiê inteiro: o que é o yap, por que funciona e o alerta de volume. */
function GuiaYap() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/[0.05] px-4 py-3">
        <p className="text-[12.5px] leading-relaxed text-gray-300">
          Isto é <span className="font-semibold text-fuchsia-200">pesquisa, não medição</span>. Ainda não temos nenhum
          reels medido no banco, então cada afirmação vem com a fonte e com o quanto ela é firme. Assim que os
          primeiros reels forem publicados e medidos, esta aba passa a comparar o que a pesquisa promete com o que os
          nossos números entregam, do mesmo jeito que já acontece no carrossel.
        </p>
      </div>

      <ListaDossie
        secoes={YAP_DOSSIE}
        abrirPorPadrao={[YAP_DOSSIE[0]?.id, 'volume'].filter(Boolean) as string[]}
        fontes={YAP_FONTES}
        rotuloFontes={`Fontes · pesquisa de ${YAP_PESQUISA_EM}`}
      />
    </div>
  );
}

/**
 * Os achados do carrossel: a leitura HUMANA dos números que o ranking acima
 * mostra. O ranking diz o que rende; isto diz por que e o que fazer.
 *
 * Vem depois dos números de propósito: primeiro o dado, depois a conclusão.
 */
function AchadosCarrossel() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          O que já aprendemos sobre carrossel
        </h3>
        <span className="text-[11px] text-gray-500">
          {CARROSSEL_DOSSIE_TOTAL} achados · revisado em {CARROSSEL_DOSSIE_EM}
        </span>
      </div>

      <div className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.05] px-4 py-3">
        <p className="text-[12.5px] leading-relaxed text-gray-300">
          Aqui é a <span className="font-semibold text-violet-200">leitura humana</span> dos números acima: o ranking
          diz <em>o que</em> rende, e isto diz <em>por que</em> e o que fazer na próxima peça. Quase tudo foi medido
          nesta conta, em post que foi ao ar, e cada item traz o número e a data. Leia a última seção antes de usar
          qualquer coisa: é ela que explica onde os números enganam.
        </p>
      </div>

      <ListaDossie
        secoes={CARROSSEL_DOSSIE}
        abrirPorPadrao={[CARROSSEL_DOSSIE[0]?.id, 'ler-numeros'].filter(Boolean) as string[]}
        fontes={CARROSSEL_FONTES}
        rotuloFontes={`De onde vêm estes números · revisado em ${CARROSSEL_DOSSIE_EM}`}
      />
    </div>
  );
}

function ConteudoEstrategistaBlock({ config, ctx }: BlockProps<ConteudoEstrategistaConfig>) {
  const { data, loading, error } = ctx;
  const [foco, setFoco] = useState<Foco>(config.foco ?? 'carrossel');
  const [meta, setMeta] = useState<Meta>(config.meta ?? 'seguidores');

  const posts = useMemo(() => toCarrosseis(asRows(data)), [data]);
  const conf = useMemo(() => nivelConfianca(posts), [posts]);
  const aggsRanked = useMemo(() => rankearEstruturas(agregarPorEstrutura(posts), meta), [posts, meta]);

  const emYap = foco === 'yap';
  const semDados = conf.n === 0;

  /**
   * Os NÚMEROS do lado carrossel dependem da query; o dossiê de achados não
   * depende de nada, e por isso é renderizado fora daqui — banco fora do ar ou
   * classificação pendente não pode esconder o que a conta já aprendeu. Mesmo
   * princípio que vale pro lado YAP.
   */
  function numerosCarrossel() {
    if (loading) return <SkeletonCards count={2} columns={2} />;
    if (error) return <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />;
    if (semDados) {
      return (
        <EmptyState
          icon="📊"
          message="Ainda não há carrosséis classificados. Rode o desempenho e a classificação de estrutura primeiro."
        />
      );
    }
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          title={emYap ? 'Estrategista de reels · yap' : 'Estrategista de carrossel'}
          subtitle={
            emYap
              ? 'O que o formato de falar pra câmera exige — pesquisa de campo, com fonte.'
              : 'Qual estrutura de carrossel mais rende — pelos seus números reais.'
          }
          icon={emYap ? '🎙️' : '🎯'}
        />
        <span className="rounded-full border border-gray-700 px-3 py-1 text-[11px] text-gray-400">
          {emYap ? `pesquisa de ${YAP_PESQUISA_EM} · 0 reels medidos` : `base: ${conf.n} carrosséis · confiança ${conf.nivel}`}
        </span>
      </div>

      <FocoToggle foco={foco} onChange={setFoco} />

      {emYap ? (
        <GuiaYap />
      ) : (
        <>
          {numerosCarrossel()}
          <AchadosCarrossel />
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
