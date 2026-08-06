/**
 * apps/dobro — bloco CUSTOM: "Referências" (os perfis do Instagram que a gente segue).
 *
 * Uma agenda de quem inspira o conteúdo. Cada card é um @: link direto pro perfil,
 * quantas referências já vieram dele, em que formato, e a média de curtidas e
 * comentários dos posts que a gente salvou (o sinal de quem rende de verdade).
 *
 * O dado vem de `v_referencias_perfis` (allowlist), que une DUAS origens: o autor
 * de cada captura do Telegram — então a lista cresce sozinha a cada referência
 * nova — e a curadoria manual (`pnpm perfis:add`), pros perfis que a gente quer
 * seguir sem ter mandado post deles ainda.
 *
 * 100% client, sem IA: só leitura, ordenação e formatação.
 */

import { useMemo, useState } from 'react';
import { SectionHeader, EmptyState, SkeletonCards } from '@os/core';
import type { BlockDefinition, BlockProps } from '@os/core';

type Row = Record<string, unknown>;

/** Um perfil já normalizado para a tela. */
interface Perfil {
  handle: string;
  perfilUrl: string;
  nome: string | null;
  nota: string | null;
  refs: number;
  carrosseis: number;
  reels: number;
  mediaCurtidas: number | null;
  mediaComentarios: number | null;
  ultimaRef: Date | null;
  ultimaUrl: string | null;
}

type Ordem = 'refs' | 'engajamento' | 'recentes';

const ORDENS: { id: Ordem; label: string }[] = [
  { id: 'refs', label: 'Mais mandados' },
  { id: 'engajamento', label: 'Mais engajamento' },
  { id: 'recentes', label: 'Mais recentes' },
];

const DISPLAY = { fontFamily: 'var(--font-display, inherit)' } as const;

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
function date(v: unknown): Date | null {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toPerfis(rows: Row[]): Perfil[] {
  return rows
    .map((r) => ({
      handle: str(r.handle).replace(/^@/, ''),
      perfilUrl: str(r.perfil_url),
      nome: str(r.nome) || null,
      nota: str(r.nota) || null,
      refs: num(r.refs) ?? 0,
      carrosseis: num(r.carrosseis) ?? 0,
      reels: num(r.reels) ?? 0,
      mediaCurtidas: num(r.media_curtidas),
      mediaComentarios: num(r.media_comentarios),
      ultimaRef: date(r.ultima_ref),
      ultimaUrl: str(r.ultima_url) || null,
    }))
    .filter((p) => p.handle.length > 0);
}

const fmtInt = (n: number): string => n.toLocaleString('pt-BR');
/** 35.648 → "35,6 mil" (o número exato não muda nenhuma decisão aqui). */
function fmtCompacto(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} mi`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.', ',')} mil`;
  return fmtInt(n);
}
function fmtData(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/** Soma que define "quem rende": curtidas + comentários médios por post salvo. */
function engajamento(p: Perfil): number {
  return (p.mediaCurtidas ?? 0) + (p.mediaComentarios ?? 0);
}

/** Cor estável por handle (mesmo @ = sempre a mesma cor), pro avatar de inicial. */
function hue(handle: string): number {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) % 360;
  return h;
}

function ordenar(perfis: Perfil[], ordem: Ordem): Perfil[] {
  const t = (p: Perfil) => p.ultimaRef?.getTime() ?? 0;
  return [...perfis].sort((a, b) => {
    if (ordem === 'engajamento') return engajamento(b) - engajamento(a) || b.refs - a.refs;
    if (ordem === 'recentes') return t(b) - t(a) || b.refs - a.refs;
    return b.refs - a.refs || engajamento(b) - engajamento(a);
  });
}

/** Chips de ordenação (mesma linguagem visual do Estrategista). */
function OrdemToggle({ ordem, onChange }: { ordem: Ordem; onChange: (o: Ordem) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-gray-700 bg-gray-900/40 p-1">
      {ORDENS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={ordem === o.id}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            ordem === o.id
              ? 'bg-blue-500/20 text-blue-100 ring-1 ring-blue-500/40'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Avatar de inicial — o Instagram não deixa a gente usar a foto do perfil. */
function Avatar({ handle }: { handle: string }) {
  const h = hue(handle);
  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white/90 ring-1 ring-white/10"
      style={{ background: `linear-gradient(135deg, hsl(${h} 55% 42%), hsl(${(h + 40) % 360} 60% 28%))` }}
    >
      {handle.charAt(0).toUpperCase()}
    </span>
  );
}

function Etiqueta({ children, tom = 'neutro' }: { children: React.ReactNode; tom?: 'neutro' | 'destaque' }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
        tom === 'destaque'
          ? 'bg-blue-500/15 text-blue-200 ring-1 ring-blue-500/30'
          : 'bg-gray-800/70 text-gray-400 ring-1 ring-gray-700/60'
      }`}
    >
      {children}
    </span>
  );
}

function CardPerfil({ perfil }: { perfil: Perfil }) {
  const {
    handle, perfilUrl, nome, nota, refs, carrosseis, reels,
    mediaCurtidas, mediaComentarios, ultimaRef, ultimaUrl,
  } = perfil;

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-gray-700/60 bg-gray-800/40 p-4 transition-colors hover:border-gray-600 hover:bg-gray-800/60">
      <div className="flex items-center gap-3">
        <Avatar handle={handle} />
        <div className="min-w-0">
          <a
            href={perfilUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm font-semibold text-gray-100 hover:text-blue-300"
            style={DISPLAY}
          >
            @{handle}
          </a>
          {nome && <p className="truncate text-xs text-gray-500">{nome}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {refs > 0 ? (
          <Etiqueta tom="destaque">
            {refs} {refs === 1 ? 'referência' : 'referências'}
          </Etiqueta>
        ) : (
          <Etiqueta>adicionado à mão</Etiqueta>
        )}
        {carrosseis > 0 && <Etiqueta>{carrosseis} {carrosseis > 1 ? 'carrosséis' : 'carrossel'}</Etiqueta>}
        {reels > 0 && <Etiqueta>{reels} {reels > 1 ? 'reels' : 'reel'}</Etiqueta>}
      </div>

      {(mediaCurtidas != null || mediaComentarios != null) && (
        <dl className="flex gap-4 text-xs text-gray-400">
          {mediaCurtidas != null && (
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-gray-500">Curtidas</dt>
              <dd className="text-sm font-semibold text-gray-200">{fmtCompacto(mediaCurtidas)}</dd>
            </div>
          )}
          {mediaComentarios != null && (
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-gray-500">Comentários</dt>
              <dd className="text-sm font-semibold text-gray-200">{fmtCompacto(mediaComentarios)}</dd>
            </div>
          )}
        </dl>
      )}

      {nota && <p className="text-xs leading-relaxed text-gray-400">{nota}</p>}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-[11px] text-gray-500">
        <span>{ultimaRef ? `última em ${fmtData(ultimaRef)}` : 'sem post capturado'}</span>
        {ultimaUrl && (
          <a
            href={ultimaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-400 hover:text-blue-300"
          >
            ver o post →
          </a>
        )}
      </div>
    </li>
  );
}

interface ReferenciasPerfisConfig {
  /** Ordenação inicial dos cards (default: mais mandados). */
  ordemInicial?: Ordem;
}

function ReferenciasPerfisBlock({ config, ctx }: BlockProps<ReferenciasPerfisConfig>) {
  const { data, loading, error } = ctx;
  const [ordem, setOrdem] = useState<Ordem>(config?.ordemInicial ?? 'refs');

  const perfis = useMemo(() => toPerfis(asRows(data)), [data]);
  const ordenados = useMemo(() => ordenar(perfis, ordem), [perfis, ordem]);
  const totalRefs = useMemo(() => perfis.reduce((s, p) => s + p.refs, 0), [perfis]);

  if (loading) {
    return (
      <div>
        <SectionHeader title="Referências" icon="👥" />
        <SkeletonCards count={6} columns={3} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <SectionHeader title="Referências" icon="👥" />
        <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          title="Referências"
          subtitle="Os perfis que inspiram o nosso conteúdo — clique no @ para abrir no Instagram."
          icon="👥"
        />
        {perfis.length > 0 && (
          <span className="rounded-full border border-gray-700 px-3 py-1 text-[11px] text-gray-400">
            {perfis.length} perfis · {totalRefs} referências capturadas
          </span>
        )}
      </div>

      {perfis.length === 0 ? (
        <EmptyState
          icon="👥"
          message="Nenhum perfil ainda. Mande uma referência no Telegram ou rode: pnpm perfis:add @handle"
        />
      ) : (
        <>
          <OrdemToggle ordem={ordem} onChange={setOrdem} />

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ordenados.map((p) => (
              <CardPerfil key={p.handle} perfil={p} />
            ))}
          </ul>

          <p className="rounded-xl border border-gray-800 bg-gray-900/30 px-4 py-3 text-[11px] leading-relaxed text-gray-500">
            Curtidas e comentários são a <span className="text-gray-400">média dos posts daquele perfil que a
            gente salvou</span> — serve pra comparar quem rende, não pra medir o perfil inteiro. Todo @ que
            mandar referência pelo Telegram entra aqui sozinho; pra seguir alguém sem ter salvado post dele,
            use <span className="text-gray-400">pnpm perfis:add</span>.
          </p>
        </>
      )}
    </div>
  );
}

/** Definição registrável do bloco custom "Referências". */
export const referenciasPerfis: BlockDefinition<ReferenciasPerfisConfig> = {
  type: 'custom:referencias-perfis',
  component: ReferenciasPerfisBlock,
  defaultDataShape: 'collection',
};
