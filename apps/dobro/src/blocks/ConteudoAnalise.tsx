/**
 * apps/dobro — seção "Análise" (o que funciona pro nosso perfil).
 *
 * Story 1 do epic Social Media Estrategista. Consome o motor PURO `social-analise.ts`
 * (Lead Score) e as linhas de `v_conteudo_desempenho` que o bloco de Desempenho já
 * carrega — sem rota nova, sem LLM, sem depender de sync/token.
 *
 * Mostra, sob a ótica de FUNIL de lançamento (captar/nutrir):
 *   - seletor de OBJETIVO (re-rankeia na hora);
 *   - PADRÕES: melhor formato e melhor dia da semana;
 *   - CAMPEÕES (top) e o RANKING completo por Lead Score;
 *   - nível de CONFIANÇA pela amostra (honesto quando há poucos dados).
 */

import { useMemo, useState } from 'react';
import {
  construirContexto,
  rankear,
  agregarPorFormato,
  agregarPorDiaSemana,
  nivelConfianca,
  OBJETIVO_LABEL,
  SINAL_LABEL,
  type Objetivo,
  type PostMetrics,
  type Rotulo,
  type ScoredPost,
} from './social-analise';

type Row = Record<string, unknown>;

const OBJETIVOS: readonly Objetivo[] = ['lead', 'autoridade', 'alcance', 'equilibrado'];

const FORMATO_LABEL: Record<string, string> = {
  reel: 'Reels',
  carrossel: 'Carrossel',
  post: 'Post',
  story: 'Story',
};

const ROTULO_TONE: Record<Rotulo, { pill: string; text: string }> = {
  Campeão: { pill: 'border-emerald-500/30 bg-emerald-500/10', text: 'text-emerald-300' },
  Bom: { pill: 'border-sky-500/30 bg-sky-500/10', text: 'text-sky-300' },
  Médio: { pill: 'border-amber-500/30 bg-amber-500/10', text: 'text-amber-300' },
  Fraco: { pill: 'border-red-500/30 bg-red-500/10', text: 'text-red-300' },
};

/** Ação sugerida por rótulo — deriva de `CLASSIFICACAO` do guia (Vencedor→Replicar … Fraco→Reformular). */
const ACAO_POR_ROTULO: Record<Rotulo, string> = {
  Campeão: 'Replicar tema, estrutura e gancho',
  Bom: 'Vale repetir com pequenos ajustes',
  Médio: 'Testar novo ângulo, capa ou gancho',
  Fraco: 'Reformular antes de repetir',
};

const CONFIANCA_TXT: Record<'baixa' | 'media' | 'boa', { label: string; tone: string }> = {
  baixa: { label: 'confiança baixa', tone: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  media: { label: 'confiança média', tone: 'border-sky-500/30 bg-sky-500/10 text-sky-300' },
  boa: { label: 'confiança boa', tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
};

const DISPLAY = { fontFamily: 'var(--font-display, inherit)' } as const;

function str(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}
function num(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Linha crua de `v_conteudo_desempenho` → números limpos para o motor. */
function toPostMetrics(r: Row, i: number): PostMetrics {
  return {
    id: str(r.id) || str(r.post_id) || `row-${i}`,
    formato: (str(r.formato) || 'post').toLowerCase(),
    data: str(r.data) || null,
    tema: str(r.tema) || null,
    alcance: num(r.alcance),
    comentarios: num(r.comentarios),
    visitasPerfil: num(r.visitas_perfil),
    salvamentos: num(r.salvamentos),
    compartilhamentos: num(r.compartilhamentos),
    seguidores: num(r.seguidores),
    curtidas: num(r.curtidas),
  };
}

function formatoLabel(f: string): string {
  return FORMATO_LABEL[f] ?? (f ? f[0].toUpperCase() + f.slice(1) : '—');
}

function tituloDe(p: PostMetrics): string {
  return (p.tema && p.tema.trim()) || `${formatoLabel(p.formato)} (sem tema)`;
}

/** Selo do Lead Score (número + rótulo). */
function ScoreBadge({ score, rotulo, big }: { score: number; rotulo: Rotulo; big?: boolean }) {
  const t = ROTULO_TONE[rotulo];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold ${t.pill} ${t.text} ${big ? 'text-sm' : 'text-[11px]'}`}
      title={`Lead Score ${score}/100 — ${rotulo}`}
    >
      <span style={DISPLAY} className={big ? 'text-base' : ''}>{score}</span>
      <span className="uppercase tracking-wide">{rotulo}</span>
    </span>
  );
}

function CampeaoCard({ sp, pos }: { sp: ScoredPost; pos: number }) {
  const p = sp.post;
  return (
    <div className="rounded-2xl border border-gray-700/60 bg-gray-800/60 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">#{pos}</span>
        <ScoreBadge score={sp.score} rotulo={sp.rotulo} big />
      </div>
      <div className="mt-2 line-clamp-2 text-sm font-semibold text-gray-100" style={DISPLAY}>
        {tituloDe(p)}
      </div>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
        <span>{formatoLabel(p.formato)}</span>
        {sp.taxaTop && (
          <span className="text-emerald-300/80">· puxado por {SINAL_LABEL[sp.taxaTop]}</span>
        )}
      </div>
      <div className="mt-2 rounded-lg bg-gray-900/50 px-2.5 py-1.5 text-[11px] text-gray-400">
        <span className="text-gray-500">→ </span>{ACAO_POR_ROTULO[sp.rotulo]}
      </div>
    </div>
  );
}

/** Cartão de padrão (melhor formato / melhor dia). */
function PadraoCard({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe: string }) {
  return (
    <div className="rounded-2xl border border-gray-700/60 bg-gray-800/60 p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{rotulo}</div>
      <div className="mt-1 text-xl font-bold text-gray-100" style={DISPLAY}>{valor}</div>
      <div className="mt-0.5 text-xs text-gray-500">{detalhe}</div>
    </div>
  );
}

export function ConteudoAnalise({ rows }: { rows: Row[] }) {
  const [objetivo, setObjetivo] = useState<Objetivo>('lead');

  const posts = useMemo(() => rows.map(toPostMetrics), [rows]);
  const ctx = useMemo(() => construirContexto(posts, objetivo), [posts, objetivo]);
  const { ranked, semAlcance } = useMemo(() => rankear(posts, ctx), [posts, ctx]);
  const porFormato = useMemo(() => agregarPorFormato(posts, ctx), [posts, ctx]);
  const porDia = useMemo(() => agregarPorDiaSemana(posts, ctx), [posts, ctx]);
  const conf = useMemo(() => nivelConfianca(posts), [posts]);

  const campeoes = ranked.slice(0, 3);
  const melhorFormato = porFormato[0];
  const melhorDia = porDia[0];
  const c = CONFIANCA_TXT[conf.nivel];

  return (
    <section className="rounded-3xl border border-gray-800 bg-gray-900/40 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-100" style={DISPLAY}>
            O que funciona pro nosso perfil
          </h3>
          <p className="text-xs text-gray-500">
            Ranking por Lead Score de funil — com base em todo o histórico medido.
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium ${c.tone}`}>
          {c.label} · {conf.n} {conf.n === 1 ? 'post' : 'posts'}
        </span>
      </div>

      {/* Seletor de objetivo */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Objetivo</span>
        {OBJETIVOS.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setObjetivo(o)}
            aria-pressed={objetivo === o}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              objetivo === o
                ? 'border-blue-500/60 bg-blue-500/15 text-blue-200'
                : 'border-gray-700 text-gray-300 hover:bg-gray-700/40'
            }`}
          >
            {OBJETIVO_LABEL[o]}
          </button>
        ))}
      </div>

      {conf.nivel === 'baixa' && (
        <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300/80">
          Poucos posts medidos ainda — a leitura usa benchmark de mercado, não a mediana do seu perfil.
          Conforme você medir mais conteúdos (ou sincronizar os Insights), fica mais preciso.
        </p>
      )}

      {ranked.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-gray-700/60 px-3 py-6 text-center text-sm text-gray-500">
          Ainda não há posts com alcance para analisar. Adicione medições (ou sincronize) na tela de desempenho.
        </p>
      ) : (
        <>
          {/* Padrões */}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {melhorFormato && (
              <PadraoCard
                rotulo="Formato que mais funciona"
                valor={formatoLabel(melhorFormato.formato)}
                detalhe={`Lead Score médio ${melhorFormato.scoreMedio}/100 · ${melhorFormato.n} ${melhorFormato.n === 1 ? 'post' : 'posts'}`}
              />
            )}
            {melhorDia && (
              <PadraoCard
                rotulo="Melhor dia p/ publicar"
                valor={melhorDia.label}
                detalhe={`Lead Score médio ${melhorDia.scoreMedio}/100 · ${melhorDia.n} ${melhorDia.n === 1 ? 'post' : 'posts'}`}
              />
            )}
          </div>

          {/* Campeões */}
          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Campeões</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {campeoes.map((sp, i) => (
                <CampeaoCard key={sp.id} sp={sp} pos={i + 1} />
              ))}
            </div>
          </div>

          <p className="mt-4 text-[11px] text-gray-600">
            Ranking completo por Lead Score fica na aba <span className="text-gray-400">Estrategista</span>.
          </p>
        </>
      )}

      {semAlcance.length > 0 && (
        <p className="mt-3 text-[11px] text-gray-600">
          {semAlcance.length} {semAlcance.length === 1 ? 'post' : 'posts'} sem dado de alcance ficaram de fora da análise.
        </p>
      )}
    </section>
  );
}
